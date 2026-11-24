
const db = require("../config/db");

// =====================================
// HELPER FUNCTIONS
// =====================================

function parseDate(value) {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return null;
    }

    const date = new Date(value + "T00:00:00.000Z");

    if (date.toISOString().slice(0, 10) !== value) {
        return null;
    }

    return date;
}

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

function addMonths(date, months) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + months;
    const day = date.getUTCDate();

    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(
        firstDay.getUTCFullYear(),
        firstDay.getUTCMonth() + 1,
        0
    )).getUTCDate();

    return new Date(Date.UTC(
        firstDay.getUTCFullYear(),
        firstDay.getUTCMonth(),
        Math.min(day, lastDay)
    ));
}

function getDueDate(startDate, frequency, index) {
    const date = new Date(startDate);

    switch (frequency) {
        case "daily":
            date.setUTCDate(date.getUTCDate() + index);
            break;

        case "weekly":
            date.setUTCDate(date.getUTCDate() + (index * 7));
            break;

        case "monthly":
            return addMonths(date, index);

        case "quarterly":
            return addMonths(date, index * 3);

        default:
            throw new Error("Invalid SIP frequency");
    }

    return date;
}

function makeReference(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}


// =====================================

// =====================================
// AUTO-SCHEMA & DATA INITIALIZER
// =====================================
let schemaInitialized = false;

