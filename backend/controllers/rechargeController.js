
const db = require("../config/db");
const crypto = require("crypto");


// =====================================
// AUTO-SCHEMA & DATA INITIALIZER
// =====================================
let rechargeSchemaInitialized = false;

async function ensureRechargeSchema() {
    if (rechargeSchemaInitialized) return;

    try {
        // 1. Ensure recharge_operators table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS recharge_operators (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              operator_name VARCHAR(120) NOT NULL,
              service_type VARCHAR(40) NOT NULL,
              provider_id BIGINT UNSIGNED NULL,
              status VARCHAR(20) NOT NULL DEFAULT 'active'
            )
        `);

        // Check active operators
        const [ops] = await db.execute("SELECT COUNT(*) AS cnt FROM recharge_operators WHERE status = 'active'");
        if (ops[0].cnt === 0) {
            await db.execute(`
                INSERT INTO recharge_operators (id, operator_name, service_type, status)
                VALUES 
                (1, 'Jio Prepaid', 'prepaid', 'active'),
                (2, 'Airtel Prepaid', 'prepaid', 'active'),
                (3, 'Vodafone Idea (Vi)', 'prepaid', 'active'),
                (4, 'BSNL Prepaid', 'prepaid', 'active'),
                (5, 'Tata Play DTH', 'dth', 'active'),
                (6, 'Airtel Digital TV', 'dth', 'active')
                ON DUPLICATE KEY UPDATE status = 'active'
            `);
            console.log("Default recharge operators seeded.");
        } else {
            await db.execute(`
                INSERT IGNORE INTO recharge_operators (id, operator_name, service_type, status)
                VALUES (1, 'Jio Prepaid', 'prepaid', 'active')
            `);
        }

        // 2. Ensure recharge_plans table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS recharge_plans (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              operator_id BIGINT UNSIGNED NOT NULL,
              plan_name VARCHAR(150) NOT NULL,
              amount DECIMAL(19,4) NOT NULL,
              validity_days INT UNSIGNED NULL,
              benefits JSON NULL,
              status VARCHAR(20) NOT NULL DEFAULT 'active'
            )
        `);

        // Check active plans
        const [plans] = await db.execute("SELECT COUNT(*) AS cnt FROM recharge_plans WHERE status = 'active'");
        if (plans[0].cnt === 0) {
            await db.execute(`
                INSERT INTO recharge_plans (id, operator_id, plan_name, amount, validity_days, benefits, status)
                VALUES 
                (1, 1, 'Jio 1.5GB/Day Truly Unlimited', 299.00, 28, '{"data": "1.5GB/day", "voice": "Unlimited Calls", "sms": "100/day"}', 'active'),
                (2, 1, 'Jio 2GB/Day + Unlimited 5G', 349.00, 28, '{"data": "2GB/day + 5G", "voice": "Unlimited Calls", "sms": "100/day"}', 'active'),
                (3, 1, 'Jio 3-Month Plan (84 Days)', 799.00, 84, '{"data": "1.5GB/day", "voice": "Unlimited Calls", "sms": "100/day"}', 'active'),
                (4, 2, 'Airtel Truly Unlimited 1.5GB/Day', 299.00, 28, '{"data": "1.5GB/day", "voice": "Unlimited Calls", "sms": "100/day"}', 'active'),
                (5, 2, 'Airtel 2GB/Day + OTT Pack', 399.00, 28, '{"data": "2GB/day", "voice": "Unlimited Calls", "sms": "100/day"}', 'active'),
                (6, 3, 'Vi Hero Unlimited 1.5GB/Day', 299.00, 28, '{"data": "1.5GB/day", "voice": "Unlimited Calls", "sms": "100/day"}', 'active')
                ON DUPLICATE KEY UPDATE status = 'active'
            `);
            console.log("Default recharge plans seeded.");
        } else {
            await db.execute(`
                INSERT IGNORE INTO recharge_plans (id, operator_id, plan_name, amount, validity_days, benefits, status)
                VALUES (1, 1, 'Jio 1.5GB/Day Truly Unlimited', 299.00, 28, '{"data": "1.5GB/day", "voice": "Unlimited Calls", "sms": "100/day"}', 'active')
            `);
        }

        // 3. Ensure recharge_orders table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS recharge_orders (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              user_id BIGINT UNSIGNED NOT NULL,
              operator_id BIGINT UNSIGNED NOT NULL,
              plan_id BIGINT UNSIGNED NULL,
              mobile_number VARCHAR(20) NOT NULL,
              amount DECIMAL(19,4) NOT NULL,
              payment_id BIGINT UNSIGNED NULL,
              provider_reference VARCHAR(150) NULL,
              status VARCHAR(30) NOT NULL DEFAULT 'pending',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 4. Ensure test user exists in users table
        try {
            const [users] = await db.execute("SELECT id FROM users LIMIT 1");
            if (users.length === 0) {
                await db.execute(`
                    INSERT INTO users (id, phone, email, password_hash, full_name, status)
                    VALUES (1, '9876543210', 'testuser@apnapay.com', 'dummy_hash', 'Test User', 'active')
                `);
            }
        } catch (_) {}

        rechargeSchemaInitialized = true;
    } catch (err) {
        // silent if db not started yet
    }
}

