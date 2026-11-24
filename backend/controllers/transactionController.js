const db = require('../config/db');

// Helper: Format amount as Indian Rupee string
const formatCurrency = (amount, currency = 'INR') => {
    const num = parseFloat(amount) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper: Ensure 2 decimal places float
const toDecimal = (num) => {
    return parseFloat(parseFloat(num || 0).toFixed(2));
};

// Helper: Validate YYYY-MM-DD date string
const isValidDateString = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
};

// Helper: Determine Credit or Debit entry type
const determineEntryType = (transactionType, senderUserId, receiverUserId, currentUserId) => {
    if (senderUserId && receiverUserId) {
        if (Number(receiverUserId) === Number(currentUserId)) return 'credit';
        if (Number(senderUserId) === Number(currentUserId)) return 'debit';
    }

    const typeStr = String(transactionType || '').trim().toLowerCase();
    const creditKeywords = ['credit', 'deposit', 'wallet_topup', 'topup', 'refund', 'cashback', 'received', 'reward', 'reversal'];
    for (const kw of creditKeywords) {
        if (typeStr.includes(kw)) return 'credit';
    }

    return 'debit';
};

// Helper: Generate reference identifier
const generateReferenceId = (row) => {
    if (row.payment_reference) return row.payment_reference;
    if (row.provider_reference) return row.provider_reference;
    if (row.transfer_id) return `TRF${row.transfer_id}`;
    if (row.refund_id) return `RFD${row.refund_id}`;
    return `TXN${row.id}`;
};