async function ensureSipSchema() {
    if (schemaInitialized) return;

    try {
        // 1. Ensure sip_products table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS sip_products (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              product_name VARCHAR(150) NOT NULL,
              provider_name VARCHAR(150) NULL,
              risk_level VARCHAR(30) NULL,
              minimum_investment DECIMAL(19,4) NOT NULL DEFAULT 500.00,
              status VARCHAR(30) NOT NULL DEFAULT 'active',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if sip_products has active products
        const [prodCount] = await db.execute("SELECT COUNT(*) AS cnt FROM sip_products WHERE status = 'active'");
        if (prodCount[0].cnt === 0) {
            await db.execute(`
                INSERT INTO sip_products (id, product_name, provider_name, risk_level, minimum_investment, status)
                VALUES 
                (1, 'HDFC Top 100 Large Cap Fund', 'HDFC Mutual Fund', 'low', 500.00, 'active'),
                (2, 'SBI Bluechip Large Cap Fund', 'SBI Mutual Fund', 'low', 500.00, 'active'),
                (3, 'ICICI Prudential Technology Fund', 'ICICI Prudential Mutual Fund', 'high', 1000.00, 'active'),
                (4, 'Axis Small Cap Fund', 'Axis Mutual Fund', 'very high', 500.00, 'active'),
                (5, 'Parag Parikh Flexi Cap Fund', 'PPFAS Mutual Fund', 'moderate', 1000.00, 'active')
                ON DUPLICATE KEY UPDATE status = 'active'
            `);
            console.log("Default SIP products initialized in sip_products.");
        } else {
            // Guarantee product with id=1 exists and is active so default {{productId}} in Postman works immediately
            await db.execute(`
                INSERT IGNORE INTO sip_products (id, product_name, provider_name, risk_level, minimum_investment, status)
                VALUES (1, 'HDFC Top 100 Large Cap Fund', 'HDFC Mutual Fund', 'low', 500.00, 'active')
            `);
        }

        // 2. Ensure sip_plans table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS sip_plans (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              user_id BIGINT UNSIGNED NOT NULL,
              product_id BIGINT UNSIGNED NOT NULL,
              installment_amount DECIMAL(19,4) NOT NULL,
              frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
              start_date DATE NOT NULL,
              next_due_date DATE NULL,
              end_date DATE NULL,
              status VARCHAR(30) NOT NULL DEFAULT 'active',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Ensure sip_installments table exists and has installment_number column
        try {
            const [cols] = await db.execute("DESCRIBE sip_installments");
            const colNames = cols.map(c => c.Field);
            if (!colNames.includes("installment_number")) {
                await db.execute("ALTER TABLE sip_installments ADD COLUMN installment_number INT UNSIGNED NOT NULL DEFAULT 1 AFTER sip_plan_id");
                console.log("Added installment_number column to sip_installments.");
            }
        } catch (tableErr) {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS sip_installments (
                  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  sip_plan_id BIGINT UNSIGNED NOT NULL,
                  installment_number INT UNSIGNED NOT NULL DEFAULT 1,
                  due_date DATE NOT NULL,
                  amount DECIMAL(19,4) NOT NULL,
                  payment_id BIGINT UNSIGNED NULL,
                  status VARCHAR(30) NOT NULL DEFAULT 'upcoming',
                  paid_at DATETIME NULL
                )
            `);
        }

        // 4. Ensure sip_mandates table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS sip_mandates (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              user_id BIGINT UNSIGNED NOT NULL,
              sip_plan_id BIGINT UNSIGNED NOT NULL,
              mandate_reference VARCHAR(80) NOT NULL UNIQUE,
              mandate_type ENUM('enach', 'upi_autopay', 'other') NOT NULL,
              bank_account_id BIGINT UNSIGNED NULL,
              maximum_amount DECIMAL(19,4) NOT NULL,
              status VARCHAR(30) NOT NULL DEFAULT 'pending',
              expires_at DATETIME NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 5. Ensure sip_cancellations table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS sip_cancellations (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              sip_plan_id BIGINT UNSIGNED NOT NULL,
              user_id BIGINT UNSIGNED NULL,
              cancellation_reference VARCHAR(80) NOT NULL UNIQUE,
              cancellation_reason VARCHAR(255) NULL,
              status VARCHAR(30) NOT NULL DEFAULT 'requested',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 6. Ensure sip_transactions table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS sip_transactions (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              sip_plan_id BIGINT UNSIGNED NOT NULL,
              installment_id BIGINT UNSIGNED NULL,
              transaction_reference VARCHAR(80) NOT NULL UNIQUE,
              amount DECIMAL(19,4) NOT NULL,
              status VARCHAR(30) NOT NULL DEFAULT 'success',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        schemaInitialized = true;
    } catch (err) {
        // silent if db not started yet
    }
}

// Initial async trigger on file load
ensureSipSchema().catch(() => {});

// 1. GET ALL ACTIVE SIP PRODUCTS
// =====================================

exports.getProducts = async (req, res) => {
    try {
        await ensureSipSchema();
        const [products] = await db.execute(
            `SELECT
                id,
                product_name,
                provider_name,
                risk_level,
                minimum_investment,
                status,
                created_at
             FROM sip_products
             WHERE status = 'active'
             ORDER BY id DESC`
        );

        return res.json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error) {
        console.error("Get SIP products:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch SIP products"
        });
    }
};


// =====================================
// 2. GET SINGLE SIP PRODUCT
// =====================================

exports.getProductById = async (req, res) => {
    try {
        await ensureSipSchema();
        const productId = Number(req.params.id);

        if (!Number.isSafeInteger(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const [products] = await db.execute(
            `SELECT *
             FROM sip_products
             WHERE id = ? AND status = 'active'`,
            [productId]
        );

        if (!products.length) {
            return res.status(404).json({
                success: false,
                message: "SIP product not found"
            });
        }

        return res.json({
            success: true,
            data: products[0]
        });

    } catch (error) {
        console.error("Get SIP product:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch product"
        });
    }
};


// =====================================
// 3. CREATE SIP PLAN
// =====================================

exports.createSIP = async (req, res) => {
    let connection;

    try {
        await ensureSipSchema();
        const {
            user_id,
            product_id,
            installment_amount,
            frequency,
            start_date,
            end_date,
            total_installments
        } = req.body;

        const userId = Number(req.user?.userId || req.user?.id || user_id);
        const productId = Number(product_id);
        const amount = Number(installment_amount);
        const total = Number(total_installments);

        const allowedFrequencies = [
            "daily",
            "weekly",
            "monthly",
            "quarterly"
        ];

        if (
            !Number.isSafeInteger(userId) || userId <= 0 ||
            !Number.isSafeInteger(productId) || productId <= 0 ||
            !Number.isFinite(amount) || amount <= 0 ||
            !allowedFrequencies.includes(frequency) ||
            !Number.isInteger(total) || total < 1 || total > 120
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid SIP details"
            });
        }

        const startDate = parseDate(start_date);

        if (!startDate) {
            return res.status(400).json({
                success: false,
                message: "start_date must be YYYY-MM-DD"
            });
        }

        let endDate = null;

        if (end_date) {
            endDate = parseDate(end_date);

            if (!endDate || endDate < startDate) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid end_date"
                });
            }
        }

        // Generate schedule before starting database transaction
        const dueDates = [];

        for (let i = 0; i < total; i++) {
            const dueDate = getDueDate(startDate, frequency, i);

            if (endDate && dueDate > endDate) {
                return res.status(400).json({
                    success: false,
                    message: "total_installments exceed the selected end_date"
                });
            }

            dueDates.push(formatDate(dueDate));
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check user
        const [users] = await connection.execute(
            "SELECT id FROM users WHERE id = ?",
            [userId]
        );

        if (!users.length) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check SIP product
        const [products] = await connection.execute(
            `SELECT id, minimum_investment
             FROM sip_products
             WHERE id = ? AND status = 'active'`,
            [productId]
        );

        if (!products.length) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "SIP product not found or inactive"
            });
        }

        if (amount < Number(products[0].minimum_investment)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: `Minimum investment is ${products[0].minimum_investment}`
            });
        }

        // Create SIP plan
        const [planResult] = await connection.execute(
            `INSERT INTO sip_plans (
                user_id,
                product_id,
                installment_amount,
                frequency,
                start_date,
                next_due_date,
                end_date,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
            [
                userId,
                productId,
                amount,
                frequency,
                start_date,
                dueDates[0],
                end_date || null
            ]
        );

        const planId = planResult.insertId;

        // Create installments
        for (let i = 0; i < dueDates.length; i++) {
            await connection.execute(
                `INSERT INTO sip_installments (
                    sip_plan_id,
                    installment_number,
                    due_date,
                    amount,
                    status
                )
                VALUES (?, ?, ?, ?, 'upcoming')`,
                [
                    planId,
                    i + 1,
                    dueDates[i],
                    amount
                ]
            );
        }

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "SIP plan created successfully",
            data: {
                sip_plan_id: planId,
                user_id: userId,
                product_id: productId,
                installment_amount: amount,
                frequency,
                start_date,
                end_date: end_date || null,
                total_installments: total,
                next_due_date: dueDates[0],
                status: "active"
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Create SIP:", error);

        return res.status(500).json({
            success: false,
            message: "SIP creation failed",
            error: error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// =====================================
// 4. GET USER SIP PLANS
// =====================================

exports.getUserSIPs = async (req, res) => {
    try {
        await ensureSipSchema();
        const userId = Number(req.params.userId || req.user?.userId || req.user?.id);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const [plans] = await db.execute(
            `SELECT
                sp.*,
                p.product_name,
                p.provider_name,
                p.risk_level,
                p.minimum_investment
             FROM sip_plans sp
             JOIN sip_products p ON p.id = sp.product_id
             WHERE sp.user_id = ?
             ORDER BY sp.id DESC`,
            [userId]
        );

        return res.json({
            success: true,
            count: plans.length,
            data: plans
        });

    } catch (error) {
        console.error("Get user SIPs:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch user SIP plans"
        });
    }
};


// =====================================
// 5. GET SIP DETAILS
// =====================================

exports.getSIPDetails = async (req, res) => {
    try {
        await ensureSipSchema();
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid SIP ID"
            });
        }

        const [plans] = await db.execute(
            `SELECT
                sp.*,
                p.product_name,
                p.provider_name,
                p.risk_level,
                p.minimum_investment
             FROM sip_plans sp
             JOIN sip_products p ON p.id = sp.product_id
             WHERE sp.id = ?`,
            [id]
        );

        if (!plans.length) {
            return res.status(404).json({
                success: false,
                message: "SIP plan not found"
            });
        }

        const [installments] = await db.execute(
            `SELECT *
             FROM sip_installments
             WHERE sip_plan_id = ?
             ORDER BY installment_number ASC`,
            [id]
        );

        return res.json({
            success: true,
            data: {
                plan: plans[0],
                installments
            }
        });

    } catch (error) {
        console.error("Get SIP details:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch SIP details"
        });
    }
};


// =====================================
// 6. GET SIP INSTALLMENTS
// =====================================

exports.getInstallments = async (req, res) => {
    try {
        await ensureSipSchema();
        const id = Number(req.params.id);

        const [installments] = await db.execute(
            `SELECT *
             FROM sip_installments
             WHERE sip_plan_id = ?
             ORDER BY installment_number ASC`,
            [id]
        );

        return res.json({
            success: true,
            count: installments.length,
            data: installments
        });

    } catch (error) {
        console.error("Get installments:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch installments"
        });
    }
};


