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

// ==========================================
// 1. GET /api/wallet - Wallet Overview
// ==========================================
exports.getWalletOverview = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        // 1. Fetch wallet
        const [wallets] = await db.execute(
            `SELECT id, user_id, currency, available_balance, status, created_at, updated_at
             FROM wallets
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        if (wallets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found for this user.'
            });
        }

        const wallet = wallets[0];
        const balance = toDecimal(wallet.available_balance);

        // 2. Fetch aggregate stats from ledger_entries for this wallet
        const [statsRows] = await db.execute(
            `SELECT 
                COUNT(*) AS total_entries,
                COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END), 0) AS total_credit,
                COALESCE(SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END), 0) AS total_debit,
                COUNT(CASE WHEN entry_type = 'credit' THEN 1 END) AS credit_count,
                COUNT(CASE WHEN entry_type = 'debit' THEN 1 END) AS debit_count
             FROM ledger_entries
             WHERE wallet_id = ?`,
            [wallet.id]
        );

        const stats = statsRows[0] || {};
        const totalCredit = toDecimal(stats.total_credit);
        const totalDebit = toDecimal(stats.total_debit);
        const totalTransactions = parseInt(stats.total_entries || 0, 10);
        const creditCount = parseInt(stats.credit_count || 0, 10);
        const debitCount = parseInt(stats.debit_count || 0, 10);

        // 3. Fetch latest KYC status
        const [kycRows] = await db.execute(
            `SELECT verification_status
             FROM kyc_records
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 1`,
            [userId]
        );

        const kycStatus = kycRows.length > 0 ? kycRows[0].verification_status : 'unverified';

        // 4. Return clean, structured overview
        return res.status(200).json({
            success: true,
            message: 'Wallet overview retrieved successfully.',
            data: {
                walletId: wallet.id,
                userId: wallet.user_id,
                currency: wallet.currency,
                availableBalance: balance,
                formattedBalance: formatCurrency(balance, wallet.currency),
                status: wallet.status,
                kycStatus,
                stats: {
                    totalCredit,
                    formattedTotalCredit: formatCurrency(totalCredit, wallet.currency),
                    totalDebit,
                    formattedTotalDebit: formatCurrency(totalDebit, wallet.currency),
                    netFlow: toDecimal(totalCredit - totalDebit),
                    totalTransactions,
                    creditCount,
                    debitCount
                },
                createdAt: wallet.created_at,
                updatedAt: wallet.updated_at
            }
        });

    } catch (error) {
        console.error('Wallet Overview Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve wallet overview. Please try again.'
        });
    }
};

// ==========================================
// 2. GET /api/wallet/balance - Get Available Wallet Balance
// ==========================================
exports.getWalletBalance = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const [wallets] = await db.execute(
            `SELECT id, user_id, currency, available_balance, status, updated_at
             FROM wallets
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        if (wallets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found for this user.'
            });
        }

        const wallet = wallets[0];
        const balance = toDecimal(wallet.available_balance);

        return res.status(200).json({
            success: true,
            message: 'Wallet balance retrieved successfully.',
            data: {
                walletId: wallet.id,
                userId: wallet.user_id,
                currency: wallet.currency,
                availableBalance: balance,
                formattedBalance: formatCurrency(balance, wallet.currency),
                status: wallet.status,
                lastUpdated: wallet.updated_at
            }
        });

    } catch (error) {
        console.error('Wallet Balance Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve wallet balance. Please try again.'
        });
    }
};