// Helper: Generate CSV content
const generateCsvContent = (transactions, user) => {
    const headers = [
        'Transaction ID',
        'Date & Time',
        'Reference ID',
        'Transaction Type',
        'Entry Type',
        'Amount (INR)',
        'Status',
        'Payment Method',
        'Bank Name',
        'Description'
    ];

    const escapeCsvField = (field) => {
        if (field === null || field === undefined) return '""';
        const str = String(field);
        return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = [headers.map(escapeCsvField).join(',')];

    transactions.forEach(t => {
        const dateFormatted = t.createdAt ? new Date(t.createdAt).toISOString().replace('T', ' ').slice(0, 19) : '';
        rows.push([
            escapeCsvField(t.id),
            escapeCsvField(dateFormatted),
            escapeCsvField(t.referenceId),
            escapeCsvField(t.transactionType),
            escapeCsvField(t.entryType),
            escapeCsvField(t.amount.toFixed(2)),
            escapeCsvField(t.status),
            escapeCsvField(t.paymentMethod || 'N/A'),
            escapeCsvField(t.bankName || 'N/A'),
            escapeCsvField(t.description || '')
        ].join(','));
    });

    return rows.join('\r\n');
};

// Helper: Generate PDF Document Buffer (PDF 1.4 Native)
const generatePdfDocument = (transactions, user, summary) => {
    const lines = [
        '================================================================================',
        '                        APNAPAY TRANSACTION STATEMENT                           ',
        '================================================================================',
        '',
        `Account Holder: ${user.full_name || 'Valued Customer'}`,
        `Account Email : ${user.email || 'N/A'} | Phone: ${user.phone || 'N/A'}`,
        `Generated On  : ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`,
        `Total Credits : INR ${(summary.totalCredit || 0).toFixed(2)} | Total Debits: INR ${(summary.totalDebit || 0).toFixed(2)}`,
        `Net Flow      : INR ${(summary.netAmount || 0).toFixed(2)} | Total Transactions: ${transactions.length}`,
        '--------------------------------------------------------------------------------',
        'TXN ID   DATE        TYPE        AMOUNT (INR)  STATUS      REFERENCE',
        '--------------------------------------------------------------------------------',
    ];

    transactions.slice(0, 45).forEach(t => {
        const idStr = String(t.id).padEnd(8);
        const dateStr = String(t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : 'N/A').padEnd(12);
        const typeStr = String(t.transactionType || 'txn').slice(0, 10).padEnd(12);
        const sign = t.entryType === 'credit' ? '+' : '-';
        const amtStr = (sign + Number(t.amount).toFixed(2)).padEnd(14);
        const statusStr = String(t.status || 'N/A').slice(0, 10).padEnd(12);
        const refStr = String(t.referenceId || 'N/A').slice(0, 16);
        lines.push(`${idStr}${dateStr}${typeStr}${amtStr}${statusStr}${refStr}`);
    });

    if (transactions.length > 45) {
        lines.push(`... and ${transactions.length - 45} additional transactions`);
    }

    lines.push('--------------------------------------------------------------------------------');
    lines.push('               Thank you for banking with ApnaPay. Keep transacting!            ');

    const escapePdf = (str) => String(str).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

    let streamContent = 'BT\n/F1 9 Tf\n13 TL\n50 740 Td\n';
    lines.forEach((line, idx) => {
        if (idx === 0) {
            streamContent += `(${escapePdf(line)}) Tj\n`;
        } else {
            streamContent += `T*\n(${escapePdf(line)}) Tj\n`;
        }
    });
    streamContent += 'ET';

    const streamLength = Buffer.byteLength(streamContent, 'utf-8');

    const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
    const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
    const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n';

    const header = '%PDF-1.4\n';
    let offset = Buffer.byteLength(header, 'utf-8');

    const offsets = [];
    [obj1, obj2, obj3, obj4, obj5].forEach(obj => {
        offsets.push(offset);
        offset += Buffer.byteLength(obj, 'utf-8');
    });

    let xref = 'xref\n0 6\n0000000000 65535 f \n';
    offsets.forEach(off => {
        xref += String(off).padStart(10, '0') + ' 00000 n \n';
    });

    const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;

    return Buffer.from(header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer, 'utf-8');
};

// ==========================================
// 1. GET /api/transactions - Get Transaction List
// ==========================================
exports.getTransactions = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        // 1. Pagination Parameters
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        // 2. Filter Parameters
        const typeFilter = req.query.type ? String(req.query.type).trim().toLowerCase() : 'all';
        const statusFilter = req.query.status ? String(req.query.status).trim().toLowerCase() : 'all';
        const startDate = req.query.startDate ? String(req.query.startDate).trim() : null;
        const endDate = req.query.endDate ? String(req.query.endDate).trim() : null;
        const search = req.query.search ? String(req.query.search).trim() : null;
        const sortOrder = req.query.sort && String(req.query.sort).trim().toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        // Validate date filters
        if (startDate && !isValidDateString(startDate)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid startDate format. Please use YYYY-MM-DD.'
            });
        }
        if (endDate && !isValidDateString(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid endDate format. Please use YYYY-MM-DD.'
            });
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'startDate cannot be after endDate.'
            });
        }

        // Build dynamic WHERE clauses
        const whereClauses = ['t.user_id = ?'];
        const queryParams = [userId];

        // Status Filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'success' || statusFilter === 'completed') {
                whereClauses.push("t.status IN ('completed', 'success')");
            } else if (statusFilter === 'pending') {
                whereClauses.push("t.status IN ('pending', 'initiated', 'processing')");
            } else if (statusFilter === 'failed') {
                whereClauses.push("t.status IN ('failed', 'declined', 'rejected', 'cancelled')");
            } else {
                whereClauses.push('t.status = ?');
                queryParams.push(statusFilter);
            }
        }

        // Date Range Filters
        if (startDate) {
            whereClauses.push('t.created_at >= ?');
            queryParams.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            whereClauses.push('t.created_at <= ?');
            queryParams.push(`${endDate} 23:59:59`);
        }

        // Search Filter (by transaction id, public_id, provider_reference, description)
        if (search) {
            const isNumericId = /^\d+$/.test(search);
            if (isNumericId) {
                whereClauses.push('(t.id = ? OR p.public_id = ? OR p.provider_reference = ? OR t.description LIKE ?)');
                queryParams.push(Number(search), search, search, `%${search}%`);
            } else {
                whereClauses.push('(p.public_id LIKE ? OR p.provider_reference LIKE ? OR t.description LIKE ? OR t.transaction_type LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }
        }

        const whereSql = whereClauses.join(' AND ');

        // 1. Total Count Query
        const countSql = `
            SELECT COUNT(*) AS total
            FROM transactions t
            LEFT JOIN payments p ON t.payment_id = p.id
            LEFT JOIN transfers tr ON t.transfer_id = tr.id
            WHERE ${whereSql}
        `;
        const [countResult] = await db.execute(countSql, queryParams);
        const totalRecords = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);

        // 2. Paginated Data Query
        const dataSql = `
            SELECT 
                t.id,
                t.user_id,
                t.payment_id,
                t.transfer_id,
                t.refund_id,
                t.transaction_type,
                t.amount,
                t.status,
                t.description,
                t.created_at,
                p.public_id AS payment_reference,
                p.provider_reference,
                p.payment_method,
                p.currency,
                b.bank_name,
                b.account_last4,
                tr.sender_user_id,
                tr.receiver_user_id,
                tr.receiver_upi_id,
                tr.receiver_account_last4,
                sender.full_name AS sender_name,
                receiver.full_name AS receiver_name
            FROM transactions t
            LEFT JOIN payments p ON t.payment_id = p.id
            LEFT JOIN bank_accounts b ON p.bank_account_id = b.id
            LEFT JOIN transfers tr ON t.transfer_id = tr.id
            LEFT JOIN users sender ON tr.sender_user_id = sender.id
            LEFT JOIN users receiver ON tr.receiver_user_id = receiver.id
            WHERE ${whereSql}
            ORDER BY t.created_at ${sortOrder}, t.id ${sortOrder}
            LIMIT ${Number(limit)} OFFSET ${Number(offset)}
        `;

        const [rows] = await db.execute(dataSql, queryParams);

        // Map and format results
        let transactions = rows.map((r) => {
            const entryType = determineEntryType(r.transaction_type, r.sender_user_id, r.receiver_user_id, userId);
            const amountVal = toDecimal(r.amount);
            const refId = generateReferenceId(r);

            let transferDetails = null;
            if (r.transfer_id) {
                transferDetails = {
                    senderId: r.sender_user_id,
                    senderName: r.sender_name || null,
                    receiverId: r.receiver_user_id || null,
                    receiverName: r.receiver_name || null,
                    receiverUpiId: r.receiver_upi_id || null,
                    receiverAccountLast4: r.receiver_account_last4 || null
                };
            }

            return {
                id: r.id,
                amount: amountVal,
                formattedAmount: `${entryType === 'credit' ? '+' : '-'}₹${amountVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                currency: r.currency || 'INR',
                transactionType: r.transaction_type,
                entryType,
                status: r.status,
                description: r.description || (entryType === 'credit' ? 'Payment Received' : 'Payment Sent'),
                referenceId: refId,
                paymentMethod: r.payment_method || 'wallet',
                bankName: r.bank_name || null,
                accountLast4: r.account_last4 || null,
                transferDetails,
                createdAt: r.created_at
            };
        });

        // Filter by entry type (credit/debit) if specified
        if (typeFilter === 'credit' || typeFilter === 'debit') {
            transactions = transactions.filter(t => t.entryType === typeFilter);
        } else if (typeFilter !== 'all') {
            transactions = transactions.filter(t => t.transactionType.toLowerCase() === typeFilter);
        }

        return res.status(200).json({
            success: true,
            message: 'Transactions retrieved successfully.',
            data: {
                pagination: {
                    totalRecords,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                filters: {
                    type: typeFilter,
                    status: statusFilter,
                    startDate: startDate || null,
                    endDate: endDate || null,
                    search: search || null,
                    sort: sortOrder.toLowerCase()
                },
                transactions
            }
        });

    } catch (error) {
        console.error('Get Transactions Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve transaction history. Please try again.'
        });
    }
};

// ==========================================
// 2. GET /api/transactions/:id - Get Transaction Details
// ==========================================
exports.getTransactionById = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const rawId = req.params.id;
        if (!rawId || !/^\d+$/.test(rawId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction ID format.'
            });
        }

        const transactionId = parseInt(rawId, 10);

        // Fetch transaction verifying user ownership
        const [rows] = await db.execute(
            `SELECT 
                t.id,
                t.user_id,
                t.payment_id,
                t.transfer_id,
                t.refund_id,
                t.transaction_type,
                t.amount,
                t.status,
                t.description,
                t.created_at,
                p.public_id AS payment_reference,
                p.provider_reference,
                p.payment_method,
                p.currency,
                b.bank_name,
                b.account_last4,
                tr.sender_user_id,
                tr.receiver_user_id,
                tr.receiver_upi_id,
                tr.receiver_account_last4,
                sender.full_name AS sender_name,
                receiver.full_name AS receiver_name,
                r.amount AS refund_amount,
                r.reason AS refund_reason,
                r.status AS refund_status
            FROM transactions t
            LEFT JOIN payments p ON t.payment_id = p.id
            LEFT JOIN bank_accounts b ON p.bank_account_id = b.id
            LEFT JOIN transfers tr ON t.transfer_id = tr.id
            LEFT JOIN users sender ON tr.sender_user_id = sender.id
            LEFT JOIN users receiver ON tr.receiver_user_id = receiver.id
            LEFT JOIN refunds r ON t.refund_id = r.id
            WHERE t.id = ?`,
            [transactionId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found.'
            });
        }

        const row = rows[0];

        // Enforce user ownership: one user cannot access another user's transaction!
        if (Number(row.user_id) !== Number(userId)) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found.'
            });
        }

        const entryType = determineEntryType(row.transaction_type, row.sender_user_id, row.receiver_user_id, userId);
        const amountVal = toDecimal(row.amount);
        const refId = generateReferenceId(row);

        let bankDetails = null;
        if (row.bank_name || row.account_last4) {
            bankDetails = {
                bankName: row.bank_name || 'Bank Account',
                accountLast4: row.account_last4 || null,
                maskedAccountNumber: row.account_last4 ? `••••••••${row.account_last4}` : null
            };
        }

        let transferDetails = null;
        let senderDetails = null;
        let receiverDetails = null;
        if (row.transfer_id) {
            senderDetails = {
                senderId: row.sender_user_id,
                name: row.sender_name || 'Self / Payer'
            };
            receiverDetails = {
                receiverId: row.receiver_user_id || null,
                name: row.receiver_name || (row.receiver_upi_id ? 'UPI Payee' : 'Payee'),
                upiId: row.receiver_upi_id || null,
                accountLast4: row.receiver_account_last4 || null
            };
            transferDetails = {
                senderId: row.sender_user_id,
                senderName: row.sender_name || 'Self / Payer',
                receiverId: row.receiver_user_id || null,
                receiverName: row.receiver_name || null,
                receiverUpiId: row.receiver_upi_id || null,
                receiverAccountLast4: row.receiver_account_last4 || null
            };
        }

        let refundDetails = null;
        if (row.refund_id) {
            refundDetails = {
                refundId: row.refund_id,
                amount: toDecimal(row.refund_amount),
                reason: row.refund_reason || 'Customer requested refund',
                status: row.refund_status || 'completed'
            };
        }

        return res.status(200).json({
            success: true,
            message: 'Transaction details retrieved successfully.',
            data: {
                id: row.id,
                amount: amountVal,
                formattedAmount: `${entryType === 'credit' ? '+' : '-'}₹${amountVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                currency: row.currency || 'INR',
                transactionType: row.transaction_type,
                entryType,
                status: row.status,
                description: row.description || (entryType === 'credit' ? 'Payment Received' : 'Payment Sent'),
                referenceId: refId,
                paymentMethod: row.payment_method || 'wallet',
                bankDetails,
                transferDetails,
                senderDetails,
                receiverDetails,
                refundDetails,
                createdAt: row.created_at
            }
        });

    } catch (error) {
        console.error('Get Transaction Details Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve transaction details. Please try again.'
        });
    }
};

