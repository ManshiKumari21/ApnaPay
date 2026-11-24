const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const {
    sendOtpEmail,
    maskEmail
} = require('../services/emailService');
const smsService = require('../services/smsService');
const NotificationService = require('../services/notificationService');

// Phone number normalizer
const normalizePhone = (phone) =>
    String(phone || '').replace(/[\s-]/g, '').trim();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_DEFAULT_PURPOSE = 'email_verification';
const OTP_EXPIRY_MINUTES = 5;
const OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 60;
const OTP_MAX_ATTEMPTS = 5;

// ================= TOKEN HELPERS =================

const hashToken = (token) => {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
};

const durationToMilliseconds = (duration) => {
    const match = /^(\d+)([smhd])$/.exec(String(duration || '7d').trim());

    if (!match) {
        return 7 * 86400000;
    }

    const units = {
        s: 1000,
        m: 60000,
        h: 3600000,
        d: 86400000
    };

    return Number(match[1]) * units[match[2]];
};

const generateAccessToken = (userId) => {
    const secret = process.env.JWT_SECRET || 'apnapay_access_secret_key_2026';
    return jwt.sign(
        { userId },
        secret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
};

const generateRefreshToken = (userId) => {
    const secret = process.env.JWT_REFRESH_SECRET || 'apnapay_refresh_secret_key_2026';
    return jwt.sign(
        { userId, jti: crypto.randomBytes(16).toString('hex') },
        secret,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
};

const getRefreshExpiryDate = () => {
    const duration = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    return new Date(Date.now() + durationToMilliseconds(duration));
};

const isDevMode = () => {
    return (
        process.env.NODE_ENV === 'development' ||
        process.env.DEV_EMAIL_BYPASS === 'true' ||
        process.env.DEV_AUTH_TEST_MODE === 'true'
    );
};


// ================= 1. SEND OTP API =================
// POST /auth/send-otp
exports.sendOtp = async (req, res) => {
    try {
        const rawEmail = req.body?.email ? String(req.body.email).trim().toLowerCase() : null;
        const rawPhone = req.body?.phone ? normalizePhone(req.body.phone) : null;
        const purpose = String(req.body?.purpose || OTP_DEFAULT_PURPOSE).trim();

        if (!rawEmail && !rawPhone) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone number is required.'
            });
        }

        if (rawEmail && !EMAIL_REGEX.test(rawEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address.'
            });
        }

        if (rawPhone && !/^\+?[0-9]{10,15}$/.test(rawPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 10-15 digit phone number.'
            });
        }

        let existingUserId = null;

        // For registration or email verification: ensure the account is not already registered
        if (purpose === 'email_verification' || purpose === 'register' || purpose === 'registration') {
            const [existing] = await db.execute(
                `SELECT id, email, phone FROM users 
                 WHERE (email = ? AND email IS NOT NULL) 
                    OR phone = ? 
                    OR phone = ? 
                    OR phone = ? 
                 LIMIT 1`,
                [rawEmail, rawPhone, `+91${rawPhone}`, `91${rawPhone}`]
            );

            if (existing.length > 0) {
                const isEmailMatch = rawEmail && existing[0].email && existing[0].email.toLowerCase() === rawEmail;
                const isPhoneMatch = rawPhone && existing[0].phone && (existing[0].phone === rawPhone || existing[0].phone.endsWith(rawPhone));
                let message = 'An account with this email or phone is already registered.';
                if (isEmailMatch && isPhoneMatch) {
                    message = 'An account with this email and phone number is already registered. Please log in.';
                } else if (isEmailMatch) {
                    message = 'An account with this email is already registered. Please log in.';
                } else if (isPhoneMatch) {
                    message = 'An account with this phone number is already registered. Please log in.';
                }
                return res.status(409).json({
                    success: false,
                    message
                });
            }
        }

        // For password reset: ensure the account actually exists, but return generic success to avoid enumeration
        if (purpose === 'password_reset' || purpose === 'forgot_password') {
            const [existing] = await db.execute(
                `SELECT id, email FROM users WHERE email = ? LIMIT 1`,
                [rawEmail]
            );

            if (existing.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'If an account exists, a 6-digit OTP has been sent to your registered email address.'
                });
            }
            existingUserId = existing[0].id;
        }

        // Cooldown check: configurable resend cooldown (default: 30 seconds)
        const cooldownSeconds = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 30;
        const [recentOtps] = await db.execute(
            `SELECT id, created_at FROM otp_verifications
             WHERE ((email = ? AND email IS NOT NULL) OR (phone = ? AND phone IS NOT NULL))
             AND purpose = ?
             AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
             ORDER BY created_at DESC
             LIMIT 1`,
            [rawEmail, rawPhone, purpose, cooldownSeconds]
        );

        if (recentOtps.length > 0) {
            const elapsed = Math.floor((Date.now() - new Date(recentOtps[0].created_at).getTime()) / 1000);
            const remaining = Math.max(1, cooldownSeconds - elapsed);
            return res.status(429).json({
                success: false,
                message: 'Please wait before requesting another OTP.',
                cooldownRemaining: remaining
            });
        }

        // Generate 6-digit secure random OTP
        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Invalidate previous unverified OTPs for this target & purpose
        await db.execute(
            `UPDATE otp_verifications
             SET expires_at = NOW()
             WHERE ((email = ? AND email IS NOT NULL) OR (phone = ? AND phone IS NOT NULL))
             AND purpose = ?
             AND verified_at IS NULL`,
            [rawEmail, rawPhone, purpose]
        );

        // Save new OTP in database (hashed only)
        await db.execute(
            `INSERT INTO otp_verifications
             (user_id, phone, email, otp_hash, purpose, expires_at, attempts)
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [existingUserId, rawPhone, rawEmail, otpHash, purpose, expiresAt]
        );

        // Delivery handling: Email OTP as primary channel
        let emailSendRes = null;
        if (rawEmail) {
            emailSendRes = await sendOtpEmail(rawEmail, otp, purpose);
        } else if (rawPhone) {
            if (smsService.isSmsConfigured()) {
                await smsService.sendOtpSms({ phone: rawPhone, otp, purpose });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'SMS service is not configured. Please use email for OTP delivery.'
                });
            }
        }

        const isPasswordResetPurpose = purpose === 'password_reset' || purpose === 'forgot_password';

        let msg = isPasswordResetPurpose
            ? 'If an account exists, a 6-digit OTP has been sent to your registered email address.'
            : 'Verification code sent to your registered email.';

        if (emailSendRes?.simulated || isDevMode()) {
            msg = `Verification code sent to your registered email. (OTP: ${otp})`;
        }

        const responsePayload = {
            success: true,
            message: msg,
            otp: (emailSendRes?.simulated || isDevMode()) ? otp : undefined,
            devOtp: (emailSendRes?.simulated || isDevMode()) ? otp : undefined,
            expiresIn: OTP_EXPIRY_MINUTES * 60,
            cooldownRemaining: cooldownSeconds
        };

        return res.status(200).json(responsePayload);

    } catch (error) {
        console.error('Send OTP Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to send verification code. Please try again.'
        });
    }
};


// ================= 2. VERIFY OTP API =================
// POST /auth/verify-otp
exports.verifyOtp = async (req, res) => {
    try {
        const rawEmail = req.body?.email ? String(req.body.email).trim().toLowerCase() : null;
        const rawPhone = req.body?.phone ? normalizePhone(req.body.phone) : null;
        const otp = String(req.body?.otp || '').trim();
        const purpose = String(req.body?.purpose || OTP_DEFAULT_PURPOSE).trim();

        if (!rawEmail && !rawPhone) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone number is required.'
            });
        }

        if (!/^[0-9]{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 6-digit OTP.'
            });
        }

        // Fetch latest active unverified OTP
        const [otpRecords] = await db.execute(
            `SELECT id, otp_hash, attempts, user_id
             FROM otp_verifications
             WHERE ((email = ? AND email IS NOT NULL) OR (phone = ? AND phone IS NOT NULL))
             AND purpose = ?
             AND verified_at IS NULL
             AND expires_at > NOW()
             ORDER BY created_at DESC
             LIMIT 1`,
            [rawEmail, rawPhone, purpose]
        );

        if (otpRecords.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP. Please request a new OTP.'
            });
        }

        const otpRecord = otpRecords[0];

        if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
            return res.status(429).json({
                success: false,
                message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.'
            });
        }

        const isOtpValid = await bcrypt.compare(otp, otpRecord.otp_hash);

        if (!isOtpValid) {
            await db.execute(
                `UPDATE otp_verifications
                 SET attempts = attempts + 1
                 WHERE id = ?`,
                [otpRecord.id]
            );

            return res.status(400).json({
                success: false,
                message: 'Incorrect OTP. Please check and try again.'
            });
        }

        // Mark OTP record as verified
        await db.execute(
            `UPDATE otp_verifications
             SET verified_at = NOW()
             WHERE id = ?`,
            [otpRecord.id]
        );

        // If email verification for registered user, mark in users table
        if (purpose === 'email_verification' && rawEmail) {
            await db.execute(
                `UPDATE users SET email_verified_at = NOW() WHERE email = ?`,
                [rawEmail]
            );
        }

        // If password reset OTP: issue a valid resetToken in password_resets table
        let resetToken = null;
        if (purpose === 'password_reset' || purpose === 'forgot_password') {
            let userId = otpRecord.user_id;

            if (!userId && rawEmail) {
                const [u] = await db.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [rawEmail]);
                if (u.length > 0) userId = u[0].id;
            }

            if (userId) {
                const rawToken = crypto.randomBytes(32).toString('hex');
                const tokenHash = hashToken(rawToken);
                const expiryMinutes = 15;
                const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

                await db.execute(
                    `UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL`,
                    [userId]
                );

                await db.execute(
                    `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
                    [userId, tokenHash, expiresAt]
                );

                resetToken = rawToken;
            }
        }

        const responsePayload = {
            success: true,
            message: 'OTP verified successfully.'
        };

        if (resetToken) {
            responsePayload.resetAuthorizationToken = resetToken;
            responsePayload.resetToken = resetToken;
        }

        return res.status(200).json(responsePayload);

    } catch (error) {
        console.error('Verify OTP Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to verify OTP. Please try again.'
        });
    }
};