// ==========================================
// 3. GET /api/wallet/ledger - Get Debit and Credit Entries
// ==========================================
exports.getWalletLedger = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        // Verify wallet exists for this user
        const [wallets] = await db.execute(
            `SELECT id, currency FROM wallets WHERE user_id = ? LIMIT 1`,
            [userId]
        );

        if (wallets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found for this user.'
            });
        }

        const wallet = wallets[0];

        // Parse and validate query parameters
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        const entryType = req.query.type ? String(req.query.type).trim().toLowerCase() : 'all';
        if (!['all', 'credit', 'debit'].includes(entryType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid entry type filter. Allowed values: 'all', 'credit', 'debit'."
            });
        }

        const sortOrder = req.query.sort && String(req.query.sort).trim().toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const startDate = req.query.startDate ? String(req.query.startDate).trim() : null;
        const endDate = req.query.endDate ? String(req.query.endDate).trim() : null;

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

        const statusFilter = req.query.status ? String(req.query.status).trim().toLowerCase() : 'all';

        // Build dynamic query
        const whereClauses = ['le.wallet_id = ?'];
        const queryParams = [wallet.id];

        if (entryType !== 'all') {
            whereClauses.push('le.entry_type = ?');
            queryParams.push(entryType);
        }

        if (startDate) {
            whereClauses.push('le.created_at >= ?');
            queryParams.push(`${startDate} 00:00:00`);
        }

        if (endDate) {
            whereClauses.push('le.created_at <= ?');
            queryParams.push(`${endDate} 23:59:59`);
        }

        if (statusFilter !== 'all') {
            whereClauses.push('lt.status = ?');
            queryParams.push(statusFilter);
        }

        const whereSql = whereClauses.join(' AND ');

        // 1. Count total matching rows
        const countSql = `
            SELECT COUNT(*) AS total
            FROM ledger_entries le
            LEFT JOIN ledger_transactions lt ON le.ledger_transaction_id = lt.id
            WHERE ${whereSql}
        `;
        const [countResult] = await db.execute(countSql, queryParams);
        const totalRecords = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);

        // 2. Fetch paginated records
        const dataSql = `
            SELECT 
                le.id,
                le.ledger_transaction_id,
                le.wallet_id,
                le.entry_type,
                le.amount,
                le.created_at,
                lt.reference_type,
                lt.reference_id,
                lt.transaction_type,
                lt.status,
                lt.description
            FROM ledger_entries le
            LEFT JOIN ledger_transactions lt ON le.ledger_transaction_id = lt.id
            WHERE ${whereSql}
            ORDER BY le.created_at ${sortOrder}, le.id ${sortOrder}
            LIMIT ${Number(limit)} OFFSET ${Number(offset)}
        `;

        const [rows] = await db.execute(dataSql, queryParams);

        const records = rows.map((r) => {
            const amountVal = toDecimal(r.amount);
            return {
                id: r.id,
                ledgerTransactionId: r.ledger_transaction_id,
                entryType: r.entry_type,
                amount: amountVal,
                formattedAmount: `${r.entry_type === 'credit' ? '+' : '-'}₹${amountVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                referenceType: r.reference_type || 'wallet_operation',
                referenceId: r.reference_id || null,
                transactionType: r.transaction_type || 'standard_entry',
                status: r.status || 'completed',
                description: r.description || (r.entry_type === 'credit' ? 'Wallet Credit' : 'Wallet Debit'),
                createdAt: r.created_at
            };
        });

        return res.status(200).json({
            success: true,
            message: 'Wallet ledger records retrieved successfully.',
            data: {
                walletId: wallet.id,
                currency: wallet.currency,
                pagination: {
                    totalRecords,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                filters: {
                    type: entryType,
                    status: statusFilter,
                    startDate: startDate || null,
                    endDate: endDate || null,
                    sort: sortOrder.toLowerCase()
                },
                records
            }
        });

    } catch (error) {
        console.error('Wallet Ledger Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve ledger entries. Please try again.'
        });
    }
};

// ==========================================
// 4. GET /api/wallet/summary - Get Wallet Balance Summary
// ==========================================
exports.getWalletSummary = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        // Verify wallet
        const [wallets] = await db.execute(
            `SELECT id, user_id, currency, available_balance, status FROM wallets WHERE user_id = ? LIMIT 1`,
            [userId]
        );

        if (wallets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found for this user.'
            });
        }

        const wallet = wallets[0];
        const availableBalance = toDecimal(wallet.available_balance);

        // 1. Overall Lifetime Aggregates
        const [lifetimeRows] = await db.execute(
            `SELECT 
                COUNT(*) AS total_count,
                COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END), 0) AS total_credit,
                COALESCE(SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END), 0) AS total_debit,
                COUNT(CASE WHEN entry_type = 'credit' THEN 1 END) AS credit_count,
                COUNT(CASE WHEN entry_type = 'debit' THEN 1 END) AS debit_count
             FROM ledger_entries
             WHERE wallet_id = ?`,
            [wallet.id]
        );

        const lifetime = lifetimeRows[0] || {};
        const totalCredit = toDecimal(lifetime.total_credit);
        const totalDebit = toDecimal(lifetime.total_debit);
        const netFlow = toDecimal(totalCredit - totalDebit);
        const totalTransactions = parseInt(lifetime.total_count || 0, 10);
        const creditCount = parseInt(lifetime.credit_count || 0, 10);
        const debitCount = parseInt(lifetime.debit_count || 0, 10);

        // 2. Period Summary (optional: today, week, month, year, or custom range)
        const period = req.query.period ? String(req.query.period).trim().toLowerCase() : null;
        const startDate = req.query.startDate ? String(req.query.startDate).trim() : null;
        const endDate = req.query.endDate ? String(req.query.endDate).trim() : null;

        let periodCondition = null;
        let periodParams = [wallet.id];
        let periodLabel = null;

        if (startDate || endDate) {
            if (startDate && !isValidDateString(startDate)) {
                return res.status(400).json({ success: false, message: 'Invalid startDate format (YYYY-MM-DD).' });
            }
            if (endDate && !isValidDateString(endDate)) {
                return res.status(400).json({ success: false, message: 'Invalid endDate format (YYYY-MM-DD).' });
            }
            if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
                return res.status(400).json({ success: false, message: 'startDate cannot be after endDate.' });
            }

            periodLabel = `Custom (${startDate || 'Start'} to ${endDate || 'Now'})`;
            const conds = [];
            if (startDate) {
                conds.push('created_at >= ?');
                periodParams.push(`${startDate} 00:00:00`);
            }
            if (endDate) {
                conds.push('created_at <= ?');
                periodParams.push(`${endDate} 23:59:59`);
            }
            periodCondition = conds.join(' AND ');
        } else if (period) {
            if (period === 'today') {
                periodLabel = 'Today';
                periodCondition = 'created_at >= CURDATE()';
            } else if (period === 'week') {
                periodLabel = 'Last 7 Days';
                periodCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
            } else if (period === 'month') {
                periodLabel = 'Current Month';
                periodCondition = "created_at >= DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00')";
            } else if (period === 'year') {
                periodLabel = 'Current Year';
                periodCondition = "created_at >= DATE_FORMAT(NOW(), '%Y-01-01 00:00:00')";
            } else if (period === 'all') {
                periodLabel = 'Lifetime';
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid period. Allowed values: 'today', 'week', 'month', 'year', 'all'."
                });
            }
        }

        let periodSummary = null;
        if (periodCondition) {
            const [periodRows] = await db.execute(
                `SELECT 
                    COUNT(*) AS period_count,
                    COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END), 0) AS period_credit,
                    COALESCE(SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END), 0) AS period_debit
                 FROM ledger_entries
                 WHERE wallet_id = ? AND ${periodCondition}`,
                periodParams
            );
            const pRow = periodRows[0] || {};
            const pCredit = toDecimal(pRow.period_credit);
            const pDebit = toDecimal(pRow.period_debit);
            periodSummary = {
                period: periodLabel,
                credit: pCredit,
                formattedCredit: formatCurrency(pCredit, wallet.currency),
                debit: pDebit,
                formattedDebit: formatCurrency(pDebit, wallet.currency),
                net: toDecimal(pCredit - pDebit),
                transactionsCount: parseInt(pRow.period_count || 0, 10)
            };
        }

        // 3. Last Transaction Details
        const [lastTxRows] = await db.execute(
            `SELECT 
                le.id,
                le.entry_type,
                le.amount,
                le.created_at,
                lt.transaction_type,
                lt.description,
                lt.status
             FROM ledger_entries le
             LEFT JOIN ledger_transactions lt ON le.ledger_transaction_id = lt.id
             WHERE le.wallet_id = ?
             ORDER BY le.created_at DESC, le.id DESC
             LIMIT 1`,
            [wallet.id]
        );

        let lastTransaction = null;
        if (lastTxRows.length > 0) {
            const lastRow = lastTxRows[0];
            const lastAmt = toDecimal(lastRow.amount);
            lastTransaction = {
                id: lastRow.id,
                entryType: lastRow.entry_type,
                amount: lastAmt,
                formattedAmount: `${lastRow.entry_type === 'credit' ? '+' : '-'}₹${lastAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                transactionType: lastRow.transaction_type || 'wallet_entry',
                description: lastRow.description || (lastRow.entry_type === 'credit' ? 'Wallet Credit' : 'Wallet Debit'),
                status: lastRow.status || 'completed',
                createdAt: lastRow.created_at
            };
        }

        return res.status(200).json({
            success: true,
            message: 'Wallet balance summary retrieved successfully.',
            data: {
                walletId: wallet.id,
                currency: wallet.currency,
                availableBalance,
                formattedAvailableBalance: formatCurrency(availableBalance, wallet.currency),
                status: wallet.status,
                lifetime: {
                    totalCredit,
                    formattedTotalCredit: formatCurrency(totalCredit, wallet.currency),
                    totalDebit,
                    formattedTotalDebit: formatCurrency(totalDebit, wallet.currency),
                    netFlow,
                    formattedNetFlow: formatCurrency(netFlow, wallet.currency),
                    totalTransactions,
                    creditCount,
                    debitCount
                },
                periodSummary: periodSummary || undefined,
                lastTransaction
            }
        });

    } catch (error) {
        console.error('Wallet Summary Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve wallet summary. Please try again.'
        });
    }
};

