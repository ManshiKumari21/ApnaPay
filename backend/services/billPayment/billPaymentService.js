const crypto = require('crypto');
const db = require('../../config/db');
const billFetchService = require('./billFetchService');
const billerService = require('./billerService');
const billValidationService = require('./billValidationService');
const DemoBillPaymentProvider = require('./DemoBillPaymentProvider');
const NotificationService = require('../notificationService');

class BillPaymentService {
  constructor() {
    this.provider = new DemoBillPaymentProvider();
  }

  /**
   * Helper: Generate a unique, professional transaction reference ID
   */
  _generateTxnReference() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `BP-${dateStr}-${rand}`;
  }

  /**
   * Helper: Mask consumer numbers for safe display
   */
  maskConsumerNumber(num) {
    if (!num) return '••••';
    const str = String(num).trim();
    if (str.length <= 4) return '••••' + str;
    const last4 = str.slice(-4);
    const maskedPrefix = '•'.repeat(Math.min(str.length - 4, 8));
    return `${maskedPrefix}${last4}`;
  }

  /**
   * Process a bill payment request
   */
  async processBillPayment({
    userId,
    billerId,
    consumerNumber,
    fetchReferenceId,
    amount,
    paymentMode = 'DEMO',
    idempotencyKey = null
  }) {
    if (!userId) {
      throw { status: 401, message: 'Authentication required to process bill payments.' };
    }

    const cleanMode = String(paymentMode || 'DEMO').trim().toUpperCase();
    const validModes = ['DEMO', 'WALLET', 'UPI', 'BANK_TRANSFER'];
    if (!validModes.includes(cleanMode)) {
      throw {
        status: 400,
        message: `Invalid paymentMode: "${paymentMode}". Allowed modes are: ${validModes.join(', ')}.`
      };
    }

    // 1. Check Idempotency Key if supplied
    if (idempotencyKey) {
      const [existingIdemp] = await db.execute(
        `SELECT bp.id, bp.txn_reference, bp.status, bp.amount, bp.created_at, b.biller_name
         FROM bill_payments bp
         JOIN billers b ON bp.biller_id = b.id
         WHERE bp.user_id = ? AND bp.idempotency_key = ?
         LIMIT 1`,
        [userId, idempotencyKey]
      );

      if (existingIdemp.length > 0) {
        const prev = existingIdemp[0];
        return {
          idempotentReplay: true,
          paymentId: prev.id,
          txnReference: prev.txn_reference,
          status: prev.status,
          amount: parseFloat(prev.amount),
          formattedAmount: `₹${parseFloat(prev.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          billerName: prev.biller_name,
          createdAt: prev.created_at,
          message: 'This payment request was already processed previously (Idempotent response).'
        };
      }
    }

    // 2. Validate bill through validation service (server-side verification)
    const valResult = await billValidationService.validateBillForPayment({
      userId,
      billerId,
      consumerNumber,
      fetchReferenceId,
      amount
    });

    // 3. Retrieve user profile
    const [users] = await db.execute(
      `SELECT id, full_name, email, phone FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    const user = users[0] || {};

    // 4. Retrieve stored fetch record & biller
    const billFetch = await billFetchService.getFetchByReference(fetchReferenceId, userId);
    const biller = await billerService.getBillerById(billerId);

    // 5. Begin MySQL Transaction
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // Check again inside transaction if this fetch has already been paid (concurrency check)
      const [fetchCheck] = await conn.execute(
        `SELECT id, is_paid, bill_status FROM bill_fetches WHERE id = ? FOR UPDATE`,
        [billFetch.id]
      );

      if (fetchCheck.length === 0 || fetchCheck[0].is_paid || fetchCheck[0].bill_status === 'paid') {
        throw {
          status: 409,
          message: 'This bill has already been paid or processed in another transaction.'
        };
      }

      const verifiedAmount = parseFloat(billFetch.bill_amount);

      // Handle WALLET Payment Mode Debit (if requested)
      let walletRecord = null;
      let ledgerTxnId = null;

      if (cleanMode === 'WALLET') {
        const [wallets] = await conn.execute(
          `SELECT id, available_balance, status FROM wallets WHERE user_id = ? FOR UPDATE`,
          [userId]
        );

        if (wallets.length === 0) {
          throw {
            status: 400,
            message: 'No active wallet found for your account. Please select DEMO payment mode or top up your wallet.'
          };
        }

        walletRecord = wallets[0];
        const currentBalance = parseFloat(walletRecord.available_balance);

        if (currentBalance < verifiedAmount) {
          throw {
            status: 400,
            message: `Insufficient wallet balance (Available: ₹${currentBalance.toFixed(2)}, Required: ₹${verifiedAmount.toFixed(2)}). Please choose another payment mode.`
          };
        }

        // Deduct wallet balance atomically
        await conn.execute(
          `UPDATE wallets SET available_balance = available_balance - ? WHERE id = ?`,
          [verifiedAmount, walletRecord.id]
        );
      }

      // 6. Process Payment via Provider
      const txnReference = this._generateTxnReference();
      const providerResult = await this.provider.processPayment({
        payment: { txnReference, amount: verifiedAmount },
        billFetch,
        biller,
        user,
        paymentMode: cleanMode
      });

      const paymentStatus = providerResult.status || 'SUCCESS';
      const isSuccess = paymentStatus === 'SUCCESS';
      const isPending = paymentStatus === 'PENDING';
      const failureReason = providerResult.failureReason || null;
      const providerReference = providerResult.providerReference || null;
      const paidAt = isSuccess ? new Date() : null;

      // 7. Insert into bill_payments
      const [insertPayment] = await conn.execute(
        `INSERT INTO bill_payments (
          user_id, biller_id, customer_reference, bill_reference, txn_reference,
          fetch_id, consumer_number, customer_name, amount, payment_mode,
          status, provider_reference, failure_reason, idempotency_key, due_date,
          paid_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          biller.id,
          billFetch.consumer_number,
          billFetch.bill_number,
          txnReference,
          billFetch.id,
          billFetch.consumer_number,
          billFetch.customer_name,
          verifiedAmount,
          cleanMode,
          paymentStatus,
          providerReference,
          failureReason,
          idempotencyKey || null,
          billFetch.due_date,
          paidAt,
          JSON.stringify({
            approvalCode: providerResult.approvalCode || null,
            provider: this.provider.providerCode,
            paymentMode: cleanMode,
            billerCode: biller.billerCode,
            billerName: biller.billerName,
            categoryName: biller.categoryName
          })
        ]
      );
      const paymentId = insertPayment.insertId;

      // 8. If WALLET payment succeeded, record ledger transactions and history
      if (cleanMode === 'WALLET' && isSuccess && walletRecord) {
        const [ledgerTxn] = await conn.execute(
          `INSERT INTO ledger_transactions (reference_type, reference_id, transaction_type, status, description)
           VALUES ('bill_payment', ?, 'bill_payment_debit', 'completed', ?)`,
          [paymentId, `Bill Payment to ${biller.billerName} (${txnReference})`]
        );
        ledgerTxnId = ledgerTxn.insertId;

        await conn.execute(
          `INSERT INTO ledger_entries (ledger_transaction_id, wallet_id, entry_type, amount)
           VALUES (?, ?, 'debit', ?)`,
          [ledgerTxnId, walletRecord.id, verifiedAmount]
        );

        // Record in transactions statement table
        await conn.execute(
          `INSERT INTO transactions (user_id, payment_id, transaction_type, amount, status, description)
           VALUES (?, NULL, 'bill_payment', ?, 'success', ?)`,
          [userId, verifiedAmount, `Utility Bill Payment: ${biller.billerName} (Ref: ${txnReference})`]
        );
      } else if (cleanMode === 'WALLET' && !isSuccess && walletRecord) {
        // Rollback wallet deduction if provider rejected payment
        await conn.execute(
          `UPDATE wallets SET available_balance = available_balance + ? WHERE id = ?`,
          [verifiedAmount, walletRecord.id]
        );
      }

      // 9. Update bill_fetches status
      if (isSuccess) {
        await conn.execute(
          `UPDATE bill_fetches SET is_paid = TRUE, bill_status = 'paid' WHERE id = ?`,
          [billFetch.id]
        );
      }

      // 10. Audit event in bill_payment_events
      await conn.execute(
        `INSERT INTO bill_payment_events (payment_id, event_type, event_status, payload)
         VALUES (?, 'PAYMENT_PROCESSED', ?, ?)`,
        [
          paymentId,
          paymentStatus,
          JSON.stringify({
            txnReference,
            providerReference,
            failureReason,
            mode: cleanMode
          })
        ]
      );

      // Commit transaction
      await conn.commit();

      // 11. Dispatch Notification asynchronously (outside transaction)
      try {
        if (isSuccess) {
          await NotificationService.notify({
            userId,
            title: 'Bill Payment Successful',
            message: `Your payment of ₹${verifiedAmount.toFixed(2)} to ${biller.billerName} was successful. Ref: ${txnReference}`,
            category: 'payment',
            type: 'success',
            referenceId: paymentId,
            referenceType: 'bill_payment'
          });
        } else if (isPending) {
          await NotificationService.notify({
            userId,
            title: 'Bill Payment Pending',
            message: `Your payment of ₹${verifiedAmount.toFixed(2)} to ${biller.billerName} is being processed. Ref: ${txnReference}`,
            category: 'payment',
            type: 'info',
            referenceId: paymentId,
            referenceType: 'bill_payment'
          });
        }
      } catch (notifErr) {
        console.warn('Bill Payment Notification dispatch failed:', notifErr.message);
      }

      return {
        paymentId,
        txnReference,
        status: paymentStatus,
        biller: {
          id: biller.id,
          name: biller.billerName,
          code: biller.billerCode,
          categoryName: biller.categoryName
        },
        consumerNumber: billFetch.consumer_number,
        maskedConsumerNumber: this.maskConsumerNumber(billFetch.consumer_number),
        customerName: billFetch.customer_name,
        billNumber: billFetch.bill_number,
        amount: verifiedAmount,
        formattedAmount: `₹${verifiedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMode: cleanMode,
        providerReference,
        failureReason,
        paidAt: paidAt ? paidAt.toISOString() : null,
        createdAt: new Date().toISOString(),
        isDemo: true,
        receipt: {
          receiptNo: `REC-${txnReference}`,
          transactionDate: new Date().toISOString(),
          paymentChannel: cleanMode === 'WALLET' ? 'ApnaPay Wallet Balance' : 'ApnaPay Instant BBPS Demo Gateway',
          status: paymentStatus
        }
      };

    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Get single bill payment by ID or Txn Reference (owner-restricted)
   */
  async getPaymentById(paymentIdOrRef, userId) {
    if (!paymentIdOrRef) {
      throw { status: 400, message: 'Payment ID or Transaction Reference is required.' };
    }

    let query = `
      SELECT bp.*, b.biller_name, b.biller_code, b.param_name,
             c.category_name, c.category_key, c.icon AS category_icon
      FROM bill_payments bp
      JOIN billers b ON bp.biller_id = b.id
      JOIN bill_categories c ON b.category_id = c.id
      WHERE bp.user_id = ? AND 
    `;
    const params = [userId];

    if (!isNaN(paymentIdOrRef) && Number.isInteger(Number(paymentIdOrRef))) {
      query += `(bp.id = ? OR bp.txn_reference = ?) LIMIT 1`;
      params.push(Number(paymentIdOrRef), String(paymentIdOrRef));
    } else {
      query += `bp.txn_reference = ? LIMIT 1`;
      params.push(String(paymentIdOrRef));
    }

    const [rows] = await db.execute(query, params);

    if (rows.length === 0) {
      throw {
        status: 404,
        message: 'Bill payment record not found or you are not authorized to view it.'
      };
    }

    const r = rows[0];
    const amountNum = parseFloat(r.amount);

    return {
      paymentId: r.id,
      txnReference: r.txn_reference || `BP-${r.id}`,
      biller: {
        id: r.biller_id,
        billerName: r.biller_name,
        billerCode: r.biller_code,
        categoryName: r.category_name,
        categoryKey: r.category_key,
        icon: r.category_icon
      },
      consumerNumber: r.consumer_number || r.customer_reference,
      maskedConsumerNumber: this.maskConsumerNumber(r.consumer_number || r.customer_reference),
      customerName: r.customer_name || 'Valued Customer',
      billNumber: r.bill_reference,
      amount: amountNum,
      formattedAmount: `₹${amountNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      paymentMode: r.payment_mode || 'DEMO',
      status: r.status,
      providerReference: r.provider_reference,
      failureReason: r.failure_reason,
      dueDate: r.due_date,
      paidAt: r.paid_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      isDemo: true
    };
  }

  /**
   * Get bill payments history for the authenticated user with filters and pagination
   */
  async getPaymentHistory({
    userId,
    category = null,
    billerId = null,
    status = null,
    startDate = null,
    endDate = null,
    search = '',
    page = 1,
    limit = 10
  }) {
    if (!userId) {
      throw { status: 401, message: 'Authentication required.' };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = `WHERE bp.user_id = ?`;
    const params = [userId];

    if (category) {
      whereClause += ` AND (c.category_key = ? OR LOWER(c.category_name) = ?)`;
      params.push(category.toLowerCase(), category.toLowerCase());
    }

    if (billerId) {
      whereClause += ` AND bp.biller_id = ?`;
      params.push(billerId);
    }

    if (status) {
      whereClause += ` AND LOWER(bp.status) = ?`;
      params.push(status.toLowerCase());
    }

    if (startDate) {
      whereClause += ` AND bp.created_at >= ?`;
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      whereClause += ` AND bp.created_at <= ?`;
      params.push(`${endDate} 23:59:59`);
    }

    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      whereClause += ` AND (b.biller_name LIKE ? OR bp.txn_reference LIKE ? OR bp.consumer_number LIKE ?)`;
      params.push(term, term, term);
    }

    // 1. Get total count
    const countSql = `
      SELECT COUNT(*) AS total
      FROM bill_payments bp
      JOIN billers b ON bp.biller_id = b.id
      JOIN bill_categories c ON b.category_id = c.id
      ${whereClause}
    `;
    const [countRows] = await db.execute(countSql, params);
    const totalRecords = countRows[0]?.total || 0;

    // 2. Fetch paginated records
    const dataSql = `
      SELECT bp.id, bp.txn_reference, bp.amount, bp.payment_mode, bp.status,
             bp.consumer_number, bp.customer_name, bp.bill_reference,
             bp.provider_reference, bp.failure_reason, bp.paid_at, bp.created_at,
             b.id AS biller_id, b.biller_name, b.biller_code, b.param_name,
             c.id AS category_id, c.category_name, c.category_key, c.icon AS category_icon
      FROM bill_payments bp
      JOIN billers b ON bp.biller_id = b.id
      JOIN bill_categories c ON b.category_id = c.id
      ${whereClause}
      ORDER BY bp.id DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [rows] = await db.execute(dataSql, params);

    const records = rows.map(r => {
      const amt = parseFloat(r.amount);
      return {
        id: r.id,
        txnReference: r.txn_reference || `BP-${r.id}`,
        billerName: r.biller_name,
        billerCode: r.biller_code,
        category: {
          id: r.category_id,
          name: r.category_name,
          key: r.category_key,
          icon: r.category_icon
        },
        consumerNumber: r.consumer_number,
        maskedConsumerNumber: this.maskConsumerNumber(r.consumer_number),
        customerName: r.customer_name,
        amount: amt,
        formattedAmount: `₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paymentMode: r.payment_mode || 'DEMO',
        status: r.status,
        providerReference: r.provider_reference,
        failureReason: r.failure_reason,
        paidAt: r.paid_at,
        createdAt: r.created_at
      };
    });

    return {
      records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum) || 1,
        hasNextPage: pageNum * limitNum < totalRecords,
        hasPrevPage: pageNum > 1
      }
    };
  }
}

module.exports = new BillPaymentService();