// ================= 3. REGISTER API =================
// POST /auth/register
exports.register = async (req, res) => {
    try {
        const { full_name, name, phone, mobile, email, password } = req.body || {};

        const userName = String(full_name || name || '').trim();
        const userPhone = normalizePhone(phone || mobile);
        const userEmail = email ? String(email).trim().toLowerCase() : null;

        if (!userName || !userPhone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Full name, phone and password are required.'
            });
        }

        if (userName.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Full name must be at least 2 characters.'
            });
        }

        if (!/^\+?[0-9]{10,15}$/.test(userPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid phone number (10-15 digits).'
            });
        }

        if (userEmail && !EMAIL_REGEX.test(userEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address.'
            });
        }

        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long.'
            });
        }

        // Email verification check (OTP verified within last 60 minutes)
        let isEmailVerified = false;
        if (userEmail) {
            const [verifiedOtps] = await db.execute(
                `SELECT id
                 FROM otp_verifications
                 WHERE email = ?
                 AND verified_at IS NOT NULL
                 AND user_id IS NULL
                 AND verified_at >= DATE_SUB(NOW(), INTERVAL 60 MINUTE)
                 ORDER BY verified_at DESC
                 LIMIT 1`,
                [userEmail]
            );

            if (verifiedOtps.length > 0) {
                isEmailVerified = true;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Please verify your email via OTP before registration.'
                });
            }
        }

        // Check for existing user with duplicate phone or email
        const [existingUsers] = await db.execute(
            `SELECT id, email, phone
             FROM users
             WHERE phone = ? OR phone = ? OR phone = ? OR (email = ? AND email IS NOT NULL)
             LIMIT 1`,
            [userPhone, `+91${userPhone}`, `91${userPhone}`, userEmail]
        );

        if (existingUsers.length > 0) {
            const existing = existingUsers[0];
            const duplicateField = (existing.phone === userPhone || existing.phone?.endsWith(userPhone)) ? 'Phone number' : 'Email address';
            return res.status(409).json({
                success: false,
                message: `${duplicateField} is already registered. Please log in instead.`
            });
        }

        // Hash password securely with bcrypt
        const passwordHash = await bcrypt.hash(password, 12);
        const emailVerifiedAt = isEmailVerified ? new Date() : null;

        // Insert new user into database
        const [result] = await db.execute(
            `INSERT INTO users
             (full_name, email, phone, password_hash, email_verified_at, status)
             VALUES (?, ?, ?, ?, ?, 'active')`,
            [userName, userEmail, userPhone, passwordHash, emailVerifiedAt]
        );

        const newUserId = result.insertId;

        // Initialize user wallet in wallets table
        try {
            await db.execute(
                `INSERT INTO wallets (user_id, currency, available_balance, status)
                 VALUES (?, 'INR', 0.0000, 'active')
                 ON DUPLICATE KEY UPDATE status = 'active'`,
                [newUserId]
            );
        } catch (walletErr) {
            console.warn('Wallet initialization notice:', walletErr.message);
        }

        // Link verified OTP records to this new user
        if (userEmail) {
            await db.execute(
                `UPDATE otp_verifications SET user_id = ? WHERE email = ? AND user_id IS NULL`,
                [newUserId, userEmail]
            );
        }

        // Initialize notification preferences and send welcome notification
        try {
            await NotificationService.initializePreferences(newUserId);
            await NotificationService.notify({
                userId: newUserId,
                title: 'Welcome to ApnaPay!',
                message: `Hello ${userName}, welcome aboard! Your ApnaPay account has been registered successfully.`,
                category: 'general',
                type: 'success',
                referenceId: newUserId,
                referenceType: 'user_registration'
            });
        } catch (notifErr) {
            console.warn('Welcome notification notice:', notifErr.message);
        }

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            user: {
                id: newUserId,
                full_name: userName,
                email: userEmail,
                phone: userPhone,
                status: 'active'
            }
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Phone number or email is already registered.'
            });
        }

        console.error('Register Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while creating account.'
        });
    }
};


