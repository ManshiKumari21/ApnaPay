const db = require("../config/db");
const { randomUUID } = require("crypto");

// CREATE REFUND REQUEST
exports.createRefund = async (req, res) => {
    let connection;

    try {
        const { payment_id, amount, reason } = req.body;

        if (!payment_id || !amount || !reason) {
            return res.status(400).json({
                success: false,
                message: "payment_id, amount and reason are required"
            });
        }

        const refundAmount = Number(amount);

        if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid refund amount"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Payment lock and validation
        const [payments] = await connection.execute(
            `SELECT id, user_id, amount, status
             FROM payments
             WHERE id = ?
             FOR UPDATE`,
            [payment_id]
        );

        if (payments.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        const payment = payments[0];

        // Ensure user can only refund their own payment unless admin
        const activeUserId = req.user?.userId || req.user?.id;
        if (activeUserId && !req.user?.isAdmin && Number(payment.user_id) !== Number(activeUserId)) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: "You can only request a refund for your own payments"
            });
        }

        if (!["success", "succeeded"].includes(payment.status)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Only successful payments can be refunded"
            });
        }

        // Calculate previously requested refunds
        const [refundRows] = await connection.execute(
            `SELECT COALESCE(SUM(amount), 0) AS total_refunded
             FROM refunds
             WHERE payment_id = ?
             AND status != 'failed'`,
            [payment_id]
        );

        const alreadyRefunded = Number(refundRows[0].total_refunded);
        const originalAmount = Number(payment.amount);

        if (alreadyRefunded + refundAmount > originalAmount) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Refund amount exceeds remaining payment amount",
                remaining_amount: Math.max(
                    0,
                    originalAmount - alreadyRefunded
                )
            });
        }

        // Existing refunds table columns
        const [result] = await connection.execute(
            `INSERT INTO refunds
             (payment_id, amount, reason,
              provider_refund_reference, status)
             VALUES (?, ?, ?, ?, ?)`,
            [
                payment_id,
                refundAmount,
                reason,
                null,
                "pending"
            ]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Refund request created",
            data: {
                refund_id: result.insertId,
                payment_id,
                amount: refundAmount,
                reason,
                status: "pending"
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("CREATE REFUND ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Refund request failed",
            error: error.message
        });

    } finally {
        if (connection) connection.release();
    }
};


// GET REFUND DETAILS
exports.getRefund = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.execute(
            `SELECT *
             FROM refunds
             WHERE id = ?
             LIMIT 1`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Refund not found"
            });
        }

        return res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error("GET REFUND ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch refund",
            error: error.message
        });
    }
};


// GET REFUNDS BY PAYMENT ID
exports.getRefundsByPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const [rows] = await db.execute(
            `SELECT *
             FROM refunds
             WHERE payment_id = ?
             ORDER BY created_at DESC`,
            [paymentId]
        );

        return res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("GET REFUNDS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch refunds",
            error: error.message
        });
    }
};