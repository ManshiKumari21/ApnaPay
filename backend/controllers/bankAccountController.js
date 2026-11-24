const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const NotificationService = require('../services/notificationService');
const smsService = require('../services/smsService');
const emailService = require('../services/emailService');
const BankVerificationService = require('../services/bankVerificationService');
const {
    SUPPORTED_BANKS,
    findBank,
    validateBankName,
    validateAccountNumber,
    validateIfsc
} = require('../utils/bankValidation');

// Configurable OTP Delivery & Verification parameters
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5;
const OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 30;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5;

// ==========================================
// ENCRYPTION & SECURITY HELPERS
// ==========================================

const getEncryptionKey = () => {
    const secret = process.env.BANK_ENCRYPTION_SECRET || process.env.JWT_SECRET || 'apnapay_bank_secret_key_32_bytes_pad!';
    return crypto.createHash('sha256').update(secret).digest();
};

const encryptAccountNumber = (accountNumber) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(String(accountNumber), 'utf8'), cipher.final()]);
    return Buffer.concat([iv, encrypted]);
};

const decryptAccountNumber = (encryptedBuffer) => {
    try {
        if (!encryptedBuffer || !Buffer.isBuffer(encryptedBuffer) || encryptedBuffer.length < 17) {
            return null;
        }
        const iv = encryptedBuffer.subarray(0, 16);
        const data = encryptedBuffer.subarray(16);
        const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), iv);
        const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
        return decrypted.toString('utf8');
    } catch (_) {
        return null;
    }
};

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NUMBER_REGEX = /^\d{9,18}$/;

// ==========================================
// 1. GET /bank-accounts - List Linked Accounts
// ==========================================
exports.getLinkedAccounts = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const statusFilter = req.query?.status;
        let query = `SELECT id, bank_name, account_last4, ifsc_code, account_holder_name, is_primary, status, created_at
             FROM bank_accounts
             WHERE user_id = ?`;
        const params = [userId];

        if (statusFilter && statusFilter !== 'all') {
            query += ` AND status = ?`;
            params.push(statusFilter);
        } else if (!statusFilter) {
            query += ` AND status IN ('active', 'verified', 'demo_verified')`;
        } else {
            query += ` AND status != 'unlinked'`;
        }

        query += ` ORDER BY is_primary DESC, id DESC`;

        const [rows] = await db.execute(query, params);

        const accounts = rows.map((r) => ({
            id: r.id,
            bankName: r.bank_name,
            accountLast4: r.account_last4,
            maskedAccountNumber: r.account_last4 ? `••••••••${r.account_last4}` : null,
            ifscCode: r.ifsc_code,
            accountHolderName: r.account_holder_name,
            isPrimary: Boolean(r.is_primary),
            status: r.status,
            createdAt: r.created_at
        }));

        return res.status(200).json({
            success: true,
            message: 'Linked bank accounts retrieved successfully.',
            count: accounts.length,
            data: accounts
        });

    } catch (error) {
        console.error('Get Linked Accounts Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve linked bank accounts.'
        });
    }
};

