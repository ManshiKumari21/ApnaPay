const crypto = require('crypto');
const BillPaymentProvider = require('./BillPaymentProvider');

class DemoBillPaymentProvider extends BillPaymentProvider {
  get providerCode() {
    return 'demo';
  }

  get providerName() {
    return 'ApnaPay Demo Simulation Provider';
  }

  /**
   * Helper: Generate a deterministic numeric hash from a string
   */
  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Helper: Get base bill amount based on category key
   */
  _calculateBillAmount(categoryKey, consumerNumber) {
    const hash = this._hashString(consumerNumber);
    const key = (categoryKey || '').toLowerCase();

    switch (key) {
      case 'electricity':
        return 750 + (hash % 1700); // 750 - 2450
      case 'water':
        return 180 + (hash % 470); // 180 - 650
      case 'gas':
        return 850 + (hash % 300); // 850 - 1150
      case 'dth':
        return 299 + (hash % 351); // 299 - 650
      case 'broadband':
        return 499 + (hash % 1000); // 499 - 1499
      case 'landline':
        return 299 + (hash % 500); // 299 - 799
      case 'fastag':
        return 500 + ((hash % 15) + 1) * 100; // 500 - 2000
      case 'insurance':
        return 1500 + (hash % 3300); // 1500 - 4800
      case 'loan-repayment':
        return 2500 + (hash % 6000); // 2500 - 8500
      case 'municipal-taxes':
        return 1200 + (hash % 3300); // 1200 - 4500
      default:
        return 500 + (hash % 1000);
    }
  }

  /**
   * Helper: Realistic customer name generation
   */
  _generateCustomerName(user, consumerNumber) {
    if (user?.full_name && !consumerNumber.includes('TEST')) {
      return user.full_name;
    }

    const demoNames = [
      'Rajesh Kumar Sharma',
      'Pooja Ramesh Patel',
      'Amit Vikram Verma',
      'Gopal Parmar',
      'Sunil Suresh Mehta',
      'Deepak Anand Joshi',
      'Neha Pradeep Gupta',
      'Sanjay Ramchandra Rao',
      'Anjali Mohan Kulkarni',
      'Vikramaditya Singh'
    ];

    const idx = this._hashString(consumerNumber) % demoNames.length;
    return demoNames[idx];
  }

