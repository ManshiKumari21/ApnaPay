
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const {

    sendOtpEmail
} = require('../services/emailService');

// ==========================================
// COMMON HELPERS
// ==========================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_OTP_PURPOSES = ['login', 'email_verification', 'password_reset', 'forgot_password'];

const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const getSecrets = () => {
    const access = process.env.ADMIN_JWT_SECRET;
    const refresh = process.env.ADMIN_JWT_REFRESH_SECRET;

    if (!access || !refresh) {
        throw new Error('Admin JWT secrets are not configured.');
    }

    return { access, refresh };
};

const createTokens = (admin) => {
    const { access, refresh } = getSecrets();

    return {
        accessToken: jwt.sign(
            {
                adminId: admin.id,
                role: admin.role,
                type: 'admin'
            },
            access,
            { expiresIn: '15m' }
        ),

        refreshToken: jwt.sign(
            {
                adminId: admin.id,
                type: 'admin',
                jti: crypto.randomBytes(16).toString('hex')
            },
            refresh,
            { expiresIn: '7d' }
        )
    };
};

const saveSession = async (adminId, refreshToken) => {
    const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await db.execute(
        `INSERT INTO admin_sessions
         (admin_id, token_hash, expires_at)
         VALUES (?, ?, ?)`,
        [adminId, hashToken(refreshToken), expiresAt]
    );
};

// ==========================================
// 1. ADMIN LOGIN
// POST /api/v1/admin/auth/login
// ==========================================

exports.login = async (req, res) => {
    try {
        const email = String(req.body?.email || req.body?.identifier || req.body?.username || '')
            .trim()
            .toLowerCase();

        const password = req.body?.password;

        if (
            !EMAIL_REGEX.test(email) ||
            typeof password !== 'string' ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: 'Valid email and password are required.'
            });
        }

        const [admins] = await db.execute(
            `SELECT id, full_name, email, password_hash, role, status
             FROM admins
             WHERE email = ?
             LIMIT 1`,
            [email]
        );

        if (!admins.length) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const admin = admins[0];

        if (admin.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Admin account is inactive.'
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            admin.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const tokens = createTokens(admin);

        await saveSession(admin.id, tokens.refreshToken);

        await db.execute(
            `UPDATE admins
             SET last_login_at = NOW()
             WHERE id = ?`,
            [admin.id]
        );

        return res.status(200).json({
            success: true,
            message: 'Admin login successful.',
            data: {
                admin: {
                    id: admin.id,
                    fullName: admin.full_name,
                    email: admin.email,
                    role: admin.role
                },
                ...tokens,
                tokenType: 'Bearer',
                expiresIn: 900
            }
        });

    } catch (error) {
        console.error('Admin Login Error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to login.'
        });
    }
};

// ==========================================
// 2. ADMIN LOGOUT
// POST /api/v1/admin/auth/logout
// ==========================================

exports.logout = async (req, res) => {
    try {
        const refreshToken = req.body?.refreshToken || req.body?.refresh_token || req.body?.token;
        const authHeader = req.headers?.authorization;

        if (refreshToken && typeof refreshToken === 'string' && refreshToken.trim()) {
            const tokenHash = hashToken(refreshToken.trim());

            await db.execute(
                `UPDATE admin_sessions
                 SET revoked_at = NOW()
                 WHERE token_hash = ?
                 AND revoked_at IS NULL`,
                [tokenHash]
            );

            return res.status(200).json({
                success: true,
                message: 'Admin logout successful.'
            });
        }

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const bearerToken = authHeader.split(' ')[1];
            try {
                const { access } = getSecrets();
                const decoded = jwt.verify(bearerToken, access);

                if (decoded && decoded.adminId) {
                    await db.execute(
                        `UPDATE admin_sessions
                         SET revoked_at = NOW()
                         WHERE admin_id = ?
                         AND revoked_at IS NULL`,
                        [decoded.adminId]
                    );
                }
            } catch (_) {
                // Ignore expired token error on logout
            }

            return res.status(200).json({
                success: true,
                message: 'Admin logout successful.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Admin logout successful.'
        });

    } catch (error) {
        console.error('Admin Logout Error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to logout.'
        });
    }
};