// ==========================================
// 3. GET /api/transactions/summary - Get Credits and Debits Summary
// ==========================================
exports.getTransactionSummary = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const period = req.query.period ? String(req.query.period).trim().toLowerCase() : 'all';
        const startDate = req.query.startDate ? String(req.query.startDate).trim() : null;
        const endDate = req.query.endDate ? String(req.query.endDate).trim() : null;

        // Validate custom dates
        if (startDate && !isValidDateString(startDate)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid startDate format. Please use YYYY-MM-DD.'
            });
        }
        if (endDate && !isValidDateString(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid endDate format. Please use YYYY-MM-DD.'
            });
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'startDate cannot be after endDate.'
            });
        }

        const whereClauses = ['t.user_id = ?'];
        const queryParams = [userId];
        let periodLabel = 'Lifetime';

        if (startDate || endDate) {
            periodLabel = `Custom (${startDate || 'Start'} to ${endDate || 'Now'})`;
            if (startDate) {
                whereClauses.push('t.created_at >= ?');
                queryParams.push(`${startDate} 00:00:00`);
            }
            if (endDate) {
                whereClauses.push('t.created_at <= ?');
                queryParams.push(`${endDate} 23:59:59`);
            }
        } else if (period) {
            if (period === 'today') {
                periodLabel = 'Today';
                whereClauses.push('t.created_at >= CURDATE()');
            } else if (period === 'weekly' || period === 'week') {
                periodLabel = 'Last 7 Days';
                whereClauses.push('t.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
            } else if (period === 'monthly' || period === 'month') {
                periodLabel = 'Current Month';
                whereClauses.push("t.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00')");
            } else if (period === 'all') {
                periodLabel = 'Lifetime';
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid period. Allowed values: 'today', 'weekly', 'monthly', 'all'."
                });
            }
        }

        const whereSql = whereClauses.join(' AND ');

        // Fetch all matching rows for accurate credit/debit calculation
        const [rows] = await db.execute(
            `SELECT 
                t.id,
                t.transaction_type,
                t.amount,
                t.status,
                t.created_at,
                tr.sender_user_id,
                tr.receiver_user_id
            FROM transactions t
            LEFT JOIN transfers tr ON t.transfer_id = tr.id
            WHERE ${whereSql}`,
            queryParams
        );

        let totalCredit = 0;
        let totalDebit = 0;
        let successfulCount = 0;
        let pendingCount = 0;
        let failedCount = 0;

        rows.forEach(r => {
            const entryType = determineEntryType(r.transaction_type, r.sender_user_id, r.receiver_user_id, userId);
            const amt = parseFloat(r.amount) || 0;
            const status = String(r.status || '').toLowerCase();

            if (status === 'completed' || status === 'success') {
                successfulCount++;
                if (entryType === 'credit') {
                    totalCredit += amt;
                } else {
                    totalDebit += amt;
                }
            } else if (status === 'pending' || status === 'initiated' || status === 'processing') {
                pendingCount++;
            } else if (status === 'failed' || status === 'declined' || status === 'rejected' || status === 'cancelled') {
                failedCount++;
            }
        });

        const totalTransactions = rows.length;
        const netAmount = toDecimal(totalCredit - totalDebit);

        return res.status(200).json({
            success: true,
            message: 'Transaction summary retrieved successfully.',
            data: {
                period: periodLabel,
                filters: {
                    period: period || 'all',
                    startDate: startDate || null,
                    endDate: endDate || null
                },
                currency: 'INR',
                totalCredit: toDecimal(totalCredit),
                formattedTotalCredit: formatCurrency(totalCredit),
                totalDebit: toDecimal(totalDebit),
                formattedTotalDebit: formatCurrency(totalDebit),
                netAmount,
                formattedNetAmount: formatCurrency(netAmount),
                counts: {
                    totalTransactions,
                    successfulTransactions: successfulCount,
                    pendingTransactions: pendingCount,
                    failedTransactions: failedCount
                }
            }
        });

    } catch (error) {
        console.error('Transaction Summary Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve transaction summary. Please try again.'
        });
    }
};

