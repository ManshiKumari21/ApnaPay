const nodemailer = require('nodemailer');

let pooledTransporter = null;

// Create SMTP Transporter instance
const createTransporterInstance = (pool = true) => {
    const isSecure = process.env.EMAIL_SECURE === 'true' || Number(process.env.EMAIL_PORT) === 465;
    const rawPass = process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD || '';
    const cleanPass = rawPass.trim().replace(/\s+/g, '');

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: isSecure,
        pool: pool,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5,
        auth: {
            user: (process.env.EMAIL_USER || '').trim(),
            pass: cleanPass
        },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });
};

// Singleton getter for warm connection pool
const getTransporter = () => {
    if (pooledTransporter) {
        return pooledTransporter;
    }
    pooledTransporter = createTransporterInstance(true);
    return pooledTransporter;
};

// Check email configuration
const checkEmailConfig = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD;
    return Boolean(
        user &&
        pass &&
        pass.trim().length > 0 &&
        !user.includes('your_email@gmail.com') &&
        !pass.includes('your_16_char')
    );
};

// Pre-warm the SMTP connection pool on startup for instant 1-2s OTP dispatch
const warmTransporter = async () => {
    if (!checkEmailConfig()) {
        return false;
    }
    try {
        const transporter = getTransporter();
        await transporter.verify();
        console.log('[EmailService] SMTP connection pre-warmed & ready for instant 1-2s OTP delivery.');
        return true;
    } catch (err) {
        console.warn('[EmailService] SMTP pre-warm warning (will connect on first dispatch):', err.message);
        return false;
    }
};

// Helper to mask email address for privacy and safe UI display (e.g. g****2@gmail.com)
const maskEmail = (email) => {
    if (!email || typeof email !== 'string') return '';
    const parts = email.split('@');
    if (parts.length !== 2) return '******';
    const [name, domain] = parts;
    if (name.length <= 2) {
        return `${name[0] || '*'}***@${domain}`;
    }
    const first = name[0];
    const last = name[name.length - 1];
    const maskedMiddle = '*'.repeat(Math.min(name.length - 2, 4));
    return `${first}${maskedMiddle}${last}@${domain}`;
};