// ================= 4. LOGIN APIs =================

// 4a. Step 1: Lookup & Verify Registered Mobile Number
// POST /auth/login/lookup-phone or /auth/login/initiate
exports.loginLookupPhone = async (req, res) => {
    try {
        const rawPhone = String(req.body?.phone || req.body?.mobile || '').trim();
        const digits = rawPhone.replace(/\D/g, '');
        const cleanPhone = digits.length > 10 ? digits.slice(-10) : digits;

        if (!cleanPhone || cleanPhone.length !== 10) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 10-digit registered mobile number.'
            });
        }

        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.'
            });
        }

        // Check if customer exists with this phone number
        const [users] = await db.execute(
            `SELECT id, full_name, email, phone, status
             FROM users
             WHERE phone = ? OR phone = ? OR phone = ?
             LIMIT 1`,
            [cleanPhone, `+91${cleanPhone}`, `91${cleanPhone}`]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No registered customer account found with this mobile number. Please check the number or create an account.'
            });
        }

        const user = users[0];

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Your account is currently inactive or suspended. Please contact customer support.'
            });
        }

        if (!user.email) {
            return res.status(400).json({
                success: false,
                message: 'No registered email address found for this account. Please contact customer support.'
            });
        }

        const phoneInfo = smsService.maskPhone(cleanPhone);
        const maskedEmail = user.email ? maskEmail(user.email) : null;

        return res.status(200).json({
            success: true,
            message: 'Registered mobile number verified. Please confirm your registered email address.',
            data: {
                phone: cleanPhone,
                registeredMobileLast4: phoneInfo.last4,
                maskedPhone: phoneInfo.masked,
                maskedEmail
            }
        });

    } catch (error) {
        console.error('Login Lookup Phone Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to verify mobile number. Please try again.'
        });
    }
};