// ==========================================
// 3. SEND ADMIN OTP
// POST /api/v1/admin/auth/send-otp
// ==========================================

exports.sendOtp = async (req, res) => {
    try {
        const email = String(req.body?.email || '')
            .trim()
            .toLowerCase();

        const purpose = String(req.body?.purpose || 'login')
            .trim();

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Valid email address is required.'
            });
        }

        if (!ALLOWED_OTP_PURPOSES.includes(purpose)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP purpose.'
            });
        }

        const [admins] = await db.execute(
            `SELECT id, email
             FROM admins
             WHERE LOWER(TRIM(email)) = ?
             AND status = 'active'
             LIMIT 1`,
            [email]
        );

        // Generic response to avoid revealing account existence.
        if (!admins.length) {
            console.warn(`[Admin Send OTP] No active admin account found for: ${email}`);
            return res.status(200).json({
                success: true,
                message: (purpose === 'password_reset' || purpose === 'forgot_password')
                    ? 'If an account exists, a 6-digit OTP has been sent to your registered email address.'
                    : 'If an active admin account exists, an OTP will be sent.'
            });
        }

        const admin = admins[0];

        const [recent] = await db.execute(
            `SELECT id
             FROM admin_otp_verifications
             WHERE email = ?
             AND purpose = ?
             AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
             LIMIT 1`,
            [email, purpose]
        );

        if (recent.length) {
            return res.status(429).json({
                success: false,
                message: 'Please wait before requesting another OTP.'
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();

        const otpHash = await bcrypt.hash(otp, 10);

        const expiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        await db.execute(
            `UPDATE admin_otp_verifications
             SET expires_at = NOW()
             WHERE email = ?
             AND purpose = ?
             AND verified_at IS NULL`,
            [email, purpose]
        );

        await db.execute(
            `INSERT INTO admin_otp_verifications
             (admin_id, email, otp_hash, purpose, expires_at)
             VALUES (?, ?, ?, ?, ?)`,
            [
                admin.id,
                email,
                otpHash,
                purpose,
                expiresAt
            ]
        );

        let emailSendRes = null;
        try {
            emailSendRes = await sendOtpEmail(email, otp, purpose);
        } catch (emailErr) {
            console.warn('[Admin Send OTP] sendOtpEmail warning:', emailErr.message);
        }

        const response = {
            success: true,
            message: (purpose === 'password_reset' || purpose === 'forgot_password')
                ? 'If an account exists, a 6-digit OTP has been sent to your registered email address.'
                : 'OTP sent successfully to your registered admin email address. Please check your inbox.',
            expiresIn: 300
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error('Admin Send OTP Error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to send OTP.'
        });
    }
};

// ==========================================
// 4. VERIFY ADMIN OTP
// POST /api/v1/admin/auth/verify-otp
// ==========================================

exports.verifyOtp = async (req, res) => {
    try {
        const email = String(req.body?.email || '')
            .trim()
            .toLowerCase();

        const otp = String(req.body?.otp || '').trim();

        const purpose = String(req.body?.purpose || 'login')
            .trim();

        if (
            !EMAIL_REGEX.test(email) ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Valid email and 6-digit OTP are required.'
            });
        }

        if (!ALLOWED_OTP_PURPOSES.includes(purpose)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP purpose.'
            });
        }

        const [records] = await db.execute(
            `SELECT id, admin_id, otp_hash, attempts
             FROM admin_otp_verifications
             WHERE email = ?
             AND purpose = ?
             AND verified_at IS NULL
             AND expires_at > NOW()
             ORDER BY id DESC
             LIMIT 1`,
            [email, purpose]
        );

        if (!records.length) {
            return res.status(400).json({
                success: false,
                message: 'OTP is invalid or expired.'
            });
        }

        const record = records[0];

        if (record.attempts >= 5) {
            return res.status(429).json({
                success: false,
                message: 'Maximum OTP attempts exceeded. Request a new OTP.'
            });
        }

        const isOtpValid = await bcrypt.compare(
            otp,
            record.otp_hash
        );

        if (!isOtpValid) {
            await db.execute(
                `UPDATE admin_otp_verifications
                 SET attempts = attempts + 1
                 WHERE id = ?
                 AND attempts < 5`,
                [record.id]
            );

            return res.status(400).json({
                success: false,
                message: 'Incorrect OTP.'
            });
        }

        await db.execute(
            `UPDATE admin_otp_verifications
             SET verified_at = NOW()
             WHERE id = ?
             AND verified_at IS NULL`,
            [record.id]
        );

        if (purpose === 'email_verification') {
            await db.execute(
                `UPDATE admins
                 SET email_verified_at = NOW()
                 WHERE id = ?
                 AND email = ?`,
                [record.admin_id, email]
            );
        }

        if (purpose === 'login') {
            const [admins] = await db.execute(
                `SELECT id, full_name, email, role, status
                 FROM admins
                 WHERE id = ?
                 LIMIT 1`,
                [record.admin_id]
            );

            if (admins.length && admins[0].status === 'active') {
                const admin = admins[0];
                const tokens = createTokens(admin);
                await saveSession(admin.id, tokens.refreshToken);
                await db.execute(
                    `UPDATE admins
                     SET last_login_at = NOW()
                     WHERE id = ?`,
                    [admin.id]
                );

                return res.status(200).json({
                    success: true,
                    message: 'Admin OTP login successful.',
                    data: {
                        admin: {
                            id: admin.id,
                            fullName: admin.full_name,
                            email: admin.email,
                            role: admin.role
                        },
                        ...tokens,
                        tokenType: 'Bearer',
                        expiresIn: 900
                    }
                });
            }
        }

        let resetAuthorizationToken = null;
        if (purpose === 'password_reset' || purpose === 'forgot_password') {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = hashToken(rawToken);
            const resetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

            await db.execute(
                `UPDATE admin_password_resets
                 SET used_at = NOW()
                 WHERE admin_id = ?
                 AND used_at IS NULL`,
                [record.admin_id]
            );

            await db.execute(
                `INSERT INTO admin_password_resets
                 (admin_id, token_hash, expires_at)
                 VALUES (?, ?, ?)`,
                [
                    record.admin_id,
                    tokenHash,
                    resetExpiresAt
                ]
            );

            resetAuthorizationToken = rawToken;
        }

        const verifyResponse = {
            success: true,
            message: 'OTP verified successfully.'
        };

        if (resetAuthorizationToken) {
            verifyResponse.resetAuthorizationToken = resetAuthorizationToken;
            verifyResponse.resetToken = resetAuthorizationToken;
        }

        return res.status(200).json(verifyResponse);

    } catch (error) {
        console.error('Admin Verify OTP Error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to verify OTP.'
        });
    }
};

