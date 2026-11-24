const billCategoryService = require('../services/billPayment/billCategoryService');
const billerService = require('../services/billPayment/billerService');
const billFetchService = require('../services/billPayment/billFetchService');
const billValidationService = require('../services/billPayment/billValidationService');
const billPaymentService = require('../services/billPayment/billPaymentService');
const billFavoriteService = require('../services/billPayment/billFavoriteService');

class BillPaymentController {
  /**
   * API 1: GET /api/bills/categories
   * Retrieve all active bill payment categories from MySQL
   */
  async getCategories(req, res) {
    try {
      const categories = await billCategoryService.getActiveCategories();
      return res.status(200).json({
        success: true,
        message: 'Bill payment categories retrieved successfully.',
        count: categories.length,
        data: categories
      });
    } catch (err) {
      console.error('getCategories Error:', err);
      const status = err.status || 500;
      return res.status(status).json({
        success: false,
        message: err.message || 'Failed to retrieve bill payment categories.',
        data: null
      });
    }
  }

  /**
   * API 2: GET /api/bills/billers?category=electricity
   * Retrieve available billers for selected category
   */
  async getBillers(req, res) {
    try {
      const { category, categoryId, page, limit, search } = req.query;

      const result = await billerService.getBillersByCategory({
        category,
        categoryId,
        page,
        limit,
        search
      });

      return res.status(200).json({
        success: true,
        message: `Active billers retrieved for ${result.category.name}.`,
        category: result.category,
        data: result.billers,
        pagination: result.pagination
      });
    } catch (err) {
      console.error('getBillers Error:', err);
      const status = err.status || 500;
      return res.status(status).json({
        success: false,
        message: err.message || 'Failed to retrieve billers for category.',
        data: null
      });
    }
  }

  /**
   * API 3: POST /api/bills/fetch
   * Fetch bill details using billerId and consumerNumber
   */
  async fetchBill(req, res) {
    try {
      const userId = req.user?.userId;
      const { billerId, consumerNumber } = req.body;

      if (!billerId) {
        return res.status(400).json({
          success: false,
          message: 'billerId is required in request body.',
          data: null
        });
      }

      if (!consumerNumber || !String(consumerNumber).trim()) {
        return res.status(400).json({
          success: false,
          message: 'consumerNumber is required in request body.',
          data: null
        });
      }

      const result = await billFetchService.fetchBill({
        userId,
        billerId,
        consumerNumber
      });

      const message = result.billStatus === 'paid'
        ? 'Bill details fetched: Current bill has already been paid.'
        : 'Bill details fetched successfully from biller.';

      return res.status(200).json({
        success: true,
        message,
        data: result
      });
    } catch (err) {
      console.error('fetchBill Error:', err);
      const status = err.status || 500;
      return res.status(status).json({
        success: false,
        message: err.message || 'Failed to fetch bill details.',
        data: null
      });
    }
  }

  /**
   * API 4: POST /api/bills/validate
   * Validate bill details before payment
   */
  async validateBill(req, res) {
    try {
      const userId = req.user?.userId;
      const { billerId, consumerNumber, fetchReferenceId, amount } = req.body;

      if (!fetchReferenceId) {
        return res.status(400).json({
          success: false,
          message: 'fetchReferenceId is required in request body.',
          data: null
        });
      }

      if (!billerId) {
        return res.status(400).json({
          success: false,
          message: 'billerId is required in request body.',
          data: null
        });
      }

      if (!consumerNumber) {
        return res.status(400).json({
          success: false,
          message: 'consumerNumber is required in request body.',
          data: null
        });
      }

      if (amount === undefined || amount === null) {
        return res.status(400).json({
          success: false,
          message: 'amount is required in request body.',
          data: null
        });
      }

      const result = await billValidationService.validateBillForPayment({
        userId,
        billerId,
        consumerNumber,
        fetchReferenceId,
        amount
      });

      return res.status(200).json({
        success: true,
        message: 'Bill verified and ready for payment.',
        data: result
      });
    } catch (err) {
      console.error('validateBill Error:', err);
      const status = err.status || 500;
      return res.status(status).json({
        success: false,
        message: err.message || 'Bill validation failed.',
        data: null
      });
    }
  }