// 4b. Step 2 & 3: Validate Registered Email & Send Login OTP
// POST /auth/login/send-otp
exports.loginSendOtp = async (req, res) => {
    try {
        const rawPhone = String(req.body?.phone || req.body?.mobile || '').trim();
        const rawEmail = String(req.body?.email || '').trim().toLowerCase();
        const deliveryMethod = String(req.body?.deliveryMethod || 'email').toLowerCase();

        const digits = rawPhone.replace(/\D/g, '');
        const cleanPhone = digits.length > 10 ? digits.slice(-10) : digits;

        if (!cleanPhone || cleanPhone.length !== 10) {
            return res.status(400).json({
                success: false,
                message: 'A valid 10-digit registered mobile number is required.'
            });
        }

        if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid registered email address.'
            });
        }

        // Look up user by matching phone AND email together
        let [users] = await db.execute(
            `SELECT id, full_name, email, phone, status
             FROM users
             WHERE (phone = ? OR phone = ? OR phone = ?)
               AND LOWER(email) = ?
             LIMIT 1`,
            [cleanPhone, `+91${cleanPhone}`, `91${cleanPhone}`, rawEmail]
        );

        let user = users[0];

        // If not found by phone and email together, check if exists by phone OR email
        if (!user) {
            const [byPhone] = await db.execute(
                `SELECT id, full_name, email, phone, status FROM users WHERE phone = ? OR phone = ? OR phone = ? LIMIT 1`,
                [cleanPhone, `+91${cleanPhone}`, `91${cleanPhone}`]
            );
            const [byEmail] = await db.execute(
                `SELECT id, full_name, email, phone, status FROM users WHERE LOWER(email) = ? LIMIT 1`,
                [rawEmail]
            );

            if (byPhone.length > 0) {
                user = byPhone[0];
                if (!user.email || user.email.toLowerCase() !== rawEmail) {
                    await db.execute('UPDATE users SET email = ? WHERE id = ?', [rawEmail, user.id]);
                    user.email = rawEmail;
                }
            } else if (byEmail.length > 0) {
                user = byEmail[0];
                if (!user.phone || !user.phone.endsWith(cleanPhone)) {
                    await db.execute('UPDATE users SET phone = ? WHERE id = ?', [cleanPhone, user.id]);
                    user.phone = cleanPhone;
                }
            } else {
                // New user - auto create customer account seamlessly
                const defaultName = rawEmail.split('@')[0];
                const dummyPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
                const [insertRes] = await db.execute(
                    `INSERT INTO users (full_name, email, phone, password_hash, email_verified_at, status)
                     VALUES (?, ?, ?, ?, NOW(), 'active')`,
                    [defaultName, rawEmail, cleanPhone, dummyPassword]
                );
                const newId = insertRes.insertId;
                try {
                    await db.execute(
                        `INSERT INTO wallets (user_id, currency, available_balance, status)
                         VALUES (?, 'INR', 0.0000, 'active')
                         ON DUPLICATE KEY UPDATE status = 'active'`,
                        [newId]
                    );
                } catch (_) {}
                user = {
                    id: newId,
                    full_name: defaultName,
                    email: rawEmail,
                    phone: cleanPhone,
                    status: 'active'
                };
            }
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Your account is deactivated or suspended. Please contact support.'
            });
        }

        // Cooldown check (60 seconds)
        const [recentOtps] = await db.execute(
            `SELECT id, created_at FROM otp_verifications
             WHERE user_id = ? AND purpose IN ('CUSTOMER_LOGIN', 'login')
             AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
             ORDER BY created_at DESC LIMIT 1`,
            [user.id, OTP_RESEND_COOLDOWN_SECONDS]
        );

        if (recentOtps.length > 0) {
            const elapsed = Math.floor((Date.now() - new Date(recentOtps[0].created_at).getTime()) / 1000);
            const remaining = Math.max(1, OTP_RESEND_COOLDOWN_SECONDS - elapsed);
            return res.status(429).json({
                success: false,
                message: `Please wait ${remaining} seconds before requesting a new OTP.`,
                cooldownRemaining: remaining
            });
        }

        // Invalidate previous unverified login OTPs for this user
        await db.execute(
            `UPDATE otp_verifications
             SET expires_at = NOW()
             WHERE user_id = ? AND purpose IN ('CUSTOMER_LOGIN', 'login') AND verified_at IS NULL`,
            [user.id]
        );

        // Generate cryptographically secure 6-digit random numeric OTP
        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Store hashed OTP in otp_verifications table (purpose = 'CUSTOMER_LOGIN')
        await db.execute(
            `INSERT INTO otp_verifications
             (user_id, phone, email, otp_hash, purpose, expires_at, attempts)
             VALUES (?, ?, ?, ?, 'CUSTOMER_LOGIN', ?, 0)`,
            [user.id, cleanPhone, rawEmail, otpHash, expiresAt]
        );

        // Masked representations
        const maskedEmail = maskEmail(rawEmail);
        const phoneInfo = smsService.maskPhone(cleanPhone);

        // Dispatch OTP via Nodemailer to the entered email address
        const emailSendResult = await sendOtpEmail(rawEmail, otp, 'login');
        let deliveryMessage = `Verification code sent to your registered email (${maskedEmail}).`;

        if (emailSendResult?.simulated || isDevMode()) {
            deliveryMessage = `Verification code sent to ${maskedEmail}. (OTP: ${otp})`;
        }

        return res.status(200).json({
            success: true,
            message: deliveryMessage,
            otp: (emailSendResult?.simulated || isDevMode()) ? otp : undefined,
            data: {
                phone: cleanPhone,
                maskedPhone: phoneInfo.masked,
                registeredMobileLast4: phoneInfo.last4,
                email: rawEmail,
                maskedEmail,
                deliveryMethod: 'email',
                otp: (emailSendResult?.simulated || isDevMode()) ? otp : undefined,
                devOtp: (emailSendResult?.simulated || isDevMode()) ? otp : undefined,
                expiresIn: OTP_EXPIRY_MINUTES * 60,
                resendCooldown: OTP_RESEND_COOLDOWN_SECONDS
            }
        });

    } catch (error) {
        console.error('Login Send OTP Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to send login verification code. Please try again.'
        });
    }
};

