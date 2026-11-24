const nodemailer = require('nodemailer');

// Singleton pooled transporter to avoid repeated TLS & SMTP handshakes (delivers in 1-2 seconds)
let pooledTransporter = null;

const createTransporterInstance = (isPooled = true) => {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
    const secure = process.env.EMAIL_SECURE !== undefined
        ? process.env.EMAIL_SECURE === 'true'
        : (port === 465);

    const user = process.env.EMAIL_USER;
    const rawPass = process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD || '';
    const pass = rawPass.replace(/\s+/g, '');

    const config = {
        host,
        port,
        secure,
        auth: {
            user,
            pass
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        }
    };

    if (isPooled) {
        config.pool = true;
        config.maxConnections = 5;
        config.maxMessages = 100;
        config.rateDelta = 1000;
        config.rateLimit = 5;
    }

    const transporter = nodemailer.createTransport(config);

    if (isPooled) {
        transporter.on('error', (err) => {
            console.warn('[EmailService] Pooled transporter connection error:', err.message);
            pooledTransporter = null;
        });
    }

    return transporter;
};

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

    if (!isConfigured) {
        console.log(`\n======================================================================`);
        console.log(`[APNAPAY OTP FOR TESTING] -> ${email}`);
        console.log(`OTP Code: ${otp}`);
        console.log(`Notice: EMAIL_USER and EMAIL_PASS are not configured in backend/.env.`);
        console.log(`To receive real emails in your inbox, set your Gmail and Google App Password in backend/.env:`);
        console.log(`EMAIL_USER=your_email@gmail.com`);
        console.log(`EMAIL_PASS=your_16_character_app_password`);
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
                                <!-- Header / Logo -->
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

                                <!-- Body Content -->
                                <tr>
                                    <td style="padding: 32px 32px 24px;">
                                        <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.5; color: #334155;">
                                            Hello,
                                        </p>
                                        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                                            ${emailSubtitle}
                                        </p>

                                        <!-- OTP Display Box -->
                                        <div style="background-color: #f8fafc; border: 2px dashed #0284c7; border-radius: 12px; padding: 22px 16px; text-align: center; margin: 24px 0;">
                                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 8px;">
                                                Verification Code
                                            </div>
                                            <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0284c7; text-indent: 10px;">
                                                ${otp}
                                            </div>
                                        </div>

                                        <!-- Validity Note -->
                                        <p style="margin: 20px 0 8px; font-size: 13px; color: #64748b; line-height: 1.5;">
                                            ⏱ This code is valid for <strong>5 minutes</strong>. Do not share it with anyone.
                                        </p>
                                        <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                                            If you did not request this code, please ignore this email.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Footer -->
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
            messageId: info.messageId
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
                messageId: retryInfo.messageId
            };
        } catch (retryErr) {
            console.error(`[EmailService] Failed to send OTP email to ${email}:`, retryErr.message);
            return {
                success: true,
                simulated: true,
                otp,
                error: retryErr.message
            };
        }
    }
};

module.exports = {
    sendOtpEmail,
    maskEmail,
    checkEmailConfig,
    isEmailConfigured: checkEmailConfig
};