
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const adminAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Admin authorization token is required.'
            });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.ADMIN_JWT_SECRET;

        if (!secret) {
            return res.status(500).json({
                success: false,
                message: 'Admin authentication configuration error.'
            });
        }

        const decoded = jwt.verify(token, secret);

        if (decoded.type !== 'admin' || !decoded.adminId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin access token.'
            });
        }

        // Check current admin status in database
        const [admins] = await db.execute(
            `SELECT id, role, status
             FROM admins
             WHERE id = ?
             LIMIT 1`,
            [decoded.adminId]
        );

        if (!admins.length || admins[0].status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Admin account is inactive or unavailable.'
            });
        }

        req.admin = {
            adminId: admins[0].id,
            role: admins[0].role
        };

        next();

    } catch (error) {
        if (
            error.name === 'TokenExpiredError' ||
            error.name === 'JsonWebTokenError'
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired admin access token.'
            });
        }

        console.error('Admin Middleware Error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Admin authentication failed.'
        });
    }
};

module.exports = adminAuthMiddleware;
