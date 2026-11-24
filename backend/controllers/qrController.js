const db = require("../config/db");
const QRCode = require("qrcode");
const { randomUUID } = require("crypto");

// Demo user ID for testing without auth
const DEMO_USER_ID = 1;

let schemaInitialized = false;

// =====================================
// HELPER: Auto-Sync & Clean QR Schema
// =====================================
async function ensureQrSchema() {
    if (schemaInitialized) return;

    try {
        // 1. Ensure qr_codes table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS qr_codes (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              user_id BIGINT UNSIGNED NOT NULL,
              public_id CHAR(36) NULL UNIQUE,
              qr_reference VARCHAR(80) NULL UNIQUE,
              qr_type ENUM('static', 'dynamic') NOT NULL DEFAULT 'static',
              upi_id VARCHAR(255) NULL,
              fixed_amount DECIMAL(12,2) NULL,
              purpose VARCHAR(255) NULL,
              status VARCHAR(20) NOT NULL DEFAULT 'active',
              expires_at DATETIME NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // 2. Fetch existing columns in qr_codes
        const [columns] = await db.execute("DESCRIBE qr_codes");
        const existingFields = columns.map(c => c.Field);

        // Add public_id if missing
        if (!existingFields.includes("public_id")) {
            console.log("[Auto-Migration] Adding 'public_id' to qr_codes...");
            try {
                await db.execute("ALTER TABLE qr_codes ADD COLUMN public_id CHAR(36) NULL UNIQUE AFTER user_id");
            } catch (_) {}
        }

        // Add qr_reference if missing
        if (!existingFields.includes("qr_reference")) {
            console.log("[Auto-Migration] Adding 'qr_reference' to qr_codes...");
            try {
                await db.execute("ALTER TABLE qr_codes ADD COLUMN qr_reference VARCHAR(80) NULL UNIQUE AFTER user_id");
            } catch (_) {}
        }

        // Add qr_type if missing
        if (!existingFields.includes("qr_type")) {
            console.log("[Auto-Migration] Adding 'qr_type' to qr_codes...");
            try {
                await db.execute("ALTER TABLE qr_codes ADD COLUMN qr_type ENUM('static', 'dynamic') NOT NULL DEFAULT 'static'");
            } catch (_) {}
        }

        // Add fixed_amount if missing
        if (!existingFields.includes("fixed_amount") && !existingFields.includes("amount")) {
            console.log("[Auto-Migration] Adding 'fixed_amount' to qr_codes...");
            try {
                await db.execute("ALTER TABLE qr_codes ADD COLUMN fixed_amount DECIMAL(12,2) NULL");
            } catch (_) {}
        }

        // Add purpose if missing
        if (!existingFields.includes("purpose") && !existingFields.includes("title")) {
            console.log("[Auto-Migration] Adding 'purpose' to qr_codes...");
            try {
                await db.execute("ALTER TABLE qr_codes ADD COLUMN purpose VARCHAR(255) NULL");
            } catch (_) {}
        }

        // Add status if missing
        if (!existingFields.includes("status")) {
            console.log("[Auto-Migration] Adding 'status' to qr_codes...");
            try {
                await db.execute("ALTER TABLE qr_codes ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'");
            } catch (_) {}
        }

        // 3. Fix any existing records where public_id = '' or duplicate empty strings
        try {
            await db.execute(`
                UPDATE qr_codes
                SET public_id = UUID()
                WHERE public_id = '' OR public_id IS NULL
            `);
        } catch (_) {}

        try {
            await db.execute(`
                UPDATE qr_codes
                SET qr_reference = public_id
                WHERE (qr_reference = '' OR qr_reference IS NULL) AND public_id IS NOT NULL
            `);
        } catch (_) {}

        // 4. Ensure qr_payment_requests table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS qr_payment_requests (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                qr_id BIGINT UNSIGNED NOT NULL,
                payer_user_id BIGINT UNSIGNED DEFAULT NULL,
                amount DECIMAL(12,2) NOT NULL,
                status ENUM('pending', 'paid', 'failed', 'cancelled') DEFAULT 'pending',
                reference_id VARCHAR(80) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_qr_request (qr_id),
                CONSTRAINT fk_request_qr FOREIGN KEY (qr_id) REFERENCES qr_codes(id)
            )
        `);

        // 5. Ensure qr_transactions table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS qr_transactions (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                request_id BIGINT UNSIGNED NOT NULL UNIQUE,
                transaction_reference VARCHAR(80) NOT NULL UNIQUE,
                amount DECIMAL(12,2) NOT NULL,
                status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_transaction_request FOREIGN KEY (request_id) REFERENCES qr_payment_requests(id)
            )
        `);

        schemaInitialized = true;
    } catch (err) {
        console.error("Auto-migration schema notice:", err.message);
    }
}