  /**
   * API 5: POST /api/bills/payments
   * Create and process a bill payment request
   */
  async createPayment(req, res) {
    try {
      const userId = req.user?.userId;
      const {
        billerId,
        consumerNumber,
        fetchReferenceId,
        amount,
        paymentMode = 'DEMO',
        idempotencyKey
      } = req.body;

      if (!fetchReferenceId) {
        return res.status(400).json({
          success: false,
          message: 'fetchReferenceId is required.',
          data: null
        });
      }

      if (!billerId) {
        return res.status(400).json({
          success: false,
          message: 'billerId is required.',
          data: null
        });
      }

      if (!consumerNumber) {
        return res.status(400).json({
          success: false,
          message: 'consumerNumber is required.',
          data: null
        });
      }

      const result = await billPaymentService.processBillPayment({
        userId,
        billerId,
        consumerNumber,
        fetchReferenceId,
        amount,
        paymentMode,
        idempotencyKey
      });

      if (result.idempotentReplay) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result
        });
      }

      const statusCode = result.status === 'SUCCESS' ? 201 : 200;
      const message = result.status === 'SUCCESS'
        ? 'Bill payment processed successfully (Demo Mode).'
        : result.status === 'PENDING'
          ? 'Bill payment initiated and currently pending with operator.'
          : 'Bill payment was rejected by the operator.';

      return res.status(statusCode).json({
        success: result.status !== 'FAILED',
        message,
        data: result
      });
    } catch (err) {
      console.error('createPayment Error:', err);
      const status = err.status || 500;
      return res.status(status).json({
        success: false,
        message: err.message || 'Failed to process bill payment.',
        data: null
      });
    }
  }

  /**
   * API 6: GET /api/bills/payments/:id
   * Retrieve status and details of a specific bill payment
   */
  async getPaymentById(req, res) {
    try {
      const userId = req.user?.userId;
      const paymentIdOrRef = req.params.id;

      const result = await billPaymentService.getPaymentById(paymentIdOrRef, userId);

      return res.status(200).json({
        success: true,
        message: 'Bill payment details retrieved successfully.',
        data: result
      });
    } catch (err) {
      console.error('getPaymentById Error:', err);
      const status = err.status || 500;
      return res.status(status).json({
        success: false,
        message: err.message || 'Failed to retrieve bill payment details.',
        data: null
      });
    }
  }

  /**
   * API 7: GET /api/bills/history
   * Retrieve authenticated user's previous bill payments
   */
  async getHistory(req, res) {
    try {
      const userId = req.user?.userId;
      const { category, billerId, status, startDate, endDate, search, page, limit } = req.query;

      const result = await billPaymentService.getPaymentHistory({
        userId,
        category,
        billerId,
        status,
        startDate,
        endDate,
        search,
        page,
        limit
      });

      return res.status(200).json({
        success: true,
        message: 'Bill payment history retrieved successfully.',
        count: result.records.length,
        data: result.records,
        pagination: result.pagination
      });
    } catch (err) {
      console.error('getHistory Error:', err);
      const status = err.status || 500;
      return res.status(status).json({
        success: false,
        message: err.message || 'Failed to retrieve bill payment history.',
        data: null
      });
    }
  }

  /**
   * API 8: POST /api/bills/favorites
   * Save a biller and consumer number for future payments
   */
  async addFavorite(req, res) {
    try {
      const userId = req.user?.userId;
      const { billerId, consumerNumber, nickname } = req.body;

      if (!billerId) {
        return res.status(400).json({
          success: false,
          message: 'billerId is required.',
          data: null
        });
      }

      if (!consumerNumber || !String(consumerNumber).trim()) {
        return res.status(400).json({
          success: false,
          message: 'consumerNumber is required.',
          data: null
        });
      }

      const result = await billFavoriteService.addFavorite({
        userId,
        billerId,
        consumerNumber,
        nickname
      });

      return res.status(201).json({
        success: true,
        message: 'Biller saved to favorites successfully.',
        data: result
      });
    } catch (err) {
      console.error('addFavorite Error:', err);
      const status = err.status || 500;
      return res.status(status).json({
        success: false,
        message: err.message || 'Failed to save biller to favorites.',
        data: null
      });
    }
  }

  /**
   * API 9: GET /api/bills/favorites
   * Retrieve saved billers and consumer numbers
   */
  async getFavorites(req, res) {
    try {
      const userId = req.user?.userId;
      const { page, limit } = req.query;

      const result = await billFavoriteService.getFavorites({
        userId,
        page,
        limit
      });

      return res.status(200).json({
        success: true,
        message: 'Saved favorite billers retrieved successfully.',
        count: result.favorites.length,
        data: result.favorites,
        pagination: result.pagination
      });
    } catch (err) {
      console.error('getFavorites Error:', err);
      const status = err.status || 500;
      return res.status(status).json({
        success: false,
        message: err.message || 'Failed to retrieve saved favorites.',
        data: null
      });
    }
  }

  /**
   * API 10: DELETE /api/bills/favorites/:id
   * Remove a saved biller from favorites
   */
  async deleteFavorite(req, res) {
    try {
      const userId = req.user?.userId;
      const favoriteId = req.params.id;

      const result = await billFavoriteService.deleteFavorite(favoriteId, userId);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: { id: result.deletedId }
      });
    } catch (err) {
      console.error('deleteFavorite Error:', err);
      const status = err.status || 500;
      return res.status(status).json({
        success: false,
        message: err.message || 'Failed to delete saved favorite.',
        data: null
      });
    }
  }
}

module.exports = new BillPaymentController();

