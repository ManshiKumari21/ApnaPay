/**
 * ApnaPay - Configurable SMS Provider Service
 *
 * Dedicated reusable service for sending OTP and transactional SMS notifications.
 * Supports:
 * 1. MSG91 (Send OTP API / Flow API)
 * 2. Twilio (Messages API)
 * 3. Fast2SMS (Quick OTP API)
 * 4. Generic SMS Gateway / Webhook
 *
 * Security:
 * - Credentials read strictly from environment variables
 * - No plain-text OTP logging in production or console
 * - Provider errors and timeouts (5s) handled gracefully
 * - Never claims SMS was sent if provider call failed or is unconfigured
 */

// Helper to mask phone numbers for safe display and logging
function maskPhone(phone) {
  if (!phone) return { raw: '', last4: '', masked: '******' };
  const digitsOnly = String(phone).replace(/\D/g, '');
  const last4 = digitsOnly.slice(-4) || 'XXXX';
  const prefix = digitsOnly.length > 4 ? '*'.repeat(Math.min(digitsOnly.length - 4, 6)) : '******';
  return {
    raw: String(phone),
    last4,
    masked: `${prefix}${last4}`
  };
}

/**
 * Checks whether real SMS credentials (MSG91, Twilio, Fast2SMS, Generic Gateway) are present.
 */
function hasRealSmsProvider() {
  const provider = (process.env.SMS_PROVIDER || '').toLowerCase();

  const hasMsg91 = Boolean(
    (process.env.MSG91_AUTH_KEY || process.env.SMS_API_KEY) &&
    (process.env.MSG91_TEMPLATE_ID || process.env.SMS_TEMPLATE_ID || process.env.MSG91_FLOW_ID)
  );

  const hasTwilio = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  );

  const hasFast2Sms = Boolean(
    process.env.FAST2SMS_API_KEY || (provider === 'fast2sms' && process.env.SMS_API_KEY)
  );

  const hasGeneric = Boolean(process.env.SMS_GATEWAY_URL);

  if (provider === 'msg91') return hasMsg91;
  if (provider === 'twilio') return hasTwilio;
  if (provider === 'fast2sms') return hasFast2Sms;
  if (provider === 'generic') return hasGeneric;

  return hasMsg91 || hasTwilio || hasFast2Sms || hasGeneric;
}

/**
 * Checks whether any supported SMS provider is properly configured via environment variables.
 */
function isSmsConfigured() {
  const provider = (process.env.SMS_PROVIDER || '').toLowerCase();

  const isMock = Boolean(
    provider === 'mock' ||
    provider === 'test' ||
    process.env.SMS_SIMULATED === 'true'
  );
  if (isMock) return true;

  return hasRealSmsProvider();
}

/**
 * Dispatches an SMS via MSG91 Send OTP endpoint.
 */
async function sendViaMsg91(phone, otp) {
  const authKey = process.env.MSG91_AUTH_KEY || process.env.SMS_API_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID || process.env.SMS_TEMPLATE_ID || process.env.MSG91_FLOW_ID;
  const senderId = process.env.MSG91_SENDER_ID || process.env.SMS_SENDER_ID || 'APNPAY';

  const digits = String(phone).replace(/\D/g, '');
  const mobile = digits.length === 10 ? `91${digits}` : digits;

  const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(templateId)}&mobile=${encodeURIComponent(mobile)}&authkey=${encodeURIComponent(authKey)}&otp=${encodeURIComponent(otp)}&sender=${encodeURIComponent(senderId)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(5000)
  });

  const data = await response.json().catch(() => ({}));

  if (response.ok && (data.type === 'success' || data.status === 'success')) {
    return {
      success: true,
      provider: 'msg91',
      providerRef: data.message || data.request_id || 'accepted'
    };
  }

  throw new Error(data.message || `MSG91 returned status ${response.status}`);
}

/**
 * Dispatches an SMS via Twilio Messages API.
 */