// ==========================================
// 5. GET /api/wallet/limits - Get Transaction Limits
// ==========================================
exports.getWalletLimits = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        // Verify wallet
        const [wallets] = await db.execute(
            `SELECT id, user_id, currency, available_balance, status FROM wallets WHERE user_id = ? LIMIT 1`,
            [userId]
        );

        if (wallets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found for this user.'
            });
        }

        const wallet = wallets[0];
        const currentBalance = toDecimal(wallet.available_balance);

        // Fetch latest KYC verification status
        const [kycRows] = await db.execute(
            `SELECT verification_status
             FROM kyc_records
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 1`,
            [userId]
        );

        const kycStatus = kycRows.length > 0 ? kycRows[0].verification_status : 'unverified';
        const isFullKyc = kycStatus === 'verified';

        // Set financial limits based on RBI / PPI fintech guidelines
        const walletTier = isFullKyc ? 'Full KYC' : 'Minimum KYC';
        const maxWalletBalance = isFullKyc ? 200000.00 : 10000.00;
        const perTransactionLimit = isFullKyc ? 100000.00 : 10000.00;
        const dailyTransactionLimit = isFullKyc ? 200000.00 : 20000.00;
        const monthlyTransactionLimit = isFullKyc ? 500000.00 : 50000.00;

        // Calculate current utilization for Today and Current Month from ledger_entries
        const [todayDebitRows] = await db.execute(
            `SELECT COALESCE(SUM(amount), 0) AS daily_spent
             FROM ledger_entries
             WHERE wallet_id = ? AND entry_type = 'debit' AND created_at >= CURDATE()`,
            [wallet.id]
        );
        const dailySpent = toDecimal(todayDebitRows[0]?.daily_spent);

        const [monthDebitRows] = await db.execute(
            `SELECT COALESCE(SUM(amount), 0) AS monthly_spent
             FROM ledger_entries
             WHERE wallet_id = ? AND entry_type = 'debit' 
               AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00')`,
            [wallet.id]
        );
        const monthlySpent = toDecimal(monthDebitRows[0]?.monthly_spent);

        // Calculate remaining headroom
        const dailyRemaining = toDecimal(Math.max(0, dailyTransactionLimit - dailySpent));
        const monthlyRemaining = toDecimal(Math.max(0, monthlyTransactionLimit - monthlySpent));
        const walletCapacityRemaining = toDecimal(Math.max(0, maxWalletBalance - currentBalance));

        return res.status(200).json({
            success: true,
            message: 'Transaction limits retrieved successfully.',
            data: {
                walletId: wallet.id,
                currency: wallet.currency,
                kycStatus,
                walletTier,
                currentBalance,
                formattedCurrentBalance: formatCurrency(currentBalance, wallet.currency),
                maxBalance: maxWalletBalance,
                formattedMaxBalance: formatCurrency(maxWalletBalance, wallet.currency),
                walletCapacityRemaining,
                formattedWalletCapacityRemaining: formatCurrency(walletCapacityRemaining, wallet.currency),
                limits: {
                    perTransactionLimit,
                    formattedPerTransactionLimit: formatCurrency(perTransactionLimit, wallet.currency),
                    dailyLimit: dailyTransactionLimit,
                    formattedDailyLimit: formatCurrency(dailyTransactionLimit, wallet.currency),
                    monthlyLimit: monthlyTransactionLimit,
                    formattedMonthlyLimit: formatCurrency(monthlyTransactionLimit, wallet.currency)
                },
                utilization: {
                    dailySpent,
                    formattedDailySpent: formatCurrency(dailySpent, wallet.currency),
                    dailyRemaining,
                    formattedDailyRemaining: formatCurrency(dailyRemaining, wallet.currency),
                    monthlySpent,
                    formattedMonthlySpent: formatCurrency(monthlySpent, wallet.currency),
                    monthlyRemaining,
                    formattedMonthlyRemaining: formatCurrency(monthlyRemaining, wallet.currency)
                }
            }
        });

    } catch (error) {
        console.error('Wallet Limits Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve transaction limits. Please try again.'
        });
    }
};