// =====================================
// 7. PAUSE SIP
// =====================================

exports.pauseSIP = async (req, res) => {
    try {
        await ensureSipSchema();
        const id = Number(req.params.id);

        const [result] = await db.execute(
            `UPDATE sip_plans
             SET status = 'paused'
             WHERE id = ? AND status = 'active'`,
            [id]
        );

        if (!result.affectedRows) {
            return res.status(400).json({
                success: false,
                message: "SIP not found or not active"
            });
        }

        return res.json({
            success: true,
            message: "SIP paused successfully"
        });

    } catch (error) {
        console.error("Pause SIP:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to pause SIP"
        });
    }
};


// =====================================
// 8. RESUME SIP
// =====================================

exports.resumeSIP = async (req, res) => {
    try {
        await ensureSipSchema();
        const id = Number(req.params.id);

        const [result] = await db.execute(
            `UPDATE sip_plans
             SET status = 'active'
             WHERE id = ? AND status = 'paused'`,
            [id]
        );

        if (!result.affectedRows) {
            return res.status(400).json({
                success: false,
                message: "SIP not found or not paused"
            });
        }

        return res.json({
            success: true,
            message: "SIP resumed successfully"
        });

    } catch (error) {
        console.error("Resume SIP:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to resume SIP"
        });
    }
};


