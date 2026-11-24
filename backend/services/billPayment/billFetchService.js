const crypto = require('crypto');
const db = require('../../config/db');
const billerService = require('./billerService');
const DemoBillPaymentProvider = require('./DemoBillPaymentProvider');

class BillFetchService {
  constructor() {
    this.provider = new DemoBillPaymentProvider();
  }

  /**
   * Helper: Generate a unique, readable fetch reference ID
   */
  _generateFetchReference() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `BF-${ts}-${rand}`;
  }

  /**
   * Fetch bill from provider & save in bill_fetches
   */
  async fetchBill({ userId, billerId, consumerNumber }) {
    if (!userId) {
      throw { status: 401, message: 'Authentication required to fetch bills.' };
    }

    if (!billerId) {
      throw { status: 400, message: 'Biller ID is required.' };
    }

    // 1. Validate Biller
    const biller = await billerService.getBillerById(billerId);
    if (!biller) {
      throw { status: 404, message: 'Selected biller not found or is currently inactive.' };
    }

    // 2. Validate Consumer Number according to biller's configuration
    const valResult = billerService.validateConsumerNumber(biller, consumerNumber);
    if (!valResult.valid) {
      throw { status: 400, message: valResult.error };
    }
    const cleanConsumerNumber = valResult.cleanValue;

    // 3. Fetch user record for personalization
    const [userRows] = await db.execute(
      `SELECT id, full_name, email, phone FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    const user = userRows[0] || null;

    // 4. Delegate to BillPaymentProvider
    const billData = await this.provider.fetchBill({
      biller,
      consumerNumber: cleanConsumerNumber,
      user
    });

    const fetchReferenceId = this._generateFetchReference();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes valid session
    const isPaid = billData.billStatus === 'paid';

    // 5. Store fetched bill record in bill_fetches table
    const [insertResult] = await db.execute(
      `INSERT INTO bill_fetches (
        fetch_reference, user_id, biller_id, consumer_number, customer_name,
        bill_number, bill_date, due_date, bill_amount, bill_period, bill_status,
        description, metadata, expires_at, is_paid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fetchReferenceId,
        userId,
        biller.id,
        cleanConsumerNumber,
        billData.customerName,
        billData.billNumber,
        billData.billDate,
        billData.dueDate,
        billData.billAmount,
        billData.billPeriod || null,
        billData.billStatus,
        billData.description || null,
        JSON.stringify(billData.metadata || {}),
        expiresAt,
        isPaid
      ]
    );

    return {
      fetchReferenceId,
      fetchId: insertResult.insertId,
      biller: {
        id: biller.id,
        billerName: biller.billerName,
        billerCode: biller.billerCode,
        categoryName: biller.categoryName,
        paramName: biller.paramName
      },
      consumerNumber: cleanConsumerNumber,
      customerName: billData.customerName,
      billNumber: billData.billNumber,
      billDate: billData.billDate,
      dueDate: billData.dueDate,
      billAmount: billData.billAmount,
      formattedAmount: `₹${billData.billAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      billPeriod: billData.billPeriod,
      billStatus: billData.billStatus,
      description: billData.description,
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds: 1800,
      isPayable: !isPaid && billData.billAmount > 0,
      isDemo: true
    };
  }

  /**
   * Get bill fetch record by reference, enforcing user ownership
   */
  async getFetchByReference(fetchReference, userId) {
    if (!fetchReference) return null;

    const [rows] = await db.execute(
      `SELECT bf.*, b.biller_name, b.biller_code, b.param_name, c.category_name, c.category_key
       FROM bill_fetches bf
       JOIN billers b ON bf.biller_id = b.id
       JOIN bill_categories c ON b.category_id = c.id
       WHERE bf.fetch_reference = ? AND bf.user_id = ?
       LIMIT 1`,
      [fetchReference, userId]
    );

    if (rows.length === 0) return null;
    return rows[0];
  }
}

module.exports = new BillFetchService();