// 4c. Step 4: Verify Login OTP & Complete Authentication
// POST /auth/login/verify-otp
exports.loginVerifyOtp = async (req, res) => {
    try {
        const rawPhone = String(req.body?.phone || req.body?.mobile || '').trim();
        const rawEmail = String(req.body?.email || '').trim().toLowerCase();
        const otp = String(req.body?.otp || req.body?.code || req.body?.verificationCode || '').trim();

        const digits = rawPhone.replace(/\D/g, '');
        const cleanPhone = digits.length > 10 ? digits.slice(-10) : digits;

        if (!cleanPhone || cleanPhone.length !== 10) {
            return res.status(400).json({
                success: false,
                message: 'A valid 10-digit mobile number is required.'
            });
        }

        if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
            return res.status(400).json({
                success: false,
                message: 'A valid registered email address is required.'
            });
        }

        if (!otp || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 6-digit numeric verification code.'
            });
        }

        // Look up user by matching phone AND email together
        let [users] = await db.execute(
            `SELECT id, full_name, email, phone, status
             FROM users
             WHERE (phone = ? OR phone = ? OR phone = ?)
               AND LOWER(email) = ?
             LIMIT 1`,
            [cleanPhone, `+91${cleanPhone}`, `91${cleanPhone}`, rawEmail]
        );

        let user = users[0];

        if (!user) {
            const [byEmail] = await db.execute(
                `SELECT id, full_name, email, phone, status
                 FROM users
                 WHERE email = ?
                 LIMIT 1`,
                [rawEmail]
            );
            if (byEmail.length > 0) {
                user = byEmail[0];
            } else {
                const [byPhone] = await db.execute(
                    `SELECT id, full_name, email, phone, status
                     FROM users
                     WHERE phone = ? OR phone = ? OR phone = ?
                     LIMIT 1`,
                    [cleanPhone, `+91${cleanPhone}`, `91${cleanPhone}`]
                );
                if (byPhone.length > 0) {
                    user = byPhone[0];
                }
            }
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Customer account not found.'
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Your account is deactivated or suspended. Please contact support.'
            });
        }

        // Fetch latest active unverified OTP for purpose = 'CUSTOMER_LOGIN' or 'login'
        const [otpRecords] = await db.execute(
            `SELECT id, otp_hash, attempts, expires_at
             FROM otp_verifications
             WHERE (user_id = ? OR email = ? OR phone = ?) AND purpose IN ('CUSTOMER_LOGIN', 'login') AND verified_at IS NULL
             ORDER BY id DESC LIMIT 1`,
            [user.id, rawEmail, cleanPhone]
        );

        if (otpRecords.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please request OTP first.'
            });
        }

        const otpRecord = otpRecords[0];

        // Expiry check
        if (new Date(otpRecord.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new OTP.'
            });
        }

        // Max attempts check
        if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
            await db.execute('UPDATE otp_verifications SET expires_at = NOW() WHERE id = ?', [otpRecord.id]);
            return res.status(429).json({
                success: false,
                message: `Maximum incorrect attempts (${OTP_MAX_ATTEMPTS}) exceeded. This verification code is locked. Please request a new OTP.`
            });
        }

        // Secure bcrypt comparison
        const isOtpValid = await bcrypt.compare(otp, otpRecord.otp_hash);

        if (!isOtpValid) {
            const nextAttempts = otpRecord.attempts + 1;
            await db.execute('UPDATE otp_verifications SET attempts = ? WHERE id = ?', [nextAttempts, otpRecord.id]);
            const remaining = Math.max(0, OTP_MAX_ATTEMPTS - nextAttempts);

            if (remaining === 0) {
                await db.execute('UPDATE otp_verifications SET expires_at = NOW() WHERE id = ?', [otpRecord.id]);
                return res.status(429).json({
                    success: false,
                    message: `Maximum incorrect attempts (${OTP_MAX_ATTEMPTS}) exceeded. Please request a new OTP.`,
                    remainingAttempts: 0
                });
            }

            return res.status(400).json({
                success: false,
                message: `Incorrect verification code. You have ${remaining} attempt(s) remaining.`,
                remainingAttempts: remaining
            });
        }

        // Invalidate OTP to prevent replay
        await db.execute(
            `UPDATE otp_verifications SET verified_at = NOW() WHERE id = ?`,
            [otpRecord.id]
        );

        // Generate access and refresh tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        const tokenHash = hashToken(refreshToken);
        const expiresAt = getRefreshExpiryDate();

        // Save session in sessions table
        await db.execute(
            `INSERT INTO sessions (user_id, token_hash, expires_at)
             VALUES (?, ?, ?)`,
            [user.id, tokenHash, expiresAt]
        );

        // Send login success notification
        try {
            NotificationService.notify({
                userId: user.id,
                title: 'Login Successful',
                message: 'You have logged in successfully to your ApnaPay account via secure OTP verification.',
                category: 'general',
                type: 'success',
                referenceId: user.id,
                referenceType: 'user_login'
            }).catch(() => { });
        } catch (_) { }

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token: accessToken,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Login Verify OTP Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while verifying login OTP.'
        });
    }
};

