const billFetchService = require('./billFetchService');
const billerService = require('./billerService');
const DemoBillPaymentProvider = require('./DemoBillPaymentProvider');

class BillValidationService {
  constructor() {
    this.provider = new DemoBillPaymentProvider();
  }

  /**
   * Validate bill details before payment
   */
  async validateBillForPayment({ userId, billerId, consumerNumber, fetchReferenceId, amount }) {
    if (!userId) {
      throw { status: 401, message: 'Authentication required.' };
    }

    if (!fetchReferenceId) {
      throw { status: 400, message: 'fetchReferenceId is required.' };
    }

    if (!billerId) {
      throw { status: 400, message: 'billerId is required.' };
    }

    if (!consumerNumber) {
      throw { status: 400, message: 'consumerNumber is required.' };
    }

    // 1. Fetch the stored bill record verifying that it belongs to the authenticated user
    const billFetch = await billFetchService.getFetchByReference(fetchReferenceId, userId);
    if (!billFetch) {
      throw {
        status: 404,
        message: 'Bill fetch reference not found or does not belong to your account.'
      };
    }

    // 2. Verify selected biller matches server record
    if (Number(billFetch.biller_id) !== Number(billerId)) {
      throw {
        status: 400,
        message: 'Biller ID mismatch with the fetched bill record.'
      };
    }

    // 3. Verify consumer number matches server record
    const cleanInputConsumer = String(consumerNumber).trim().toLowerCase();
    const cleanRecordConsumer = String(billFetch.consumer_number).trim().toLowerCase();
    if (cleanInputConsumer !== cleanRecordConsumer) {
      throw {
        status: 400,
        message: 'Consumer number mismatch with the fetched bill record.'
      };
    }

    // 4. Verify bill status
    if (billFetch.is_paid || billFetch.bill_status === 'paid') {
      throw {
        status: 400,
        message: 'This bill has already been paid and cannot be paid again.'
      };
    }

    // 5. Check if bill-fetch session has expired
    if (new Date(billFetch.expires_at) < new Date()) {
      throw {
        status: 400,
        message: 'The bill-fetch reference has expired. Please fetch fresh bill details before making payment.'
      };
    }

    // 6. Verify amount
    const parsedAmount = parseFloat(amount);
    const expectedAmount = parseFloat(billFetch.bill_amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw {
        status: 400,
        message: 'A valid payment amount is required.'
      };
    }

    if (Math.abs(parsedAmount - expectedAmount) > 0.01) {
      throw {
        status: 400,
        message: `Submitted amount (₹${parsedAmount.toFixed(2)}) does not match the server-verified bill amount (₹${expectedAmount.toFixed(2)}).`
      };
    }

    // 7. Verify biller status
    const biller = await billerService.getBillerById(billerId);
    if (!biller || biller.status !== 'active') {
      throw {
        status: 400,
        message: 'The selected biller is currently inactive or unavailable.'
      };
    }

    return {
      valid: true,
      fetchReferenceId: billFetch.fetch_reference,
      biller: {
        id: biller.id,
        billerName: biller.billerName,
        billerCode: biller.billerCode,
        categoryName: biller.categoryName
      },
      consumerNumber: billFetch.consumer_number,
      customerName: billFetch.customer_name,
      billNumber: billFetch.bill_number,
      dueDate: billFetch.due_date,
      verifiedAmount: expectedAmount,
      formattedAmount: `₹${expectedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      billStatus: billFetch.bill_status,
      expiresAt: billFetch.expires_at,
      paymentReady: true
    };
  }
}

module.exports = new BillValidationService();