// =====================================
// 1. CREATE QR CODE
// POST /qr/create
// =====================================
exports.createQR = async (req, res) => {
    try {
        await ensureQrSchema();

        const { qr_type, title, amount } = req.body;

        if (!["static", "dynamic"].includes(qr_type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid QR type. Must be 'static' or 'dynamic'"
            });
        }

        if (
            qr_type === "dynamic" &&
            (
                amount === undefined ||
                amount === null ||
                amount === "" ||
                !Number.isFinite(Number(amount)) ||
                Number(amount) <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid amount greater than 0 is required for dynamic QR"
            });
        }

        // Active user lookup from auth or database
        let activeUserId = req.user?.userId || req.user?.id || DEMO_USER_ID;
        if (!req.user?.userId && !req.user?.id) {
            try {
                const [users] = await db.execute("SELECT id FROM users LIMIT 1");
                if (users.length > 0) {
                    activeUserId = users[0].id;
                }
            } catch (_) {}
        }

        const qrReference = randomUUID();

        // Inspect actual table columns to build a dynamic insert
        const [colRows] = await db.execute("DESCRIBE qr_codes");
        const existingCols = colRows.map(c => c.Field);

        const insertData = {
            user_id: activeUserId
        };

        // Populate public_id and qr_reference with the unique UUID
        if (existingCols.includes("public_id")) {
            insertData.public_id = qrReference;
        }
        if (existingCols.includes("qr_reference")) {
            insertData.qr_reference = qrReference;
        }

        // Type
        if (existingCols.includes("qr_type")) {
            insertData.qr_type = qr_type;
        } else if (existingCols.includes("type")) {
            insertData.type = qr_type;
        }

        // Amount
        const parsedAmount = qr_type === "dynamic" ? Number(amount) : null;
        if (existingCols.includes("fixed_amount")) {
            insertData.fixed_amount = parsedAmount;
        } else if (existingCols.includes("amount")) {
            insertData.amount = parsedAmount;
        }

        // Purpose / Title
        if (existingCols.includes("purpose")) {
            insertData.purpose = title || null;
        } else if (existingCols.includes("title")) {
            insertData.title = title || null;
        }

        // Status
        if (existingCols.includes("status")) {
            insertData.status = "active";
        }

        // Handle any remaining NOT NULL columns without default value
        for (const col of colRows) {
            if (
                col.Null === "NO" &&
                col.Default === null &&
                !col.Extra.includes("auto_increment") &&
                !(col.Field in insertData)
            ) {
                if (col.Type.includes("char") || col.Type.includes("text")) {
                    insertData[col.Field] = qrReference;
                } else if (col.Type.includes("int") || col.Type.includes("decimal")) {
                    insertData[col.Field] = 0;
                }
            }
        }

        const keys = Object.keys(insertData);
        const values = Object.values(insertData);
        const placeholders = keys.map(() => "?").join(", ");

        const [result] = await db.execute(
            `INSERT INTO qr_codes (${keys.join(", ")}) VALUES (${placeholders})`,
            values
        );

        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const paymentUrl = `${clientUrl}/pay/${qrReference}`;
        const qrImage = await QRCode.toDataURL(paymentUrl);

        return res.status(201).json({
            success: true,
            message: "QR created successfully",
            data: {
                id: result.insertId,
                public_id: qrReference,
                qr_reference: qrReference,
                qr_type,
                amount: parsedAmount,
                qr_image: qrImage,
                payment_url: paymentUrl
            }
        });

    } catch (error) {
        console.error("Create QR Error:", error);

        return res.status(500).json({
            success: false,
            message: "QR creation failed",
            error: error.message
        });
    }
};