// Initial async trigger on file load
ensureRechargeSchema().catch(() => {});

// 1. Get all active operators
const getOperators = async (req, res) => {
    try {
        await ensureRechargeSchema();
        const { service_type } = req.query;

        let sql = `
            SELECT id, operator_name, service_type, provider_id, status
            FROM recharge_operators
            WHERE status = 'active'
        `;

        const values = [];

        if (service_type) {
            sql += " AND service_type = ?";
            values.push(service_type);
        }

        sql += " ORDER BY id ASC";

        const [rows] = await db.execute(sql, values);

        res.status(200).json({
            success: true,
            message: "Operators fetched successfully",
            data: rows
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// 2. Get operator by ID
const getOperatorById = async (req, res) => {
    try {
        await ensureRechargeSchema();
        const { id } = req.params;

        const [rows] = await db.execute(
            `SELECT id, operator_name, service_type, provider_id, status
             FROM recharge_operators
             WHERE id = ? AND status = 'active'`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Operator not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// 3. Get recharge plans
const getPlans = async (req, res) => {
    try {
        await ensureRechargeSchema();
        const { operator_id } = req.query;

        let sql = `
            SELECT
                rp.id,
                rp.operator_id,
                ro.operator_name,
                ro.service_type,
                rp.plan_name,
                rp.amount,
                rp.validity_days,
                rp.benefits
            FROM recharge_plans rp
            INNER JOIN recharge_operators ro
                ON rp.operator_id = ro.id
            WHERE rp.status = 'active'
            AND ro.status = 'active'
        `;

        const values = [];

        if (operator_id) {
            sql += " AND rp.operator_id = ?";
            values.push(operator_id);
        }

        sql += " ORDER BY rp.amount ASC";

        const [rows] = await db.execute(sql, values);

        res.json({
            success: true,
            message: "Recharge plans fetched successfully",
            count: rows.length,
            data: rows
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// 4. Get plan details
const getPlanById = async (req, res) => {
    try {
        await ensureRechargeSchema();
        const { id } = req.params;

        const [rows] = await db.execute(
            `SELECT
                rp.*,
                ro.operator_name,
                ro.service_type
             FROM recharge_plans rp
             INNER JOIN recharge_operators ro
                ON rp.operator_id = ro.id
             WHERE rp.id = ?
             AND rp.status = 'active'
             AND ro.status = 'active'`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Recharge plan not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// 5. Create recharge order
const createRecharge = async (req, res) => {
    try {
        await ensureRechargeSchema();
        const {
            user_id,
            operator_id,
            plan_id,
            mobile_number,
            amount
        } = req.body;

        const effectiveUserId = req.user?.userId || req.user?.id || user_id;

        // Required fields validation
        if (!effectiveUserId || !operator_id || !mobile_number || amount === undefined) {
            return res.status(400).json({
                success: false,
                message: "operator_id, mobile_number and amount are required"
            });
        }

        // Mobile number validation
        if (!/^[6-9]\d{9}$/.test(String(mobile_number))) {
            return res.status(400).json({
                success: false,
                message: "Enter valid 10 digit Indian mobile number"
            });
        }

        // Amount validation
        const rechargeAmount = Number(amount);

        if (!Number.isFinite(rechargeAmount) || rechargeAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Enter valid recharge amount"
            });
        }

        let targetOperatorId = Number(operator_id);

        // Check selected plan
        if (plan_id) {
            const [plans] = await db.execute(
                `SELECT id, operator_id, amount
                 FROM recharge_plans
                 WHERE id = ?
                 AND status = 'active'`,
                [plan_id]
            );

            if (plans.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Plan not found or inactive"
                });
            }

            // Auto-align targetOperatorId with the selected plan's operator
            if (plans[0].operator_id) {
                targetOperatorId = plans[0].operator_id;
            }

            if (Number(plans[0].amount) !== rechargeAmount) {
                return res.status(400).json({
                    success: false,
                    message: "Recharge amount does not match selected plan"
                });
            }
        }

        // Check operator
        const [operators] = await db.execute(
            `SELECT id
             FROM recharge_operators
             WHERE id = ? AND status = 'active'`,
            [targetOperatorId]
        );

        if (operators.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Operator not found or inactive"
            });
        }

        // Generate unique provider reference for internal tracking
        const providerReference =
            "RCH" +
            Date.now() +
            crypto.randomBytes(3).toString("hex").toUpperCase();

        // Create pending recharge order
        const [result] = await db.execute(
            `INSERT INTO recharge_orders
            (
                user_id,
                operator_id,
                plan_id,
                mobile_number,
                amount,
                provider_reference,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [
                effectiveUserId,
                targetOperatorId,
                plan_id || null,
                mobile_number,
                rechargeAmount,
                providerReference
            ]
        );

        res.status(201).json({
            success: true,
            message: "Recharge order created successfully. Payment/recharge is pending.",
            data: {
                recharge_id: result.insertId,
                user_id: effectiveUserId,
                operator_id: targetOperatorId,
                plan_id: plan_id || null,
                mobile_number,
                amount: rechargeAmount,
                provider_reference: providerReference,
                payment_id: null,
                status: "pending"
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// 6. Get recharge details by ID
const getRechargeById = async (req, res) => {
    try {
        await ensureRechargeSchema();
        const { id } = req.params;

        const [rows] = await db.execute(
            `SELECT
                r.*,
                op.operator_name,
                op.service_type,
                rp.plan_name
             FROM recharge_orders r
             INNER JOIN recharge_operators op
                ON r.operator_id = op.id
             LEFT JOIN recharge_plans rp
                ON r.plan_id = rp.id
             WHERE r.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Recharge order not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// 7. Get recharge history by user ID
const getUserRecharges = async (req, res) => {
    try {
        await ensureRechargeSchema();
        const userId = req.params.userId || req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const [rows] = await db.execute(
            `SELECT
                r.*,
                op.operator_name,
                op.service_type,
                rp.plan_name
             FROM recharge_orders r
             INNER JOIN recharge_operators op
                ON r.operator_id = op.id
             LEFT JOIN recharge_plans rp
                ON r.plan_id = rp.id
             WHERE r.user_id = ?
             ORDER BY r.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// 8. Update recharge status (local testing only)
const updateRechargeStatus = async (req, res) => {
    try {
        await ensureRechargeSchema();
        const { id } = req.params;
        const { status, provider_reference } = req.body;

        const allowedStatuses = [
            "pending",
            "processing",
            "success",
            "failed"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid recharge status"
            });
        }

        let sql = `
            UPDATE recharge_orders
            SET status = ?
        `;

        const values = [status];

        if (provider_reference) {
            sql += ", provider_reference = ?";
            values.push(provider_reference);
        }

        sql += " WHERE id = ?";
        values.push(id);

        const [result] = await db.execute(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Recharge order not found"
            });
        }

        res.json({
            success: true,
            message: "Recharge status updated successfully",
            data: {
                recharge_id: id,
                status
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    getOperators,
    getOperatorById,
    getPlans,
    getPlanById,
    createRecharge,
    getRechargeById,
    getUserRecharges,
    updateRechargeStatus
};