// ==========================================
// 2. POST /bank-accounts/link - Initiate Bank Linking
// ==========================================
exports.initiateLink = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const bankName = String(req.body?.bankName || req.body?.bank_name || '').trim();
        const accountNumber = String(req.body?.accountNumber || req.body?.account_number || '').trim();
        const confirmAccountNumber = req.body?.confirmAccountNumber || req.body?.confirm_account_number;
        const ifscCode = String(req.body?.ifscCode || req.body?.ifsc_code || '').trim().toUpperCase();
        const accountHolderName = req.body?.accountHolderName || req.body?.account_holder_name;
        const isPrimary = req.body?.isPrimary !== undefined ? Boolean(req.body.isPrimary) : false;

        // 1. Bank Name & Support Validation
        if (!bankName) {
            return res.status(400).json({
                success: false,
                message: 'Bank name is required.'
            });
        }

        const bankNameVal = validateBankName(bankName);
        if (!bankNameVal.valid) {
            return res.status(400).json({
                success: false,
                message: bankNameVal.error
            });
        }

        const matchedBank = findBank(bankName);
        const deliveryMethod = String(req.body?.deliveryMethod || 'sms').toLowerCase();

        // 2. Account Number Validation (Bank-Wise Rules)
        const accountValidation = validateAccountNumber(accountNumber, matchedBank);
        if (!accountValidation.valid) {
            return res.status(400).json({
                success: false,
                message: accountValidation.error
            });
        }

        // 3. Confirm Account Number Validation
        if (confirmAccountNumber && String(confirmAccountNumber).trim() !== accountNumber) {
            return res.status(400).json({
                success: false,
                message: 'Account numbers do not match.'
            });
        }

        // 4. IFSC Code Validation (Bank-Specific Prefix & Format)
        const ifscValidation = validateIfsc(ifscCode, matchedBank);
        if (!ifscValidation.valid) {
            return res.status(400).json({
                success: false,
                message: ifscValidation.error
            });
        }

        // Determine account holder name & verify user identity and registered mobile
        const [users] = await db.execute(
            'SELECT id, full_name, email, phone, phone_verified_at FROM users WHERE id = ? LIMIT 1',
            [userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User account not found.'
            });
        }
        const userRecord = users[0];

        let finalHolderName = typeof accountHolderName === 'string' && accountHolderName.trim()
            ? accountHolderName.trim()
            : null;

        if (!finalHolderName) {
            finalHolderName = userRecord.full_name ? userRecord.full_name : 'Account Holder';
        }

        // 5. Verify that user has a registered mobile number in database
        if (!userRecord.phone) {
            return res.status(400).json({
                success: false,
                message: 'No registered mobile number found in your profile. Please add a mobile number in your profile first.'
            });
        }

        // 6. Mobile verification check
        // In DEMO MODE: paid telecom SMS APIs are not purchased, so allow simulated demo verification via registered email.
        // In REAL INTEGRATION MODE (DEMO_MODE=false): strictly enforce genuine telecom SMS verification.
        const isDemo = process.env.DEMO_MODE === 'true' || process.env.BANK_VERIFICATION_PROVIDER === 'demo';

        if (!isDemo && !userRecord.phone_verified_at) {
            return res.status(400).json({
                success: false,
                message: 'Your registered mobile number is not verified. Please verify your mobile number first before linking a bank account.'
            });
        }

        const accountLast4 = accountNumber.slice(-4);

        // Check if identical account is already active or demo_verified
        const [existing] = await db.execute(
            `SELECT id, status FROM bank_accounts
             WHERE user_id = ? AND account_last4 = ? AND ifsc_code = ? AND status IN ('active', 'verified', 'demo_verified')
             LIMIT 1`,
            [userId, accountLast4, ifscCode]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'This bank account is already linked and active for your account.'
            });
        }

        // Cooldown check between OTP requests for the same user
        const [recentOtps] = await db.execute(
            `SELECT id, created_at FROM otp_verifications
             WHERE user_id = ? AND purpose = 'bank_account_link'
             AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
             ORDER BY created_at DESC LIMIT 1`,
            [userId, OTP_RESEND_COOLDOWN_SECONDS]
        );

        if (recentOtps.length > 0) {
            const elapsed = Math.floor((Date.now() - new Date(recentOtps[0].created_at).getTime()) / 1000);
            const remaining = Math.max(1, OTP_RESEND_COOLDOWN_SECONDS - elapsed);
            return res.status(429).json({
                success: false,
                message: `Please wait ${remaining} seconds before requesting a new verification code.`,
                cooldownRemaining: remaining
            });
        }

        // Generate cryptographically secure 6-digit random OTP
        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Invalidate previous unverified OTPs for this user and purpose
        await db.execute(
            `UPDATE otp_verifications
             SET expires_at = NOW()
             WHERE user_id = ? AND purpose = 'bank_account_link' AND verified_at IS NULL`,
            [userId]
        );

        // Save hashed OTP in otp_verifications table (NEVER store plain-text OTP)
        const [otpResult] = await db.execute(
            `INSERT INTO otp_verifications
             (user_id, phone, email, otp_hash, purpose, expires_at, attempts)
             VALUES (?, ?, ?, ?, 'bank_account_link', ?, 0)`,
            [userId, userRecord.phone, userRecord.email, otpHash, expiresAt]
        );
        const otpVerificationId = otpResult.insertId;

        // Masked identifiers for safe display
        const phoneInfo = smsService.maskPhone(userRecord.phone);
        const maskedEmail = emailService.maskEmail(userRecord.email);

        // Smart Delivery Routing:
        // If deliveryMethod is SMS, but SMS provider is not configured, while Email IS configured and user has an email,
        // automatically route to Email so the user receives their verification code within 1-2 seconds without delay!
        let activeDeliveryMethod = deliveryMethod;
        if (activeDeliveryMethod === 'sms' && !smsService.isSmsConfigured() && emailService.isEmailConfigured() && userRecord.email) {
            activeDeliveryMethod = 'email';
        }

        let deliveryMode = activeDeliveryMethod;
        let deliverySuccess = true;
        let deliveryMessage = '';

        if (activeDeliveryMethod === 'email') {
            if (!userRecord.email) {
                return res.status(400).json({
                    success: false,
                    message: 'No registered email address found in your profile to send verification code.'
                });
            }
            try {
                await emailService.sendOtpEmail(userRecord.email, otp, 'bank_account_link');
                deliveryMode = 'email';
                deliverySuccess = true;
                deliveryMessage = `Verification code sent to registered email ${maskedEmail}.`;
            } catch (emailErr) {
                console.error('Email OTP Dispatch Error:', emailErr.message);
                deliveryMode = 'failed';
                deliverySuccess = false;
                deliveryMessage = 'Failed to deliver OTP to registered email. Please try SMS.';
            }
        } else {
            // Default: SMS
            const smsResult = await smsService.sendOtpSms({
                phone: userRecord.phone,
                otp,
                purpose: 'bank_account_link'
            });
            deliveryMode = smsResult.deliveryMode;
            deliverySuccess = smsResult.success;
            deliveryMessage = smsResult.message;
        }

        // Store session metadata in bank_accounts.provider_token (NEVER store plain-text OTP)
        const providerToken = JSON.stringify({
            otpVerificationId,
            deliveryMethod: activeDeliveryMethod,
            registeredPhoneLast4: phoneInfo.last4,
            maskedPhone: phoneInfo.masked,
            maskedEmail,
            resendCount: 0,
            lastSentAt: Date.now()
        });

        const encryptedBuffer = encryptAccountNumber(accountNumber);

        // Check if user has any active bank accounts
        const [activeAccounts] = await db.execute(
            `SELECT id FROM bank_accounts WHERE user_id = ? AND status IN ('active', 'verified', 'demo_verified') LIMIT 1`,
            [userId]
        );
        const willBePrimary = activeAccounts.length === 0 || isPrimary ? 1 : 0;

        // Check if a pending attempt for this same account already exists
        const [existingPending] = await db.execute(
            `SELECT id FROM bank_accounts
             WHERE user_id = ? AND account_last4 = ? AND ifsc_code = ? AND status = 'pending'
             LIMIT 1`,
            [userId, accountLast4, ifscCode]
        );

        let finalBankAccountId;
        const canonicalBankName = matchedBank ? matchedBank.name : bankName;

        if (existingPending.length > 0) {
            finalBankAccountId = existingPending[0].id;
            await db.execute(
                `UPDATE bank_accounts
                 SET bank_name = ?, account_number_encrypted = ?, account_holder_name = ?, provider_token = ?, is_primary = ?
                 WHERE id = ?`,
                [canonicalBankName, encryptedBuffer, finalHolderName, providerToken, willBePrimary, finalBankAccountId]
            );
        } else {
            const [insertResult] = await db.execute(
                `INSERT INTO bank_accounts
                 (user_id, bank_name, account_number_encrypted, account_last4, ifsc_code, account_holder_name, provider_token, is_primary, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [
                    userId,
                    canonicalBankName,
                    encryptedBuffer,
                    accountLast4,
                    ifscCode,
                    finalHolderName,
                    providerToken,
                    willBePrimary
                ]
            );
            finalBankAccountId = insertResult.insertId;
        }

        // Build clean client response - NEVER include devOtp or devNote
        const responseData = {
            bankAccountId: finalBankAccountId,
            bankName: canonicalBankName,
            accountLast4,
            maskedAccountNumber: `••••••••${accountLast4}`,
            ifscCode,
            accountHolderName: finalHolderName,
            registeredMobileLast4: phoneInfo.last4,
            maskedMobile: phoneInfo.masked,
            registeredEmail: userRecord.email,
            maskedEmail,
            deliveryMethod: activeDeliveryMethod,
            status: 'pending',
            isDemoMode: isDemo,
            isDemoMobileVerification: isDemo && !userRecord.phone_verified_at,
            expiresIn: OTP_EXPIRY_MINUTES * 60,
            resendCooldown: OTP_RESEND_COOLDOWN_SECONDS,
            smsDelivery: {
                configured: smsService.isSmsConfigured(),
                deliveryMode,
                message: deliveryMessage
            }
        };

        let userMessage;
        if (deliveryMode === 'email') {
            userMessage = `Verification code sent to your registered email (${maskedEmail}).`;
        } else if (deliveryMode === 'sms') {
            userMessage = `Verification code sent via SMS to your registered mobile ending in ${phoneInfo.last4}.`;
        } else {
            userMessage = `Verification initiated. Enter the 6-digit code for your mobile number ending in ${phoneInfo.last4}.`;
        }

        return res.status(201).json({
            success: true,
            message: userMessage,
            data: responseData
        });

    } catch (error) {
        console.error('Initiate Bank Link Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to initiate bank linking. Please try again.'
        });
    }
};

// ==========================================
// 3. POST /bank-accounts/resend-otp - Resend Verification OTP
// ==========================================
exports.resendOtp = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const bankAccountId = req.params?.id || req.body?.bankAccountId || req.body?.id;
        if (!bankAccountId) {
            return res.status(400).json({
                success: false,
                message: 'Bank account ID is required.'
            });
        }

        // Verify account exists, belongs to user, and is currently pending
        const [accounts] = await db.execute(
            `SELECT * FROM bank_accounts WHERE id = ? AND user_id = ? LIMIT 1`,
            [bankAccountId, userId]
        );

        if (accounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pending bank account linking request not found.'
            });
        }

        const account = accounts[0];
        if (account.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot resend OTP. Bank account is in "${account.status}" status.`
            });
        }

        // Fetch user from DB
        const [users] = await db.execute(
            `SELECT id, email, phone, phone_verified_at FROM users WHERE id = ? LIMIT 1`,
            [userId]
        );

        if (users.length === 0 || !users[0].phone) {
            return res.status(400).json({
                success: false,
                message: 'Registered mobile number not found in profile.'
            });
        }
        const userRecord = users[0];

        // Parse provider token for resend count and previous delivery method
        let sessionData = {};
        try {
            sessionData = JSON.parse(account.provider_token || '{}');
        } catch (_) {}

        const currentResends = Number(sessionData.resendCount || 0);
        if (currentResends >= 5) {
            return res.status(429).json({
                success: false,
                message: 'Maximum resend limit (5) reached for this bank linking session. Please cancel and re-initiate.'
            });
        }

        const deliveryMethod = String(req.body?.deliveryMethod || sessionData.deliveryMethod || 'sms').toLowerCase();
        const isChannelSwitch = Boolean(sessionData.deliveryMethod && deliveryMethod !== sessionData.deliveryMethod);

        // Enforce cooldown only when requesting via the SAME channel
        if (!isChannelSwitch) {
            const [recentOtps] = await db.execute(
                `SELECT id, created_at FROM otp_verifications
                 WHERE user_id = ? AND purpose = 'bank_account_link'
                 AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
                 ORDER BY created_at DESC LIMIT 1`,
                [userId, OTP_RESEND_COOLDOWN_SECONDS]
            );

            if (recentOtps.length > 0) {
                const elapsed = Math.floor((Date.now() - new Date(recentOtps[0].created_at).getTime()) / 1000);
                const remaining = Math.max(1, OTP_RESEND_COOLDOWN_SECONDS - elapsed);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${remaining} seconds before requesting another code.`,
                    cooldownRemaining: remaining
                });
            }
        }

        // Invalidate previous unverified OTPs
        await db.execute(
            `UPDATE otp_verifications
             SET expires_at = NOW()
             WHERE user_id = ? AND purpose = 'bank_account_link' AND verified_at IS NULL`,
            [userId]
        );

        // Generate new secure 6-digit random OTP
        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        const [newOtpResult] = await db.execute(
            `INSERT INTO otp_verifications
             (user_id, phone, email, otp_hash, purpose, expires_at, attempts)
             VALUES (?, ?, ?, ?, 'bank_account_link', ?, 0)`,
            [userId, userRecord.phone, userRecord.email, otpHash, expiresAt]
        );

        // Masked details
        const phoneInfo = smsService.maskPhone(userRecord.phone);
        const maskedEmail = emailService.maskEmail(userRecord.email);

        let deliveryMode = 'sms';
        let deliverySuccess = true;
        let deliveryMessage = '';

        if (deliveryMethod === 'email') {
            if (!userRecord.email) {
                return res.status(400).json({
                    success: false,
                    message: 'No registered email address found in your profile.'
                });
            }
            try {
                await emailService.sendOtpEmail(userRecord.email, otp, 'bank_account_link');
                deliveryMode = 'email';
                deliverySuccess = true;
                deliveryMessage = `Verification code sent to registered email ${maskedEmail}.`;
            } catch (emailErr) {
                console.error('Email OTP Resend Error:', emailErr.message);
                deliveryMode = 'failed';
                deliverySuccess = false;
                deliveryMessage = 'Failed to deliver OTP to registered email. Please try SMS.';
            }
        } else {
            const smsResult = await smsService.sendOtpSms({
                phone: userRecord.phone,
                otp,
                purpose: 'bank_account_link'
            });
            deliveryMode = smsResult.deliveryMode;
            deliverySuccess = smsResult.success;
            deliveryMessage = smsResult.message;
        }

        // Update provider_token
        const updatedProviderToken = JSON.stringify({
            otpVerificationId: newOtpResult.insertId,
            deliveryMethod,
            registeredPhoneLast4: phoneInfo.last4,
            maskedPhone: phoneInfo.masked,
            maskedEmail,
            resendCount: currentResends + 1,
            lastSentAt: Date.now()
        });

        await db.execute(
            `UPDATE bank_accounts SET provider_token = ? WHERE id = ?`,
            [updatedProviderToken, account.id]
        );

        // Response payload - NEVER return devOtp or devNote
        const responsePayload = {
            bankAccountId: account.id,
            registeredMobileLast4: phoneInfo.last4,
            maskedMobile: phoneInfo.masked,
            registeredEmail: userRecord.email,
            maskedEmail,
            deliveryMethod,
            expiresIn: OTP_EXPIRY_MINUTES * 60,
            resendCooldown: OTP_RESEND_COOLDOWN_SECONDS,
            resendCount: currentResends + 1,
            smsDelivery: {
                configured: smsService.isSmsConfigured(),
                deliveryMode,
                message: deliveryMessage
            }
        };

        let userResendMessage;
        if (deliveryMode === 'email') {
            userResendMessage = `A new verification code was sent to your registered email (${maskedEmail}).`;
        } else if (deliveryMode === 'sms') {
            userResendMessage = `A new verification code was sent via SMS to your registered mobile ending in ${phoneInfo.last4}.`;
        } else {
            userResendMessage = `A new verification code was generated for your registered mobile ending in ${phoneInfo.last4}.`;
        }

        return res.status(200).json({
            success: true,
            message: userResendMessage,
            data: responsePayload
        });

    } catch (error) {
        console.error('Resend OTP Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to resend verification code. Please try again.'
        });
    }
};

// ==========================================
// 4. POST /bank-accounts/verify - Verify Bank Account
// ==========================================
exports.verifyAccount = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const bankAccountId = req.body?.bankAccountId || req.body?.bank_account_id || req.body?.id;
        const otp = String(req.body?.otp || req.body?.verificationCode || req.body?.code || '').trim();

        if (!otp || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: 'A valid 6-digit verification code is required.'
            });
        }

        let account = null;

        if (bankAccountId) {
            const [rows] = await db.execute(
                `SELECT * FROM bank_accounts WHERE id = ? AND user_id = ? LIMIT 1`,
                [bankAccountId, userId]
            );
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Bank account linking request not found.'
                });
            }
            account = rows[0];
        } else {
            // Find latest pending bank account for this user
            const [rows] = await db.execute(
                `SELECT * FROM bank_accounts WHERE user_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1`,
                [userId]
            );
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No pending bank account linking request found.'
                });
            }
            account = rows[0];
        }

        if (account.status === 'demo_verified' || account.status === 'active' || account.status === 'verified') {
            return res.status(200).json({
                success: true,
                message: 'Bank account is already verified.',
                data: {
                    id: account.id,
                    bankName: account.bank_name,
                    accountLast4: account.account_last4,
                    maskedAccountNumber: `••••••••${account.account_last4}`,
                    ifscCode: account.ifsc_code,
                    accountHolderName: account.account_holder_name,
                    isPrimary: Boolean(account.is_primary),
                    status: account.status
                }
            });
        }

        // Fetch latest active unverified OTP for this user and purpose
        const [otpRecords] = await db.execute(
            `SELECT id, otp_hash, attempts, expires_at, verified_at
             FROM otp_verifications
             WHERE user_id = ? AND purpose = 'bank_account_link' AND verified_at IS NULL
             ORDER BY id DESC LIMIT 1`,
            [userId]
        );

        if (otpRecords.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No active OTP verification session found. Please request a new code.'
            });
        }

        const otpRecord = otpRecords[0];

        // Expiry check
        if (new Date(otpRecord.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: `The verification code has expired (valid for ${OTP_EXPIRY_MINUTES} minutes). Please click Resend OTP.`
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

        // Secure bcrypt hash verification
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

        // Invalidate OTP to prevent replay/reuse
        await db.execute(
            `UPDATE otp_verifications SET verified_at = NOW() WHERE id = ?`,
            [otpRecord.id]
        );

        // Primary status management
        if (account.is_primary) {
            await db.execute(
                `UPDATE bank_accounts SET is_primary = 0 WHERE user_id = ?`,
                [userId]
            );
        } else {
            const [existingPrimary] = await db.execute(
                `SELECT id FROM bank_accounts WHERE user_id = ? AND is_primary = 1 AND status IN ('active', 'verified', 'demo_verified') LIMIT 1`,
                [userId]
            );
            if (existingPrimary.length === 0) {
                account.is_primary = 1;
            }
        }

        // Determine verification status: in demo mode or without external provider, mark as 'demo_verified'
        const isDemo = process.env.DEMO_MODE === 'true' || process.env.BANK_VERIFICATION_PROVIDER === 'demo' || !BankVerificationService.isConfigured();
        const finalStatus = isDemo ? 'demo_verified' : 'verified';

        // Update status to 'demo_verified' or 'verified'
        await db.execute(
            `UPDATE bank_accounts
             SET status = ?, is_primary = ?, provider_token = NULL
             WHERE id = ?`,
            [finalStatus, account.is_primary ? 1 : 0, account.id]
        );

        // Auto-create a primary UPI ID if user does not have any UPI handles yet
        try {
            const [existingHandles] = await db.execute(
                `SELECT id FROM upi_handles WHERE user_id = ? AND status = 'active' LIMIT 1`,
                [userId]
            );

            if (existingHandles.length === 0) {
                const [users] = await db.execute('SELECT phone, full_name FROM users WHERE id = ? LIMIT 1', [userId]);
                if (users.length > 0) {
                    const phoneClean = users[0].phone ? String(users[0].phone).replace(/[^0-9]/g, '').slice(-10) : null;
                    const defaultUpi = phoneClean
                        ? `${phoneClean}@apnapay`
                        : `${users[0].full_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@apnapay`;

                    const [upiCheck] = await db.execute('SELECT id FROM upi_handles WHERE upi_id = ? LIMIT 1', [defaultUpi]);
                    if (upiCheck.length === 0) {
                        await db.execute(
                            `INSERT INTO upi_handles (user_id, bank_account_id, upi_id, is_primary, status)
                             VALUES (?, ?, ?, 1, 'active')`,
                            [userId, account.id, defaultUpi]
                        );
                    }
                }
            }
        } catch (_) {
            // Non-blocking auto-handle creation
        }

        // Non-blocking notification dispatch
        NotificationService.notify({
            userId,
            title: isDemo ? 'Bank Account Linked (Demo Mode)' : 'Bank Account Verified',
            message: `Your ${account.bank_name} account ending in ••••${account.account_last4} has been verified and successfully linked to your ApnaPay profile.`,
            category: 'bank',
            type: 'success',
            referenceId: account.id,
            referenceType: 'bank_account'
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: isDemo
                ? 'Bank account verified and linked successfully in demo mode!'
                : 'Bank account verified and linked successfully!',
            data: {
                id: account.id,
                bankName: account.bank_name,
                accountLast4: account.account_last4,
                maskedAccountNumber: `••••••••${account.account_last4}`,
                ifscCode: account.ifsc_code,
                accountHolderName: account.account_holder_name,
                isPrimary: Boolean(account.is_primary),
                status: finalStatus
            }
        });

    } catch (error) {
        console.error('Verify Bank Account Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to verify bank account.'
        });
    }
};

// ==========================================
// 4. DELETE /bank-accounts/:id - Unlink Bank Account
// ==========================================
exports.unlinkAccount = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const accountId = req.params?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: 'Bank account ID is required.'
            });
        }

        const [rows] = await db.execute(
            `SELECT id, is_primary, bank_name, account_last4 FROM bank_accounts
             WHERE id = ? AND user_id = ? AND status != 'unlinked'
             LIMIT 1`,
            [accountId, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found or already unlinked.'
            });
        }

        const account = rows[0];

        // Disassociate any UPI handles tied to this bank account
        await db.execute(
            `UPDATE upi_handles SET bank_account_id = NULL WHERE bank_account_id = ? AND user_id = ?`,
            [account.id, userId]
        );

        // Attempt soft-delete by status or full delete if unreferenced
        try {
            await db.execute(
                `DELETE FROM bank_accounts WHERE id = ? AND user_id = ?`,
                [account.id, userId]
            );
        } catch (e) {
            // If foreign key constraint (e.g. referenced in payments), soft delete safely
            await db.execute(
                `UPDATE bank_accounts SET status = 'unlinked', is_primary = 0 WHERE id = ? AND user_id = ?`,
                [account.id, userId]
            );
        }

        // If the unlinked account was primary, assign primary to the next active bank account
        if (account.is_primary) {
            const [nextActive] = await db.execute(
                `SELECT id FROM bank_accounts WHERE user_id = ? AND status IN ('active', 'verified', 'demo_verified') ORDER BY id DESC LIMIT 1`,
                [userId]
            );
            if (nextActive.length > 0) {
                await db.execute(
                    `UPDATE bank_accounts SET is_primary = 1 WHERE id = ?`,
                    [nextActive[0].id]
                );
            }
        }

        // Non-blocking notification dispatch
        NotificationService.notify({
            userId,
            title: 'Bank Account Unlinked',
            message: `Bank account ending in ••••${account.account_last4} (${account.bank_name}) was successfully unlinked.`,
            category: 'bank',
            type: 'info',
            referenceId: account.id,
            referenceType: 'bank_account'
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: `Bank account (${account.bank_name} ••••${account.account_last4}) unlinked successfully.`,
            data: {
                id: Number(accountId),
                status: 'unlinked'
            }
        });

    } catch (error) {
        console.error('Unlink Bank Account Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Unable to unlink bank account.'
        });
    }
};

// ==========================================
// 6. PATCH /bank-accounts/:id/primary - Set Account as Primary
// ==========================================
exports.setPrimaryAccount = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const accountId = req.params?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const [rows] = await db.execute(
            `SELECT id, bank_name, account_last4, status, is_primary FROM bank_accounts
             WHERE id = ? AND user_id = ? AND status IN ('active', 'verified', 'demo_verified')
             LIMIT 1`,
            [accountId, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Active bank account not found.'
            });
        }

        // Set all user accounts is_primary = 0, then set this one to 1
        await db.execute(
            `UPDATE bank_accounts SET is_primary = 0 WHERE user_id = ?`,
            [userId]
        );

        await db.execute(
            `UPDATE bank_accounts SET is_primary = 1 WHERE id = ? AND user_id = ?`,
            [accountId, userId]
        );

        return res.status(200).json({
            success: true,
            message: `${rows[0].bank_name} (••••${rows[0].account_last4}) is now your primary account.`,
            data: {
                id: Number(accountId),
                isPrimary: true
            }
        });
    } catch (error) {
        console.error('Set Primary Bank Account Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to update primary bank account.'
        });
    }
};