// =====================================
// 9. CANCEL SIP
// =====================================

exports.cancelSIP = async (req, res) => {
    let connection;

    try {
        await ensureSipSchema();
        const id = Number(req.params.id);
        const { cancellation_reason } = req.body;

        if (
            !Number.isSafeInteger(id) || id <= 0 ||
            typeof cancellation_reason !== "string" ||
            !cancellation_reason.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "SIP ID and cancellation reason are required"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [plans] = await connection.execute(
            `SELECT id, status
             FROM sip_plans
             WHERE id = ?
             FOR UPDATE`,
            [id]
        );

        if (!plans.length) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "SIP plan not found"
            });
        }

        if (["cancelled", "completed"].includes(plans[0].status)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "SIP is already cancelled or completed"
            });
        }

        const [existing] = await connection.execute(
            `SELECT id
             FROM sip_cancellations
             WHERE sip_plan_id = ?
             AND status IN ('requested', 'processing')
             LIMIT 1`,
            [id]
        );

        if (existing.length) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Cancellation request already exists"
            });
        }

        const reference = makeReference("SIPC");

        await connection.execute(
            `INSERT INTO sip_cancellations (
                sip_plan_id,
                cancellation_reference,
                cancellation_reason,
                status
            )
            VALUES (?, ?, ?, 'requested')`,
            [id, reference, cancellation_reason.trim()]
        );

        // Stop future application-side collection attempts
        await connection.execute(
            `UPDATE sip_plans
             SET status = 'paused'
             WHERE id = ?`,
            [id]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Cancellation request submitted",
            data: {
                cancellation_reference: reference,
                status: "requested"
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Cancel SIP:", error);

        return res.status(500).json({
            success: false,
            message: "SIP cancellation failed"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// =====================================
// 10. CREATE SIP MANDATE RECORD
// =====================================

exports.createMandate = async (req, res) => {
    try {
        await ensureSipSchema();
        const id = Number(req.params.id);

        const {
            user_id,
            mandate_type,
            bank_account_id,
            maximum_amount,
            expires_at
        } = req.body;

        const userId = Number(req.user?.userId || req.user?.id || user_id);
        const maxAmount = Number(maximum_amount);

        if (
            !Number.isSafeInteger(id) || id <= 0 ||
            !Number.isSafeInteger(userId) || userId <= 0 ||
            !["enach", "upi_autopay", "other"].includes(mandate_type) ||
            !Number.isFinite(maxAmount) || maxAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid mandate details"
            });
        }

        const [plans] = await db.execute(
            `SELECT id, user_id, installment_amount
             FROM sip_plans
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        if (!plans.length) {
            return res.status(404).json({
                success: false,
                message: "SIP plan not found for this user"
            });
        }

        if (maxAmount < Number(plans[0].installment_amount)) {
            return res.status(400).json({
                success: false,
                message: "Maximum mandate amount cannot be less than installment amount"
            });
        }

        const reference = makeReference("MANDATE");

        const [result] = await db.execute(
            `INSERT INTO sip_mandates (
                user_id,
                sip_plan_id,
                mandate_reference,
                mandate_type,
                bank_account_id,
                maximum_amount,
                status,
                expires_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [
                userId,
                id,
                reference,
                mandate_type,
                bank_account_id || null,
                maxAmount,
                expires_at || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Mandate record created. Provider approval is pending.",
            data: {
                mandate_id: result.insertId,
                mandate_reference: reference,
                status: "pending"
            }
        });

    } catch (error) {
        console.error("Create mandate:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create mandate",
            error: error.message
        });
    }
};


// =====================================
// 11. GET SIP MANDATE
// =====================================

exports.getMandate = async (req, res) => {
    try {
        await ensureSipSchema();
        const id = Number(req.params.id);

        const [mandates] = await db.execute(
            `SELECT *
             FROM sip_mandates
             WHERE sip_plan_id = ?
             ORDER BY id DESC`,
            [id]
        );

        return res.json({
            success: true,
            count: mandates.length,
            data: mandates
        });

    } catch (error) {
        console.error("Get mandate:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch mandate"
        });
    }
};


// =====================================
// 12. GET SIP TRANSACTIONS
// =====================================

exports.getTransactions = async (req, res) => {
    try {
        await ensureSipSchema();
        const id = Number(req.params.id);

        const [transactions] = await db.execute(
            `SELECT *
             FROM sip_transactions
             WHERE sip_plan_id = ?
             ORDER BY id DESC`,
            [id]
        );

        return res.json({
            success: true,
            count: transactions.length,
            data: transactions
        });

    } catch (error) {
        console.error("Get SIP transactions:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch SIP transactions"
        });
    }
};

