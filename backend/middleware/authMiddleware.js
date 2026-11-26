
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is required.'
            });
        }

        // Extract token
        const token = authHeader.split(' ')[1];

        // Check token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token.'
            });
        }

        // Verify JWT token with user secret or admin secret fallback
        let decoded;
        const userSecret = process.env.JWT_SECRET || 'apnapay_access_secret_key_2026';
        const adminSecret = process.env.ADMIN_JWT_SECRET || 'ApnaPay_Admin_Access_Secret_Change_This_2026';

        try {
            decoded = jwt.verify(token, userSecret);
        } catch (verifyErr) {
            if (verifyErr.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication token has expired.'
                });
            }
            try {
                decoded = jwt.verify(token, adminSecret);
            } catch (adminErr) {
                if (adminErr.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication token has expired.'
                    });
                }
                return res.status(401).json({
                    success: false,
                    message: 'Invalid authentication token.'
                });
            }
        }

        // Store authenticated user ID
        const resolvedUserId = decoded.userId || decoded.id || decoded.adminId;
        req.user = {
            ...decoded,
            userId: resolvedUserId,
            id: resolvedUserId,
            role: decoded.role || (decoded.adminId ? 'admin' : 'customer'),
            isAdmin: decoded.type === 'admin' || decoded.role === 'admin' || Boolean(decoded.adminId)
        };

        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Authentication token has expired.'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token.'
        });
    }
};

module.exports = authMiddleware;
