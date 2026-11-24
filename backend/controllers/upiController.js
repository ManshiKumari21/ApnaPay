const db = require('../config/db');
const NotificationService = require('../services/notificationService');

const UPI_REGEX = /^[a-z0-9.\-_]{3,30}@[a-z]{3,}$/;
const SUPPORTED_SUFFIXES = ['@apnapay', '@apnabank', '@upi'];

// ==========================================
// 1. GET /upi/handles - List User's UPI Handles
// ==========================================
exports.getUpiHandles = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const [rows] = await db.execute(
            `SELECT 
                u.id, 
                u.upi_id, 
                u.bank_account_id, 
                u.is_primary, 
                u.status, 
                u.created_at,
                b.bank_name,
                b.account_last4,
                b.ifsc_code
             FROM upi_handles u
             LEFT JOIN bank_accounts b ON u.bank_account_id = b.id
             WHERE u.user_id = ? AND u.status != 'deleted'
             ORDER BY u.is_primary DESC, u.id DESC`,
            [userId]
        );

        const handles = rows.map((r) => ({
            id: r.id,
            upiId: r.upi_id,
            bankAccountId: r.bank_account_id,
            bankName: r.bank_name || null,
            accountLast4: r.account_last4 || null,
            maskedAccountNumber: r.account_last4 ? `••••••••${r.account_last4}` : null,
            ifscCode: r.ifsc_code || null,
            isPrimary: Boolean(r.is_primary),
            status: r.status,
            createdAt: r.created_at
        }));

        return res.status(200).json({
            success: true,
            message: 'UPI handles retrieved successfully.',
            count: handles.length,
            data: handles,
            availableSuffixes: SUPPORTED_SUFFIXES
        });

    } catch (error) {
        console.error('Get UPI Handles Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve UPI handles.'
        });
    }
};