// =====================================
// 2. GET QR DETAILS / SCAN QR
// GET /qr/:publicId
// =====================================
exports.getQR = async (req, res) => {
    try {
        await ensureQrSchema();

        const { publicId } = req.params;

        const [colRows] = await db.execute("DESCRIBE qr_codes");
        const existingCols = colRows.map(c => c.Field);

        let whereClause = "WHERE id = ?";
        let whereParams = [publicId];

        if (existingCols.includes("qr_reference") && existingCols.includes("public_id")) {
            whereClause = "WHERE qr_reference = ? OR public_id = ?";
            whereParams = [publicId, publicId];
        } else if (existingCols.includes("qr_reference")) {
            whereClause = "WHERE qr_reference = ?";
            whereParams = [publicId];
        } else if (existingCols.includes("public_id")) {
            whereClause = "WHERE public_id = ?";
            whereParams = [publicId];
        }

        const [rows] = await db.execute(
            `SELECT * FROM qr_codes ${whereClause}`,
            whereParams
        );

        if (!rows.length || (rows[0].status && rows[0].status !== "active")) {
            return res.status(404).json({
                success: false,
                message: "QR not found or inactive"
            });
        }

        const qr = rows[0];

        if (
            qr.expires_at &&
            new Date(qr.expires_at).getTime() <= Date.now()
        ) {
            return res.status(410).json({
                success: false,
                message: "QR has expired"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                id: qr.id,
                public_id: qr.public_id || qr.qr_reference,
                qr_reference: qr.qr_reference || qr.public_id,
                qr_type: qr.qr_type || qr.type || "static",
                fixed_amount: qr.fixed_amount !== undefined ? qr.fixed_amount : qr.amount,
                purpose: qr.purpose || qr.title || null,
                status: qr.status || "active",
                expires_at: qr.expires_at || null
            }
        });

    } catch (error) {
        console.error("Get QR Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch QR",
            error: error.message
        });
    }
};


// =====================================
// 3. CREATE PAYMENT REQUEST (qr_payment_requests)
// POST /qr/:publicId/payment-request
// =====================================
exports.createPaymentRequest = async (req, res) => {
    try {
        await ensureQrSchema();

        const { publicId } = req.params;
        const { amount, payer_user_id } = req.body;

        if (
            amount === undefined ||
            amount === null ||
            amount === "" ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid amount greater than 0 is required"
            });
        }

        const [colRows] = await db.execute("DESCRIBE qr_codes");
        const existingCols = colRows.map(c => c.Field);

        let whereClause = "WHERE id = ?";
        let whereParams = [publicId];

        if (existingCols.includes("qr_reference") && existingCols.includes("public_id")) {
            whereClause = "WHERE qr_reference = ? OR public_id = ?";
            whereParams = [publicId, publicId];
        } else if (existingCols.includes("qr_reference")) {
            whereClause = "WHERE qr_reference = ?";
            whereParams = [publicId];
        } else if (existingCols.includes("public_id")) {
            whereClause = "WHERE public_id = ?";
            whereParams = [publicId];
        }

        const [rows] = await db.execute(
            `SELECT * FROM qr_codes ${whereClause}`,
            whereParams
        );

        if (!rows.length || (rows[0].status && rows[0].status !== "active")) {
            return res.status(404).json({
                success: false,
                message: "QR not found or inactive"
            });
        }

        const qr = rows[0];

        if (
            qr.expires_at &&
            new Date(qr.expires_at).getTime() <= Date.now()
        ) {
            return res.status(410).json({
                success: false,
                message: "QR expired"
            });
        }

        const paymentAmount = Number(amount);
        const fixedAmount = qr.fixed_amount !== undefined ? qr.fixed_amount : qr.amount;
        const qrType = qr.qr_type || qr.type || "static";

        if (
            qrType === "dynamic" &&
            paymentAmount !== Number(fixedAmount)
        ) {
            return res.status(400).json({
                success: false,
                message: `Amount must match the QR fixed amount of ${fixedAmount}`
            });
        }

        const referenceId = randomUUID();
        const payerId = req.user?.userId || req.user?.id || (payer_user_id ? Number(payer_user_id) : DEMO_USER_ID);

        // INSERT into qr_payment_requests table
        const [insertResult] = await db.execute(
            `INSERT INTO qr_payment_requests
                (qr_id, payer_user_id, amount, status, reference_id)
             VALUES (?, ?, ?, 'pending', ?)`,
            [qr.id, payerId, paymentAmount, referenceId]
        );

        return res.status(201).json({
            success: true,
            message: "QR payment request created successfully",
            data: {
                id: insertResult.insertId,
                qr_id: qr.id,
                qr_reference: qr.qr_reference || qr.public_id || publicId,
                payer_user_id: payerId,
                amount: paymentAmount,
                status: "pending",
                reference_id: referenceId
            }
        });

    } catch (error) {
        console.error("Create Payment Request Error:", error);

        return res.status(500).json({
            success: false,
            message: "Payment request creation failed",
            error: error.message
        });
    }
};