// 4d. Legacy / Dual Login Endpoint
// POST /auth/login
exports.login = async (req, res) => {
    try {
        // If OTP is provided, route directly to OTP verification
        if (req.body?.otp) {
            return exports.loginVerifyOtp(req, res);
        }

        const identifier = req.body?.identifier || req.body?.email || req.body?.phone || req.body?.username;
        const password = req.body?.password;

        if (typeof identifier !== 'string' || !identifier.trim() || typeof password !== 'string' || !password) {
            return res.status(400).json({
                success: false,
                message: 'Phone/email and password are required.'
            });
        }

        const loginId = identifier.trim();
        const isEmail = loginId.includes('@');
        const searchValue = isEmail ? loginId.toLowerCase() : normalizePhone(loginId);

        // Find user by phone (supporting with or without country code) or email
        const cleanPhone = !isEmail ? String(searchValue).replace(/^\+91/, '').replace(/^91(?=\d{10}$)/, '') : null;
        const [users] = await db.execute(
            `SELECT id, full_name, email, phone, password_hash, status
             FROM users
             WHERE email = ? OR phone = ? OR (phone = ? AND ? IS NOT NULL)
             LIMIT 1`,
            [searchValue, searchValue, cleanPhone, cleanPhone]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid login credentials.'
            });
        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid login credentials.'
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Your account is deactivated or suspended. Please contact support.'
            });
        }

        // Generate access and refresh tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        const tokenHash = hashToken(refreshToken);
        const expiresAt = getRefreshExpiryDate();

        // Save session in sessions table
        await db.execute(
            `INSERT INTO sessions (user_id, token_hash, expires_at)
             VALUES (?, ?, ?)`,
            [user.id, tokenHash, expiresAt]
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token: accessToken,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Login Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while logging in.'
        });
    }
};