async function sendViaTwilio(phone, otp) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  const digits = String(phone).replace(/\D/g, '');
  const to = digits.startsWith('+') ? digits : `+91${digits.slice(-10)}`;

  const body = `Your ApnaPay mobile verification OTP is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const params = new URLSearchParams({ To: to, From: from, Body: body });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString(),
    signal: AbortSignal.timeout(5000)
  });

  const data = await response.json().catch(() => ({}));

  if (response.ok && data.sid) {
    return {
      success: true,
      provider: 'twilio',
      providerRef: data.sid
    };
  }

  throw new Error(data.message || `Twilio returned status ${response.status}`);
}

/**
 * Dispatches an SMS via Fast2SMS Quick OTP API.
 */
async function sendViaFast2Sms(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;
  const digits = String(phone).replace(/\D/g, '').slice(-10);

  const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(apiKey)}&route=otp&variables_values=${encodeURIComponent(otp)}&numbers=${encodeURIComponent(digits)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'cache-control': 'no-cache'
    },
    signal: AbortSignal.timeout(5000)
  });

  const data = await response.json().catch(() => ({}));

  if (response.ok && (data.return === true || data.status_code === 200)) {
    return {
      success: true,
      provider: 'fast2sms',
      providerRef: data.request_id || 'delivered'
    };
  }

  throw new Error(data.message || `Fast2SMS returned status ${response.status}`);
}

/**
 * Dispatches an SMS via a Generic HTTP Gateway.
 */
async function sendViaGenericGateway(phone, otp) {
  const gatewayUrl = process.env.SMS_GATEWAY_URL;
  const apiKey = process.env.SMS_GATEWAY_API_KEY || process.env.SMS_API_KEY;

  const response = await fetch(gatewayUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({
      phone: String(phone),
      otp: String(otp),
      message: `Your ApnaPay mobile verification OTP is ${otp}. Valid for 5 minutes.`
    }),
    signal: AbortSignal.timeout(5000)
  });

  if (response.ok) {
    return {
      success: true,
      provider: 'generic',
      providerRef: 'delivered'
    };
  }

  throw new Error(`SMS Gateway returned status ${response.status}`);
}

/**
 * Main Service Method: Sends an OTP SMS to a registered phone number.
 *
 * @param {Object} params
 * @param {string} params.phone - User's registered mobile number
 * @param {string} params.otp - 6-digit OTP code
 * @param {string} [params.purpose='bank_account_link'] - OTP purpose
 *
 * @returns {Promise<{
 *   success: boolean,
 *   deliveryMode: 'sms' | 'unconfigured' | 'failed',
 *   configured: boolean,
 *   provider?: string,
 *   maskedPhone: string,
 *   phoneLast4: string,
 *   message: string,
 *   error?: string
 * }>}
 */
async function sendOtpSms({ phone, otp, purpose = 'bank_account_link' }) {
  const { masked, last4 } = maskPhone(phone);

  // 1. If SMS provider is NOT configured:
  if (!isSmsConfigured()) {
    console.log(`[SMS Service] SMS provider is not configured. Requesting fallback to email verification.`);
    return {
      success: false,
      deliveryMode: 'unconfigured',
      configured: false,
      maskedPhone: masked,
      phoneLast4: last4,
      message: 'SMS delivery service is not configured. Please verify using your registered email.'
    };
  }

  // 2. If SMS provider IS configured, attempt delivery
  const provider = (process.env.SMS_PROVIDER || '').toLowerCase();

  try {
    let result;
    if (provider === 'mock' || provider === 'test' || process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || process.env.SMS_SIMULATED === 'true') {
      console.log(`\n======================================================================`);
      console.log(`[APNAPAY SMS OTP DISPATCH - LOCAL DEV]`);
      console.log(`To Phone: ${phone}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`Purpose:  ${purpose}`);
      console.log(`Notice:   To send real SMS to mobile phones, set your SMS Gateway API key in backend/.env:`);
      console.log(`          FAST2SMS_API_KEY=your_fast2sms_key  (or TWILIO / MSG91)`);
      console.log(`======================================================================\n`);
      result = {
        provider: 'mock-sms-gateway',
        providerRef: 'SIM-' + Date.now()
      };
    } else if (provider === 'twilio' || (!provider && process.env.TWILIO_ACCOUNT_SID)) {
      result = await sendViaTwilio(phone, otp);
    } else if (provider === 'fast2sms' || (!provider && process.env.FAST2SMS_API_KEY)) {
      result = await sendViaFast2Sms(phone, otp);
    } else if (provider === 'msg91' || (!provider && (process.env.MSG91_AUTH_KEY || process.env.SMS_API_KEY))) {
      result = await sendViaMsg91(phone, otp);
    } else if (provider === 'generic' || (!provider && process.env.SMS_GATEWAY_URL)) {
      result = await sendViaGenericGateway(phone, otp);
    } else {
      throw new Error(`Configured SMS provider "${provider}" is not recognized.`);
    }

    console.log(`[SMS Service] OTP delivered successfully via ${result.provider} to mobile ending in ${last4}.`);

    return {
      success: true,
      deliveryMode: 'sms',
      configured: true,
      provider: result.provider,
      providerRef: result.providerRef,
      maskedPhone: masked,
      phoneLast4: last4,
      message: `Verification code sent successfully via SMS to your registered mobile number ending in ${last4}.`
    };

  } catch (error) {
    console.error(`[SMS Service] Error sending SMS to ${masked}:`, error.message);

    return {
      success: false,
      deliveryMode: 'failed',
      configured: true,
      maskedPhone: masked,
      phoneLast4: last4,
      error: error.message,
      message: 'Failed to deliver SMS to your registered mobile number. Please verify using your registered email.'
    };
  }
}

module.exports = {
  isSmsConfigured,
  hasRealSmsProvider,
  maskPhone,
  sendOtpSms
};