// =====================================
// 4. PAY PAYMENT REQUEST (qr_transactions)
// POST /qr/requests/:referenceId/pay
// =====================================
exports.payPaymentRequest = async (req, res) => {
    let connection;

    try {
        await ensureQrSchema();

        const { referenceId } = req.params;
        const { payer_user_id } = req.body;

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Fetch payment request
        const [requests] = await connection.execute(
            `SELECT id, qr_id, payer_user_id, amount, status, reference_id
             FROM qr_payment_requests
             WHERE reference_id = ?
             FOR UPDATE`,
            [referenceId]
        );

        if (!requests.length) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "QR payment request not found"
            });
        }

        const paymentRequest = requests[0];

        if (paymentRequest.status === "paid") {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: "Payment request is already paid"
            });
        }

        if (paymentRequest.status !== "pending") {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Cannot pay request with status '${paymentRequest.status}'`
            });
        }

        // 2. Create transaction record in qr_transactions
        const txnReference = "TXN-" + randomUUID().replace(/-/g, "").substring(0, 16).toUpperCase();

        const [txResult] = await connection.execute(
            `INSERT INTO qr_transactions
                (request_id, transaction_reference, amount, status)
             VALUES (?, ?, ?, 'success')`,
            [
                paymentRequest.id,
                txnReference,
                paymentRequest.amount
            ]
        );

        // 3. Update qr_payment_requests status to 'paid'
        const effectivePayerId = req.user?.userId || req.user?.id || (payer_user_id ? Number(payer_user_id) : (paymentRequest.payer_user_id || DEMO_USER_ID));

        await connection.execute(
            `UPDATE qr_payment_requests
             SET status = 'paid', payer_user_id = ?
             WHERE id = ?`,
            [effectivePayerId, paymentRequest.id]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "QR payment processed successfully",
            data: {
                transaction_id: txResult.insertId,
                transaction_reference: txnReference,
                request_id: paymentRequest.id,
                reference_id: referenceId,
                amount: Number(paymentRequest.amount),
                status: "success",
                payment_request_status: "paid"
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Pay Payment Request Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to process QR payment",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};


// =====================================
// 5. GET PAYMENT REQUEST & TRANSACTION STATUS
// GET /qr/requests/:referenceId
// =====================================
exports.getPaymentRequest = async (req, res) => {
    try {
        await ensureQrSchema();

        const { referenceId } = req.params;

        const [rows] = await db.execute(
            `SELECT
                r.id AS request_id,
                r.reference_id,
                r.payer_user_id,
                r.amount,
                r.status AS request_status,
                r.created_at AS request_created_at,
                q.id AS qr_id,
                q.public_id,
                q.qr_reference,
                q.qr_type,
                q.purpose,
                t.id AS transaction_id,
                t.transaction_reference,
                t.status AS transaction_status,
                t.created_at AS transaction_created_at
             FROM qr_payment_requests r
             INNER JOIN qr_codes q ON r.qr_id = q.id
             LEFT JOIN qr_transactions t ON t.request_id = r.id
             WHERE r.reference_id = ?`,
            [referenceId]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "QR payment request not found"
            });
        }

        const data = rows[0];

        return res.status(200).json({
            success: true,
            data: {
                request_id: data.request_id,
                reference_id: data.reference_id,
                payer_user_id: data.payer_user_id,
                amount: Number(data.amount),
                status: data.request_status,
                created_at: data.request_created_at,
                qr: {
                    id: data.qr_id,
                    reference: data.qr_reference || data.public_id,
                    type: data.qr_type,
                    purpose: data.purpose
                },
                transaction: data.transaction_id ? {
                    id: data.transaction_id,
                    reference: data.transaction_reference,
                    status: data.transaction_status,
                    created_at: data.transaction_created_at
                } : null
            }
        });

    } catch (error) {
        console.error("Get Payment Request Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch payment request",
            error: error.message
        });
    }
};


// =====================================
// 6. CANCEL PAYMENT REQUEST
// POST /qr/requests/:referenceId/cancel
// =====================================
exports.cancelPaymentRequest = async (req, res) => {
    try {
        await ensureQrSchema();

        const { referenceId } = req.params;

        const [result] = await db.execute(
            `UPDATE qr_payment_requests
             SET status = 'cancelled'
             WHERE reference_id = ? AND status = 'pending'`,
            [referenceId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: "Payment request not found or not in pending status"
            });
        }

        return res.status(200).json({
            success: true,
            message: "QR payment request cancelled successfully",
            reference_id: referenceId,
            status: "cancelled"
        });

    } catch (error) {
        console.error("Cancel Payment Request Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to cancel payment request",
            error: error.message
        });
    }
};
