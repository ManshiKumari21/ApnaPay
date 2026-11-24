/**
 * Abstract Base Provider for Bill Payments.
 *
 * Defines the contract that any Bill Payment provider (Demo Provider, BBPS Adapter,
 * NPCI Bharat BillPay API, Setu, BillDesk, etc.) must implement.
 */
class BillPaymentProvider {
  /**
   * Provider identifier (e.g. 'demo', 'bbps', 'setu')
   */
  get providerCode() {
    throw new Error('providerCode getter must be implemented');
  }

  /**
   * Fetch bill details from biller/aggregator
   * @param {Object} params
   * @param {Object} params.biller - Biller record from database
   * @param {string} params.consumerNumber - Customer's identifier (CA, IVRS, Policy No, etc.)
   * @param {Object} [params.user] - Authenticated user record
   * @returns {Promise<Object>} Bill details
   */
  async fetchBill(params) {
    throw new Error('fetchBill method must be implemented');
  }

  /**
   * Validate bill status and amount before payment processing
   * @param {Object} params
   * @param {Object} params.biller
   * @param {string} params.consumerNumber
   * @param {Object} params.billFetch - Stored bill fetch record
   * @param {number} params.amount
   * @returns {Promise<Object>} Validation result
   */
  async validateBill(params) {
    throw new Error('validateBill method must be implemented');
  }

  /**
   * Process payment through provider/gateway
   * @param {Object} params
   * @param {Object} params.payment - Bill payment record
   * @param {Object} params.billFetch - Bill fetch record
   * @param {Object} params.biller - Biller record
   * @param {Object} params.user - User record
   * @param {string} params.paymentMode - Payment mode ('WALLET', 'DEMO', etc.)
   * @returns {Promise<Object>} Payment processing result
   */
  async processPayment(params) {
    throw new Error('processPayment method must be implemented');
  }

  /**
   * Query status of an existing payment with provider
   * @param {Object} params
   * @param {string} params.providerReference - External reference ID
   * @param {Object} params.payment - Bill payment record
   * @returns {Promise<Object>} Status result
   */
  async checkPaymentStatus(params) {
    throw new Error('checkPaymentStatus method must be implemented');
  }
}

module.exports = BillPaymentProvider;