// ==========================================
// 5. REFRESH ADMIN TOKEN
// POST /api/v1/admin/auth/refresh
// ==========================================

exports.refreshToken = async (req, res) => {
    let connection;

    try {
        const refreshToken = req.body?.refreshToken;

        if (
            typeof refreshToken !== 'string' ||
            !refreshToken.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required.'
            });
        }

        const { refresh } = getSecrets();

        const decoded = jwt.verify(
            refreshToken,
            refresh
        );

        if (
            decoded.type !== 'admin' ||
            !decoded.adminId
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin refresh token.'
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();

        const [sessions] = await connection.execute(
            `SELECT id
             FROM admin_sessions
             WHERE admin_id = ?
             AND token_hash = ?
             AND revoked_at IS NULL
             AND expires_at > NOW()
             LIMIT 1
             FOR UPDATE`,
            [
                decoded.adminId,
                hashToken(refreshToken)
            ]
        );

        if (!sessions.length) {
            await connection.rollback();

            return res.status(401).json({
                success: false,
                message: 'Refresh token is expired or revoked.'
            });
        }

        const [admins] = await connection.execute(
            `SELECT id, role, status
             FROM admins
             WHERE id = ?
             LIMIT 1`,
            [decoded.adminId]
        );

        if (
            !admins.length ||
            admins[0].status !== 'active'
        ) {
            await connection.rollback();

            return res.status(403).json({
                success: false,
                message: 'Admin account is unavailable.'
            });
        }

        const tokens = createTokens(admins[0]);

        const [revokeResult] = await connection.execute(
            `UPDATE admin_sessions
             SET revoked_at = NOW()
             WHERE id = ?
             AND revoked_at IS NULL`,
            [sessions[0].id]
        );

        if (revokeResult.affectedRows !== 1) {
            throw new Error('Refresh token has already been used.');
        }

        const expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        await connection.execute(
            `INSERT INTO admin_sessions
             (admin_id, token_hash, expires_at)
             VALUES (?, ?, ?)`,
            [
                decoded.adminId,
                hashToken(tokens.refreshToken),
                expiresAt
            ]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: 'Admin token refreshed successfully.',
            data: {
                ...tokens,
                tokenType: 'Bearer',
                expiresIn: 900
            }
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (_) { }
        }

        if (
            error.name === 'TokenExpiredError' ||
            error.name === 'JsonWebTokenError'
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token.'
            });
        }

        console.error('Admin Refresh Error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to refresh admin token.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ==========================================
// 6. ADMIN FORGOT PASSWORD
// POST /api/v1/admin/auth/forgot-password
// ==========================================

exports.forgotPassword = async (req, res) => {
    try {
        const email = String(req.body?.email || '')
            .trim()
            .toLowerCase();

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Valid email address is required.'
            });
        }

        const genericMessage =
            'If an account exists, a 6-digit OTP has been sent to your registered email address.';

        const [admins] = await db.execute(
            `SELECT id, email
             FROM admins
             WHERE LOWER(TRIM(email)) = ?
             AND status = 'active'
             LIMIT 1`,
            [email]
        );

        if (!admins.length) {
            console.warn(`[Admin Forgot Password] No active admin account found for: ${email}`);
            return res.status(200).json({
                success: true,
                message: genericMessage
            });
        }

        const admin = admins[0];

        // 60-second cooldown check
        const [recent] = await db.execute(
            `SELECT id
             FROM admin_otp_verifications
             WHERE email = ?
             AND purpose = 'password_reset'
             AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
             LIMIT 1`,
            [email]
        );

        if (recent.length) {
            return res.status(429).json({
                success: false,
                message: 'Please wait 60 seconds before requesting another OTP.'
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await db.execute(
            `UPDATE admin_otp_verifications
             SET expires_at = NOW()
             WHERE email = ?
             AND purpose = 'password_reset'
             AND verified_at IS NULL`,
            [email]
        );

        await db.execute(
            `INSERT INTO admin_otp_verifications
             (admin_id, email, otp_hash, purpose, expires_at, attempts)
             VALUES (?, ?, ?, 'password_reset', ?, 0)`,
            [
                admin.id,
                email,
                otpHash,
                expiresAt
            ]
        );

        await sendOtpEmail(email, otp, 'password_reset');

        return res.status(200).json({
            success: true,
            message: genericMessage
        });

    } catch (error) {
        console.error('Admin Forgot Password Error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to process password reset request.'
        });
    }
};