// ==========================================
// 4. GET /api/transactions/export - Export Transaction Statement
// ==========================================
exports.exportTransactions = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const exportFormat = req.query.format ? String(req.query.format).trim().toLowerCase() : 'csv';
        if (!['csv', 'pdf'].includes(exportFormat)) {
            return res.status(400).json({
                success: false,
                message: "Invalid format. Supported export formats are 'csv' and 'pdf'."
            });
        }

        const typeFilter = req.query.type ? String(req.query.type).trim().toLowerCase() : 'all';
        const statusFilter = req.query.status ? String(req.query.status).trim().toLowerCase() : 'all';
        const startDate = req.query.startDate ? String(req.query.startDate).trim() : null;
        const endDate = req.query.endDate ? String(req.query.endDate).trim() : null;

        if (startDate && !isValidDateString(startDate)) {
            return res.status(400).json({ success: false, message: 'Invalid startDate format (YYYY-MM-DD).' });
        }
        if (endDate && !isValidDateString(endDate)) {
            return res.status(400).json({ success: false, message: 'Invalid endDate format (YYYY-MM-DD).' });
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ success: false, message: 'startDate cannot be after endDate.' });
        }

        // Fetch user information
        const [users] = await db.execute(
            `SELECT full_name, email, phone FROM users WHERE id = ? LIMIT 1`,
            [userId]
        );
        const user = users[0] || { full_name: 'Customer', email: '', phone: '' };

        // Build WHERE clauses
        const whereClauses = ['t.user_id = ?'];
        const queryParams = [userId];

        if (statusFilter !== 'all') {
            if (statusFilter === 'success' || statusFilter === 'completed') {
                whereClauses.push("t.status IN ('completed', 'success')");
            } else if (statusFilter === 'pending') {
                whereClauses.push("t.status IN ('pending', 'initiated', 'processing')");
            } else if (statusFilter === 'failed') {
                whereClauses.push("t.status IN ('failed', 'declined', 'rejected', 'cancelled')");
            } else {
                whereClauses.push('t.status = ?');
                queryParams.push(statusFilter);
            }
        }

        if (startDate) {
            whereClauses.push('t.created_at >= ?');
            queryParams.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            whereClauses.push('t.created_at <= ?');
            queryParams.push(`${endDate} 23:59:59`);
        }

        const whereSql = whereClauses.join(' AND ');

        // Fetch up to 5000 transactions for export
        const [rows] = await db.execute(
            `SELECT 
                t.id,
                t.transaction_type,
                t.amount,
                t.status,
                t.description,
                t.created_at,
                p.public_id AS payment_reference,
                p.provider_reference,
                p.payment_method,
                b.bank_name,
                b.account_last4,
                tr.sender_user_id,
                tr.receiver_user_id
            FROM transactions t
            LEFT JOIN payments p ON t.payment_id = p.id
            LEFT JOIN bank_accounts b ON p.bank_account_id = b.id
            LEFT JOIN transfers tr ON t.transfer_id = tr.id
            WHERE ${whereSql}
            ORDER BY t.created_at DESC, t.id DESC
            LIMIT 5000`,
            queryParams
        );

        let transactions = rows.map((r) => {
            const entryType = determineEntryType(r.transaction_type, r.sender_user_id, r.receiver_user_id, userId);
            const amountVal = toDecimal(r.amount);
            const refId = generateReferenceId(r);

            return {
                id: r.id,
                amount: amountVal,
                transactionType: r.transaction_type,
                entryType,
                status: r.status,
                description: r.description,
                referenceId: refId,
                paymentMethod: r.payment_method || 'wallet',
                bankName: r.bank_name || null,
                accountLast4: r.account_last4 || null,
                createdAt: r.created_at
            };
        });

        // Apply type filter if requested
        if (typeFilter === 'credit' || typeFilter === 'debit') {
            transactions = transactions.filter(t => t.entryType === typeFilter);
        } else if (typeFilter !== 'all') {
            transactions = transactions.filter(t => t.transactionType.toLowerCase() === typeFilter);
        }

        const timestampStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);

        // 1. PDF Export
        if (exportFormat === 'pdf') {
            let totalCredit = 0;
            let totalDebit = 0;
            transactions.forEach(t => {
                if (t.status === 'completed' || t.status === 'success') {
                    if (t.entryType === 'credit') totalCredit += t.amount;
                    else totalDebit += t.amount;
                }
            });
            const summary = { totalCredit, totalDebit, netAmount: totalCredit - totalDebit };
            const pdfBuffer = generatePdfDocument(transactions, user, summary);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="ApnaPay_Statement_${userId}_${timestampStr}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            return res.status(200).send(pdfBuffer);
        }

        // 2. CSV Export (Default)
        const csvString = generateCsvContent(transactions, user);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="ApnaPay_Transactions_${userId}_${timestampStr}.csv"`);
        return res.status(200).send(csvString);

    } catch (error) {
        console.error('Export Transactions Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to export transaction statement. Please try again.'
        });
    }
};