// ================= 5. REFRESH TOKEN API =================
// POST /auth/refresh
exports.refreshToken = async (req, res) => {
    try {
        const incomingRefreshToken =
            req.body?.refreshToken || req.body?.refresh_token || req.body?.token;

        if (typeof incomingRefreshToken !== 'string' || !incomingRefreshToken.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required.'
            });
        }

        const refreshSecret = process.env.JWT_REFRESH_SECRET || 'apnapay_refresh_secret_key_2026';
        let decoded;

        try {
            decoded = jwt.verify(incomingRefreshToken.trim(), refreshSecret);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token.'
            });
        }

        const oldTokenHash = hashToken(incomingRefreshToken.trim());

        // Validate session exists, is not revoked, and not expired
        const [sessions] = await db.execute(
            `SELECT sessions.id, sessions.user_id, users.status
             FROM sessions
             INNER JOIN users ON users.id = sessions.user_id
             WHERE sessions.token_hash = ?
             AND sessions.revoked_at IS NULL
             AND sessions.expires_at > NOW()
             LIMIT 1`,
            [oldTokenHash]
        );

        if (sessions.length === 0 || String(sessions[0].user_id) !== String(decoded.userId)) {
            return res.status(401).json({
                success: false,
                message: 'Refresh session is invalid or has expired.'
            });
        }

        const session = sessions[0];

        if (session.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Your account is not active.'
            });
        }

        // Rotate tokens
        const newAccessToken = generateAccessToken(session.user_id);
        const newRefreshToken = generateRefreshToken(session.user_id);
        const newTokenHash = hashToken(newRefreshToken);
        const newExpiresAt = getRefreshExpiryDate();

        const [updateResult] = await db.execute(
            `UPDATE sessions
             SET token_hash = ?, expires_at = ?
             WHERE id = ?
             AND token_hash = ?
             AND revoked_at IS NULL`,
            [newTokenHash, newExpiresAt, session.id, oldTokenHash]
        );

        if (updateResult.affectedRows !== 1) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token has already been rotated.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully.',
            token: newAccessToken,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        console.error('Refresh Token Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while refreshing token.'
        });
    }
};


// ================= 6. LOGOUT API =================
// POST /auth/logout
exports.logout = async (req, res) => {
    try {
        const incomingRefreshToken =
            req.body?.refreshToken || req.body?.refresh_token || req.body?.token;
        const authHeader = req.headers?.authorization;

        if (incomingRefreshToken && typeof incomingRefreshToken === 'string' && incomingRefreshToken.trim()) {
            const tokenHash = hashToken(incomingRefreshToken.trim());

            await db.execute(
                `UPDATE sessions
                 SET revoked_at = NOW()
                 WHERE token_hash = ?
                 AND revoked_at IS NULL`,
                [tokenHash]
            );

            return res.status(200).json({
                success: true,
                message: 'Logout successful.'
            });
        }

        // Support logout via Authorization Bearer token header
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const bearerToken = authHeader.split(' ')[1];
            try {
                const accessSecret = process.env.JWT_SECRET || 'apnapay_access_secret_key_2026';
                const decoded = jwt.verify(bearerToken, accessSecret);

                await db.execute(
                    `UPDATE sessions
                     SET revoked_at = NOW()
                     WHERE user_id = ?
                     AND revoked_at IS NULL`,
                    [decoded.userId]
                );

                return res.status(200).json({
                    success: true,
                    message: 'Logout successful.'
                });
            } catch (jwtErr) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid authorization token.'
                });
            }
        }

        return res.status(400).json({
            success: false,
            message: 'Refresh token in body or Bearer token in Authorization header is required.'
        });

    } catch (error) {
        console.error('Logout Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while logging out.'
        });
    }
};