  /**
   * Fetch Bill
   */
  async fetchBill({ biller, consumerNumber, user }) {
    const cleanConsumer = String(consumerNumber).trim();
    const cleanUpper = cleanConsumer.toUpperCase();

    // Check test scenarios:
    // 1. Already paid scenario (ends with 0000 or contains PAID)
    if (cleanUpper.endsWith('0000') || cleanUpper.includes('PAID')) {
      const now = new Date();
      return {
        customerName: this._generateCustomerName(user, cleanConsumer),
        consumerNumber: cleanConsumer,
        billNumber: `BILL-${now.getFullYear()}-${cleanConsumer.slice(-4) || '1001'}`,
        billDate: new Date(Date.now() - 25 * 86400000).toISOString().slice(0, 10),
        dueDate: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
        billAmount: 0.00,
        billPeriod: 'Current Billing Cycle',
        billStatus: 'paid',
        description: 'No outstanding dues. Your bill for the current period has already been paid in full.',
        metadata: {
          isDemo: true,
          provider: this.providerCode,
          scenario: 'already_paid'
        }
      };
    }

    // 2. Overdue scenario (ends with 9999 or contains OVERDUE)
    const isOverdue = cleanUpper.endsWith('9999') || cleanUpper.includes('OVERDUE');
    const baseAmount = this._calculateBillAmount(biller.category_key || biller.categoryKey, cleanConsumer);
    const finalAmount = isOverdue ? baseAmount + 120 : baseAmount;

    const today = new Date();
    const billDate = new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10);
    const dueDate = isOverdue
      ? new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10)
      : new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10);

    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const currentMonth = monthNames[today.getMonth()];
    const prevMonth = monthNames[(today.getMonth() + 11) % 12];
    const billPeriod = `${prevMonth} ${today.getFullYear()} - ${currentMonth} ${today.getFullYear()}`;

    const billNumber = `BL${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${cleanConsumer.slice(-4) || '7890'}`;

    return {
      customerName: this._generateCustomerName(user, cleanConsumer),
      consumerNumber: cleanConsumer,
      billNumber,
      billDate,
      dueDate,
      billAmount: parseFloat(finalAmount.toFixed(2)),
      billPeriod,
      billStatus: isOverdue ? 'overdue' : 'unpaid',
      description: isOverdue
        ? `Overdue Bill: Includes ₹120.00 late payment surcharge. Please clear immediately.`
        : `Regular utility invoice for ${biller.biller_name || biller.billerName}.`,
      metadata: {
        isDemo: true,
        provider: this.providerCode,
        isOverdue,
        lateFee: isOverdue ? 120 : 0,
        billerCode: biller.biller_code || biller.billerCode
      }
    };
  }

  /**
   * Validate Bill before payment
   */
  async validateBill({ biller, consumerNumber, billFetch, amount }) {
    if (!billFetch) {
      return {
        valid: false,
        error: 'Bill fetch record not found or reference is invalid.'
      };
    }

    if (billFetch.is_paid || billFetch.bill_status === 'paid') {
      return {
        valid: false,
        error: 'This bill has already been paid and cannot be paid again.'
      };
    }

    if (new Date(billFetch.expires_at) < new Date()) {
      return {
        valid: false,
        error: 'The bill-fetch session has expired. Please fetch fresh bill details before paying.'
      };
    }

    const fetchedAmount = parseFloat(billFetch.bill_amount);
    const paymentAmount = parseFloat(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return {
        valid: false,
        error: 'A valid positive payment amount is required.'
      };
    }

    // Amount match check
    if (Math.abs(fetchedAmount - paymentAmount) > 0.01) {
      return {
        valid: false,
        error: `Payment amount (₹${paymentAmount.toFixed(2)}) does not match the fetched bill amount (₹${fetchedAmount.toFixed(2)}).`
      };
    }

    return {
      valid: true,
      amount: fetchedAmount,
      billNumber: billFetch.bill_number,
      customerName: billFetch.customer_name,
      dueDate: billFetch.due_date,
      billStatus: billFetch.bill_status
    };
  }

  /**
   * Process Payment
   */
  async processPayment({ payment, billFetch, biller, user, paymentMode }) {
    const consumer = String(billFetch.consumer_number || '').toUpperCase();

    // Simulation hooks for deterministic testing:
    // 1. Simulate failure if consumer number contains 'FAIL'
    if (consumer.includes('FAIL')) {
      return {
        success: false,
        status: 'FAILED',
        failureReason: 'Biller system rejected the payment: Demo payment simulated failure.',
        providerReference: `DEMO_BBPS_FAIL_${Date.now()}`
      };
    }

    // 2. Simulate pending if consumer number contains 'PENDING'
    if (consumer.includes('PENDING')) {
      return {
        success: true,
        status: 'PENDING',
        failureReason: null,
        providerReference: `DEMO_BBPS_PEND_${Date.now()}`
      };
    }

    // 3. Default: Successful payment
    const providerReference = `DEMO_BBPS_TXN_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    return {
      success: true,
      status: 'SUCCESS',
      failureReason: null,
      providerReference,
      approvalCode: `APRV${Math.floor(100000 + Math.random() * 900000)}`,
      paymentTimestamp: new Date().toISOString()
    };
  }

  /**
   * Check Payment Status
   */
  async checkPaymentStatus({ providerReference, payment }) {
    if (providerReference && providerReference.includes('FAIL')) {
      return {
        status: 'FAILED',
        failureReason: 'Biller system failed to reconcile this transaction.'
      };
    }

    if (providerReference && providerReference.includes('PENDING')) {
      // If payment is older than 5 minutes, can mark resolved/success in demo
      const ageMs = Date.now() - new Date(payment.created_at).getTime();
      if (ageMs > 5 * 60 * 1000) {
        return {
          status: 'SUCCESS',
          resolvedAt: new Date().toISOString()
        };
      }
      return {
        status: 'PENDING',
        message: 'Transaction is pending with the demo utility operator.'
      };
    }

    return {
      status: payment.status || 'SUCCESS',
      providerReference: providerReference || payment.provider_reference
    };
  }
}

module.exports = DemoBillPaymentProvider;

