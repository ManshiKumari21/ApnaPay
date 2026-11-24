
const db = require("../config/db");

// CREATE DISPUTE
exports.createDispute = async (req, res) => {
    try {
        const { payment_id, dispute_reason, description } = req.body;

        if (!payment_id || !dispute_reason || !description) {
            return res.status(400).json({
                success: false,
                message: "Payment ID, dispute reason and description are required"
            });
        }

        // Payment details fetch
        const [payments] = await db.execute(
            `SELECT id, user_id
             FROM payments
             WHERE id = ?
             LIMIT 1`,
            [payment_id]
        );

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        const payment = payments[0];

        // Ensure user can only dispute their own payment unless admin
        const activeUserId = req.user?.userId || req.user?.id;
        if (activeUserId && !req.user?.isAdmin && Number(payment.user_id) !== Number(activeUserId)) {
            return res.status(403).json({
                success: false,
                message: "You can only dispute your own payments"
            });
        }

        // Check existing open dispute
        const [existing] = await db.execute(
            `SELECT id
             FROM disputes
             WHERE payment_id = ?
             AND status = 'open'
             LIMIT 1`,
            [payment_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Dispute already exists for this payment"
            });
        }

        // Insert dispute using existing columns
        const [result] = await db.execute(
            `INSERT INTO disputes
            (
                user_id,
                payment_id,
                dispute_reason,
                description,
                status
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                payment.user_id,
                payment.id,
                dispute_reason,
                description,
                "open"
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Dispute created successfully",
            data: {
                dispute_id: result.insertId,
                user_id: payment.user_id,
                payment_id: payment.id,
                dispute_reason,
                description,
                status: "open"
            }
        });

    } catch (error) {
        console.error("CREATE DISPUTE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Dispute creation failed",
            error: error.message
        });
    }
};


// GET DISPUTE BY ID
exports.getDispute = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.execute(
            `SELECT *
             FROM disputes
             WHERE id = ?
             LIMIT 1`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Dispute not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error("GET DISPUTE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch dispute",
            error: error.message
        });
    }
};


// GET DISPUTES BY PAYMENT ID
exports.getDisputesByPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const [rows] = await db.execute(
            `SELECT *
             FROM disputes
             WHERE payment_id = ?
             ORDER BY created_at DESC`,
            [paymentId]
        );

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("GET DISPUTES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch disputes",
            error: error.message
        });
    }
};


// GET ALL DISPUTES
exports.getAllDisputes = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT *
             FROM disputes
             ORDER BY created_at DESC`
        );

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("GET ALL DISPUTES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch disputes",
            error: error.message
        });
    }
};