// ================= 7. FORGOT PASSWORD API =================
// POST /auth/forgot-password
exports.forgotPassword = async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();

        if (!email || !EMAIL_REGEX.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address.'
            });
        }

        const genericMessage = 'If an account exists, a 6-digit OTP has been sent to your registered email address.';

        const [users] = await db.execute(
            `SELECT id, email FROM users WHERE email = ? LIMIT 1`,
            [email]
        );

        if (users.length === 0) {
            // Avoid revealing whether an email address is registered
            return res.status(200).json({
                success: true,
                message: genericMessage
            });
        }

        const user = users[0];

        // Strict 60-second cooldown check
        const [recentOtps] = await db.execute(
            `SELECT id FROM otp_verifications
             WHERE email = ? AND purpose = 'password_reset'
             AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
             ORDER BY created_at DESC
             LIMIT 1`,
            [user.email]
        );

        if (recentOtps.length > 0) {
            return res.status(429).json({
                success: false,
                message: 'Please wait 60 seconds before requesting another OTP.'
            });
        }

        // Generate cryptographically secure 6-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Invalidate previous unverified OTPs
        await db.execute(
            `UPDATE otp_verifications
             SET expires_at = NOW()
             WHERE email = ?
             AND purpose = 'password_reset'
             AND verified_at IS NULL`,
            [user.email]
        );

        // Store OTP hash (never store plain text)
        await db.execute(
            `INSERT INTO otp_verifications
             (user_id, phone, email, otp_hash, purpose, expires_at, attempts)
             VALUES (?, NULL, ?, ?, 'password_reset', ?, 0)`,
            [user.id, user.email, otpHash, otpExpiresAt]
        );

        // Send OTP email via Nodemailer Gmail SMTP
        const emailRes = await sendOtpEmail(user.email, otp, 'password_reset');

        let responseMsg = genericMessage;
        if (emailRes?.simulated || isDevMode()) {
            responseMsg = `${genericMessage} (OTP: ${otp})`;
        }

        return res.status(200).json({
            success: true,
            message: responseMsg,
            otp: (emailRes?.simulated || isDevMode()) ? otp : undefined,
            devOtp: (emailRes?.simulated || isDevMode()) ? otp : undefined
        });

    } catch (error) {
        console.error('Forgot Password Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to process password reset request.'
        });
    }
};


// ================= 8. RESET PASSWORD API =================
// POST /auth/reset-password
exports.resetPassword = async (req, res) => {
    let connection;

    try {
        const rawToken = req.body?.resetAuthorizationToken || req.body?.token || req.body?.resetToken || req.body?.reset_token;
        const newPassword = req.body?.newPassword || req.body?.password;

        if (typeof newPassword !== 'string' || !newPassword || newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long.'
            });
        }

        if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Password reset authorization token is required.'
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const tokenHash = hashToken(rawToken.trim());
        const [records] = await connection.execute(
            `SELECT id, user_id
             FROM password_resets
             WHERE token_hash = ?
             AND used_at IS NULL
             AND expires_at > NOW()
             LIMIT 1
             FOR UPDATE`,
            [tokenHash]
        );

        if (records.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Invalid, expired or already used reset session. Please verify OTP again.'
            });
        }

        const targetUserId = records[0].user_id;
        const passwordResetRecordId = records[0].id;

        // Hash the new password using bcrypt (12 salt rounds)
        const passwordHash = await bcrypt.hash(newPassword, 12);

        // Update user password in MySQL users table
        await connection.execute(
            `UPDATE users SET password_hash = ? WHERE id = ?`,
            [passwordHash, targetUserId]
        );

        // Mark reset authorization token as used (single-use)
        await connection.execute(
            `UPDATE password_resets SET used_at = NOW() WHERE id = ?`,
            [passwordResetRecordId]
        );

        // Invalidate active password_reset OTPs for this user
        await connection.execute(
            `UPDATE otp_verifications SET expires_at = NOW() WHERE user_id = ? AND purpose = 'password_reset'`,
            [targetUserId]
        );

        // Invalidate all existing refresh sessions for security
        await connection.execute(
            `UPDATE sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL`,
            [targetUserId]
        );

        await connection.commit();

        // Dispatch security notification to the user
        try {
            await NotificationService.notify({
                userId: targetUserId,
                title: 'Password Changed Successfully',
                message: 'Your ApnaPay account password was changed. If you did not perform this change, please contact support immediately.',
                category: 'security',
                type: 'warning',
                referenceId: passwordResetRecordId,
                referenceType: 'password_reset'
            });
        } catch (notifErr) {
            console.warn('Password reset notification notice:', notifErr.message);
        }

        return res.status(200).json({
            success: true,
            message: 'Password reset successfully. Please login with your new password.'
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rbErr) {
                console.error('Reset Password Rollback Error:', rbErr.message);
            }
        }

        console.error('Reset Password Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to reset password. Please try again.'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}