// =====================================
// 13. CREATE ONE-TIME INVESTMENT
// =====================================

exports.createOneTimeInvestment = async (req, res) => {
    let connection;

    try {
        const {
            user_id,
            product_id,
            amount
        } = req.body;

        const userId = Number(req.user?.userId || req.user?.id || user_id);
        const productId = Number(product_id);
        const investmentAmount = Number(amount);

        // Validation
        if (
            !Number.isSafeInteger(userId) || userId <= 0 ||
            !Number.isSafeInteger(productId) || productId <= 0 ||
            !Number.isFinite(investmentAmount) ||
            investmentAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid user, product and amount are required"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check user
        const [users] = await connection.execute(
            "SELECT id FROM users WHERE id = ?",
            [userId]
        );

        if (!users.length) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check product
        const [products] = await connection.execute(
            `SELECT id, product_name, minimum_investment
             FROM sip_products
             WHERE id = ? AND status = 'active'`,
            [productId]
        );

        if (!products.length) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Investment product not found or inactive"
            });
        }

        // Minimum investment validation
        if (
            investmentAmount <
            Number(products[0].minimum_investment)
        ) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: `Minimum investment is ${products[0].minimum_investment}`
            });
        }

        // Generate order reference
        const orderReference = makeReference("INV");

        // Create investment order
        const [result] = await connection.execute(
            `INSERT INTO investment_orders (
                order_reference,
                user_id,
                product_id,
                investment_type,
                amount,
                payment_status,
                order_status
            )
            VALUES (?, ?, ?, 'one_time', ?, 'pending', 'pending_payment')`,
            [
                orderReference,
                userId,
                productId,
                investmentAmount
            ]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "One-time investment order created. Payment is pending.",
            data: {
                investment_order_id: result.insertId,
                order_reference: orderReference,
                user_id: userId,
                product_id: productId,
                product_name: products[0].product_name,
                investment_type: "one_time",
                amount: investmentAmount,
                payment_status: "pending",
                order_status: "pending_payment"
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("One-time investment error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create investment order"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// =====================================
// 14. GET USER INVESTMENT ORDERS
// =====================================

exports.getUserInvestmentOrders = async (req, res) => {
    try {
        const userId = Number(req.params.userId || req.user?.userId || req.user?.id);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const [orders] = await db.execute(
            `SELECT
                io.*,
                p.product_name,
                p.provider_name,
                p.risk_level
             FROM investment_orders io
             JOIN sip_products p ON p.id = io.product_id
             WHERE io.user_id = ?
             ORDER BY io.id DESC`,
            [userId]
        );

        return res.json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error("Get investment orders:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch investment orders"
        });
    }
};


// =====================================
// 15. GET SINGLE INVESTMENT ORDER
// =====================================

exports.getInvestmentOrderDetails = async (req, res) => {
    try {
        const orderId = Number(req.params.id);

        if (!Number.isSafeInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid investment order ID"
            });
        }

        const [orders] = await db.execute(
            `SELECT
                io.*,
                p.product_name,
                p.provider_name,
                p.risk_level,
                p.minimum_investment
             FROM investment_orders io
             JOIN sip_products p ON p.id = io.product_id
             WHERE io.id = ?`,
            [orderId]
        );

        if (!orders.length) {
            return res.status(404).json({
                success: false,
                message: "Investment order not found"
            });
        }

        return res.json({
            success: true,
            data: orders[0]
        });

    } catch (error) {
        console.error("Investment order details:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch investment details"
        });
    }
};