// ==========================================
// 2. POST /upi/handles - Register / Request UPI Handle
// ==========================================
exports.createUpiHandle = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        let upiInput = String(req.body?.upiId || req.body?.handle || req.body?.desiredHandle || '').trim().toLowerCase();
        const bankAccountId = req.body?.bankAccountId || req.body?.bank_account_id;
        const isPrimary = req.body?.isPrimary !== undefined ? Boolean(req.body.isPrimary) : false;

        if (!upiInput) {
            return res.status(400).json({
                success: false,
                message: 'UPI handle is required (e.g., yourname@apnapay).'
            });
        }

        // If user provided just prefix (e.g., 'gopal'), auto-append default '@apnapay'
        if (!upiInput.includes('@')) {
            upiInput = `${upiInput}@apnapay`;
        }

        // Validate UPI handle format
        if (!UPI_REGEX.test(upiInput)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid UPI handle format. Handle must be 3-30 characters with alphanumeric, dot, dash, or underscore and valid handle suffix (e.g., yourname@apnapay).'
            });
        }

        // Check handle suffix
        const suffix = upiInput.substring(upiInput.indexOf('@'));
        if (!SUPPORTED_SUFFIXES.includes(suffix)) {
            return res.status(400).json({
                success: false,
                message: `Unsupported UPI handle provider. Supported handles are: ${SUPPORTED_SUFFIXES.join(', ')}`
            });
        }

        // Check uniqueness of UPI handle
        const [existing] = await db.execute(
            `SELECT id, user_id, status FROM upi_handles WHERE upi_id = ? LIMIT 1`,
            [upiInput]
        );

        if (existing.length > 0) {
            if (existing[0].user_id !== userId) {
                return res.status(409).json({
                    success: false,
                    message: `The UPI handle "${upiInput}" is already taken. Please choose a different handle.`
                });
            }

            if (existing[0].status === 'active') {
                return res.status(409).json({
                    success: false,
                    message: `You have already registered and active with UPI handle "${upiInput}".`
                });
            }

            // Reactivate handle if previously deleted/inactive
            let targetBankId = bankAccountId || null;
            if (targetBankId) {
                const [bCheck] = await db.execute(
                    `SELECT id FROM bank_accounts WHERE id = ? AND user_id = ? AND status IN ('active', 'verified', 'demo_verified') LIMIT 1`,
                    [targetBankId, userId]
                );
                if (bCheck.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Selected bank account is invalid or not active.'
                    });
                }
            }

            await db.execute(
                `UPDATE upi_handles SET status = 'active', bank_account_id = ? WHERE id = ?`,
                [targetBankId, existing[0].id]
            );

            return res.status(200).json({
                success: true,
                message: 'UPI handle reactivated successfully.',
                data: {
                    id: existing[0].id,
                    upiId: upiInput,
                    bankAccountId: targetBankId,
                    status: 'active'
                }
            });
        }

        // Validate and link Bank Account
        let resolvedBankAccountId = null;
        let linkedBank = null;

        if (bankAccountId) {
            const [bCheck] = await db.execute(
                `SELECT id, bank_name, account_last4 FROM bank_accounts
                 WHERE id = ? AND user_id = ? AND status IN ('active', 'verified', 'demo_verified')
                 LIMIT 1`,
                [bankAccountId, userId]
            );

            if (bCheck.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected bank account is invalid or not verified active. Please link and verify your bank account first.'
                });
            }
            resolvedBankAccountId = bCheck[0].id;
            linkedBank = bCheck[0];
        } else {
            // Auto-link to user's primary/latest active bank account if one exists
            const [activeBanks] = await db.execute(
                `SELECT id, bank_name, account_last4 FROM bank_accounts
                 WHERE user_id = ? AND status IN ('active', 'verified', 'demo_verified')
                 ORDER BY is_primary DESC, id DESC
                 LIMIT 1`,
                [userId]
            );

            if (activeBanks.length > 0) {
                resolvedBankAccountId = activeBanks[0].id;
                linkedBank = activeBanks[0];
            }
        }

        // Primary handle management
        const [userHandles] = await db.execute(
            `SELECT id FROM upi_handles WHERE user_id = ? AND status = 'active' LIMIT 1`,
            [userId]
        );

        const willBePrimary = userHandles.length === 0 || isPrimary ? 1 : 0;

        if (willBePrimary) {
            await db.execute(
                `UPDATE upi_handles SET is_primary = 0 WHERE user_id = ?`,
                [userId]
            );
        }

        // Insert new UPI handle
        const [insertResult] = await db.execute(
            `INSERT INTO upi_handles
             (user_id, bank_account_id, upi_id, is_primary, status)
             VALUES (?, ?, ?, ?, 'active')`,
            [userId, resolvedBankAccountId, upiInput, willBePrimary]
        );

        // Non-blocking notification dispatch
        NotificationService.notify({
            userId,
            title: 'UPI Handle Registered',
            message: `Your new UPI ID ${upiInput} has been registered and activated.`,
            category: 'upi',
            type: 'success',
            referenceId: insertResult.insertId,
            referenceType: 'upi_handle'
        }).catch(() => {});

        return res.status(201).json({
            success: true,
            message: 'UPI handle registered successfully.',
            data: {
                id: insertResult.insertId,
                upiId: upiInput,
                bankAccountId: resolvedBankAccountId,
                bankName: linkedBank ? linkedBank.bank_name : null,
                accountLast4: linkedBank ? linkedBank.account_last4 : null,
                maskedAccountNumber: linkedBank && linkedBank.account_last4 ? `••••••••${linkedBank.account_last4}` : null,
                isPrimary: Boolean(willBePrimary),
                status: 'active',
                createdAt: new Date()
            }
        });

    } catch (error) {
        console.error('Create UPI Handle Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to register UPI handle.'
        });
    }
};



// ==========================================
// 3. DELETE /upi/handles/:id - Delete UPI Handle
// ==========================================
exports.deleteUpiHandle = async (req, res) => {
    let connection;

    try {
        const userId = req.user?.userId;
        const handleId = Number(req.params.id);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        if (!Number.isInteger(handleId) || handleId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid UPI handle ID is required.'
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check ownership and handle status
        const [handles] = await connection.execute(
            `SELECT id, upi_id, is_primary, status
             FROM upi_handles
             WHERE id = ? AND user_id = ?
             LIMIT 1
             FOR UPDATE`,
            [handleId, userId]
        );

        if (handles.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'UPI handle not found.'
            });
        }

        const handle = handles[0];

        if (handle.status === 'deleted') {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'UPI handle is already deleted.'
            });
        }

        // Soft delete
        await connection.execute(
            `UPDATE upi_handles
             SET status = 'deleted', is_primary = 0
             WHERE id = ? AND user_id = ?`,
            [handleId, userId]
        );

        // If deleted handle was primary, promote another active handle
        if (Boolean(handle.is_primary)) {
            const [nextHandles] = await connection.execute(
                `SELECT id
                 FROM upi_handles
                 WHERE user_id = ? AND status = 'active'
                 ORDER BY id DESC
                 LIMIT 1`,
                [userId]
            );

            if (nextHandles.length > 0) {
                await connection.execute(
                    `UPDATE upi_handles
                     SET is_primary = 1
                     WHERE id = ? AND user_id = ?`,
                    [nextHandles[0].id, userId]
                );
            }
        }

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: 'UPI handle deleted successfully.',
            data: {
                id: handleId,
                upiId: handle.upi_id,
                status: 'deleted'
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Delete UPI Handle Error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to delete UPI handle.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