// Send Email OTP (Supports bank account linking, email verification, password reset, and login)
const sendOtpEmail = async (email, otp, purpose = 'email_verification') => {
    const isConfigured = checkEmailConfig();

    // If SMTP is not configured, print OTP to server console so user can copy and test
    if (!isConfigured) {
        console.log(`\n======================================================================`);
        console.log(`[APNAPAY EMAIL OTP DISPATCH]`);
        console.log(`To:       ${email}`);
        console.log(`OTP Code: ${otp}`);
        console.log(`Purpose:  ${purpose}`);
        console.log(`Notice:   EMAIL_PASS is empty in backend/.env.`);
        console.log(`          To receive real emails in your inbox, set your 16-char Gmail App Password in backend/.env:`);
        console.log(`          EMAIL_PASS=your_16_char_google_app_password`);
        console.log(`======================================================================\n`);
        return {
            success: true,
            simulated: true,
            otp
        };
    }

    let emailSubject = `Your ApnaPay verification code is ${otp}`;
    let emailTitle = 'Verify Your Email';
    let emailSubtitle = 'Use the 6-digit verification code below to verify your ApnaPay account:';

    if (purpose === 'password_reset' || purpose === 'forgot_password') {
        emailSubject = `Your ApnaPay password reset code is ${otp}`;
        emailTitle = 'Password Reset Verification';
        emailSubtitle = 'You requested to reset your ApnaPay password. Use the 6-digit OTP below to proceed with resetting your password:';
    } else if (purpose === 'bank_account_link') {
        emailSubject = `Your ApnaPay bank verification code is ${otp}`;
        emailTitle = 'Bank Account Linking Verification';
        emailSubtitle = 'You requested to link a bank account to your ApnaPay profile. Use the 6-digit OTP below to verify your account:';
    } else if (purpose === 'login' || purpose === 'CUSTOMER_LOGIN') {
        emailSubject = `Your ApnaPay login verification code is ${otp}`;
        emailTitle = 'Login Verification';
        emailSubtitle = 'Use the 6-digit OTP below to securely verify and log in to your ApnaPay account:';
    } else if (purpose === 'email_verification' || purpose === 'register' || purpose === 'registration') {
        emailSubject = `Your ApnaPay verification code is ${otp}`;
        emailTitle = 'Verify Your ApnaPay Account';
        emailSubtitle = 'Thank you for signing up with ApnaPay. Use the 6-digit verification code below to complete your registration:';
    }

    const fromAddress = process.env.EMAIL_FROM || `"ApnaPay Verification" <${process.env.EMAIL_USER}>`;

    const mailOptions = {
        from: fromAddress,
        replyTo: process.env.EMAIL_USER,
        to: email,
        subject: emailSubject,
        headers: {
            'X-ApnaPay-Purpose': purpose,
            'X-ApnaPay-Delivery': 'email_otp'
        },
        text: `ApnaPay - ${emailTitle}\n\nHello,\n\n${emailSubtitle}\n\nVerification Code: ${otp}\n\nThis OTP is valid for 5 minutes.\nDo not share this OTP with anyone for security purposes.\n\nIf you did not request this, you can safely ignore this email.\n\nRegards,\nApnaPay Team`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${emailSubject}</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f6fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f6fb; padding: 40px 15px;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);">
                                <tr>
                                    <td style="padding: 28px 32px 20px; text-align: center; background-color: #0d1b2a; border-bottom: 2px solid #00a6ff;">
                                        <div style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #00a6ff; margin-bottom: 4px;">
                                            ApnaPay
                                        </div>
                                        <div style="font-size: 13px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                                            ${emailTitle}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 32px 32px 24px;">
                                        <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.5; color: #334155;">
                                            Hello,
                                        </p>
                                        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                                            ${emailSubtitle}
                                        </p>
                                        <div style="background-color: #f8fafc; border: 2px dashed #0284c7; border-radius: 12px; padding: 22px 16px; text-align: center; margin: 24px 0;">
                                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 8px;">
                                                Verification Code
                                            </div>
                                            <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0284c7; text-indent: 10px;">
                                                ${otp}
                                            </div>
                                        </div>
                                        <p style="margin: 20px 0 8px; font-size: 13px; color: #64748b; line-height: 1.5;">
                                            ⏱ This code is valid for <strong>5 minutes</strong>. Do not share it with anyone.
                                        </p>
                                        <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                                            If you did not request this code, please ignore this email.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 18px 32px 22px; text-align: center; border-top: 1px solid #f1f5f9; background-color: #f8fafc;">
                                        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                                            © ApnaPay Digital Payments • Automated Security Notification
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
    };

    try {
        const transporter = getTransporter();
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] OTP [${otp}] successfully dispatched to ${email} (MessageId: ${info.messageId})`);
        return {
            success: true,
            messageId: info.messageId,
            otp
        };
    } catch (err) {
        console.warn(`[EmailService] Pooled sendMail failed (${err.message}). Retrying with fresh transporter...`);
        pooledTransporter = null;
        try {
            const freshTransporter = createTransporterInstance(false);
            const retryInfo = await freshTransporter.sendMail(mailOptions);
            console.log(`[EmailService] OTP [${otp}] successfully dispatched on retry to ${email} (MessageId: ${retryInfo.messageId})`);
            return {
                success: true,
                messageId: retryInfo.messageId,
                otp
            };
        } catch (retryErr) {
            console.error(`[EmailService] Failed to send OTP email to ${email}:`, retryErr.message);
            // In development or test, fall back to simulated OTP so login/registration does not break
            if (process.env.NODE_ENV !== 'production' || process.env.DEV_EMAIL_BYPASS === 'true') {
                console.log(`\n======================================================================`);
                console.log(`[APNAPAY OTP DISPATCH - FALLBACK TO DEV SIMULATION]`);
                console.log(`To:       ${email}`);
                console.log(`OTP Code: ${otp}`);
                console.log(`Notice: SMTP delivery failed (${retryErr.message}). OTP is valid for login.`);
                console.log(`======================================================================\n`);
                return {
                    success: true,
                    simulated: true,
                    otp,
                    error: retryErr.message
                };
            }
            throw retryErr;
        }
    }
};

module.exports = {
    sendOtpEmail,
    maskEmail,
    checkEmailConfig,
    isEmailConfigured: checkEmailConfig,
    warmTransporter
};