// ==========================================
// 7. ADMIN RESET PASSWORD
// POST /api/v1/admin/auth/reset-password
// ==========================================

exports.resetPassword = async (req, res) => {
    let connection;

    try {
        const rawToken = req.body?.resetAuthorizationToken || req.body?.token || req.body?.resetToken;
        const newPassword = req.body?.newPassword || req.body?.password;

        if (
            typeof rawToken !== 'string' ||
            !rawToken.trim() ||
            typeof newPassword !== 'string' ||
            newPassword.length < 8
        ) {
            return res.status(400).json({
                success: false,
                message: 'Valid reset token and password (minimum 8 characters) are required.'
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [records] = await connection.execute(
            `SELECT id, admin_id
             FROM admin_password_resets
             WHERE token_hash = ?
             AND used_at IS NULL
             AND expires_at > NOW()
             LIMIT 1
             FOR UPDATE`,
            [hashToken(rawToken.trim())]
        );

        if (!records.length) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Reset token is invalid, expired or already used. Please verify OTP again.'
            });
        }

        const record = records[0];

        const passwordHash = await bcrypt.hash(
            newPassword,
            12
        );

        await connection.execute(
            `UPDATE admins
             SET password_hash = ?
             WHERE id = ?`,
            [passwordHash, record.admin_id]
        );

        await connection.execute(
            `UPDATE admin_password_resets
             SET used_at = NOW()
             WHERE id = ?`,
            [record.id]
        );

        await connection.execute(
            `UPDATE admin_otp_verifications
             SET expires_at = NOW()
             WHERE admin_id = ?
             AND purpose = 'password_reset'`,
            [record.admin_id]
        );

        await connection.execute(
            `UPDATE admin_sessions
             SET revoked_at = NOW()
             WHERE admin_id = ?
             AND revoked_at IS NULL`,
            [record.admin_id]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: 'Admin password reset successfully. Please login with your new password.'
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (_) { }
        }

        console.error('Admin Reset Password Error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to reset admin password.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ==========================================
// 8. ADMIN CHANGE PASSWORD
// POST /api/v1/admin/auth/change-password
// ==========================================

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, oldPassword, newPassword } = req.body || {};
        const currentPass = currentPassword || oldPassword;

        if (
            typeof currentPass !== 'string' ||
            !currentPass ||
            typeof newPassword !== 'string' ||
            newPassword.length < 8
        ) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password (minimum 8 characters) are required.'
            });
        }

        const [admins] = await db.execute(
            `SELECT id, password_hash
             FROM admins
             WHERE id = ?
             LIMIT 1`,
            [req.admin.adminId]
        );

        if (!admins.length) {
            return res.status(404).json({
                success: false,
                message: 'Admin account not found.'
            });
        }

        const isPasswordValid = await bcrypt.compare(
            currentPass,
            admins[0].password_hash
        );

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect.'
            });
        }

        const newHash = await bcrypt.hash(
            newPassword,
            12
        );

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            await connection.execute(
                `UPDATE admins
                 SET password_hash = ?
                 WHERE id = ?`,
                [newHash, req.admin.adminId]
            );

            await connection.execute(
                `UPDATE admin_sessions
                 SET revoked_at = NOW()
                 WHERE admin_id = ?
                 AND revoked_at IS NULL`,
                [req.admin.adminId]
            );

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully. Please login again.'
        });

    } catch (error) {
        console.error('Admin Change Password Error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to change admin password.'
        });
    }
};

// ==========================================
// 9. ADMIN PROFILE
// GET /api/v1/admin/auth/profile
// ==========================================

exports.profile = async (req, res) => {
    try {
        const [admins] = await db.execute(
            `SELECT
                id,
                full_name,
                email,
                role,
                status,
                email_verified_at,
                last_login_at,
                created_at
             FROM admins
             WHERE id = ?
             LIMIT 1`,
            [req.admin.adminId]
        );

        if (!admins.length) {
            return res.status(404).json({
                success: false,
                message: 'Admin account not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Admin profile fetched successfully.',
            data: {
                admin: admins[0]
            }
        });

    } catch (error) {
        console.error('Admin Profile Error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch admin profile.'
        });
    }
};
