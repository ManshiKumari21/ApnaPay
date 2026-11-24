const db = require('../../config/db');
const billCategoryService = require('./billCategoryService');

class BillerService {
  /**
   * Get billers filtered by category (required), with optional pagination & search
   */
  async getBillersByCategory({ category, categoryId, page = 1, limit = 50, search = '' }) {
    const categoryIdentifier = categoryId || category;

    if (!categoryIdentifier) {
      throw {
        status: 400,
        message: 'Category parameter is required. Please specify a category (e.g. category=electricity).'
      };
    }

    // 1. Validate that the category actually exists in MySQL
    const categoryRecord = await billCategoryService.getCategoryByIdOrKey(categoryIdentifier);
    if (!categoryRecord) {
      throw {
        status: 400,
        message: `Invalid bill payment category: "${categoryIdentifier}". Please select a valid supported category.`
      };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT b.id, b.biller_name, b.biller_code, b.status,
             b.param_name, b.param_placeholder, b.param_regex,
             b.param_min_length, b.param_max_length, b.param_help_text,
             b.is_demo,
             c.id AS category_id, c.category_name, c.category_key, c.icon AS category_icon
      FROM billers b
      JOIN bill_categories c ON b.category_id = c.id
      WHERE b.category_id = ? AND b.status = 'active'
    `;
    const params = [categoryRecord.id];

    if (search && String(search).trim()) {
      query += ` AND (b.biller_name LIKE ? OR b.biller_code LIKE ?)`;
      const term = `%${String(search).trim()}%`;
      params.push(term, term);
    }

    // Get count
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) AS subq`;
    const [countRows] = await db.execute(countQuery, params);
    const totalRecords = countRows[0]?.total || 0;

    query += ` ORDER BY b.biller_name ASC LIMIT ${limitNum} OFFSET ${offset}`;
    const [rows] = await db.execute(query, params);

    const billers = rows.map(r => ({
      id: r.id,
      billerName: r.biller_name,
      billerCode: r.biller_code,
      status: r.status,
      isDemo: Boolean(r.is_demo),
      category: {
        id: r.category_id,
        name: r.category_name,
        key: r.category_key,
        icon: r.category_icon
      },
      customerParameter: {
        paramName: r.param_name || 'Consumer Number',
        placeholder: r.param_placeholder || 'Enter consumer number',
        regex: r.param_regex || null,
        minLength: r.param_min_length || 4,
        maxLength: r.param_max_length || 25,
        helpText: r.param_help_text || 'Enter your registered customer / account number'
      }
    }));

    return {
      category: categoryRecord,
      billers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum) || 1
      }
    };
  }

  /**
   * Get single biller by ID
   */
  async getBillerById(billerId) {
    if (!billerId) return null;

    const [rows] = await db.execute(
      `SELECT b.id, b.biller_name, b.biller_code, b.status,
              b.param_name, b.param_placeholder, b.param_regex,
              b.param_min_length, b.param_max_length, b.param_help_text,
              b.is_demo,
              c.id AS category_id, c.category_name, c.category_key, c.icon AS category_icon
       FROM billers b
       JOIN bill_categories c ON b.category_id = c.id
       WHERE b.id = ? LIMIT 1`,
      [billerId]
    );

    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      id: r.id,
      billerName: r.biller_name,
      billerCode: r.biller_code,
      status: r.status,
      isDemo: Boolean(r.is_demo),
      categoryId: r.category_id,
      categoryName: r.category_name,
      categoryKey: r.category_key,
      paramName: r.param_name || 'Consumer Number',
      paramPlaceholder: r.param_placeholder || 'Enter consumer number',
      paramRegex: r.param_regex || null,
      paramMinLength: r.param_min_length || 4,
      paramMaxLength: r.param_max_length || 25,
      paramHelpText: r.param_help_text || 'Enter your registered customer number'
    };
  }

  /**
   * Validate consumer number format for a biller
   */
  validateConsumerNumber(biller, consumerNumber) {
    if (!consumerNumber || typeof consumerNumber !== 'string') {
      return {
        valid: false,
        error: `Please enter a valid ${biller.paramName || 'consumer number'}.`
      };
    }

    const trimmed = consumerNumber.trim();
    const min = biller.paramMinLength || 4;
    const max = biller.paramMaxLength || 25;

    if (trimmed.length < min) {
      return {
        valid: false,
        error: `${biller.paramName || 'Consumer number'} must be at least ${min} characters.`
      };
    }

    if (trimmed.length > max) {
      return {
        valid: false,
        error: `${biller.paramName || 'Consumer number'} cannot exceed ${max} characters.`
      };
    }

    if (biller.paramRegex) {
      try {
        // Normalize double-escaped backslashes from DB storage (e.g. \\d -> \d)
        const normalized = String(biller.paramRegex).replace(/\\\\/g, '\\');
        const re = new RegExp(normalized);
        if (!re.test(trimmed)) {
          return {
            valid: false,
            error: `Invalid ${biller.paramName || 'consumer number'} format. ${biller.paramHelpText || ''}`
          };
        }
      } catch (_) {
        // Fallback gracefully if regex pattern in DB is malformed
      }
    }

    return {
      valid: true,
      cleanValue: trimmed
    };
  }
}

module.exports = new BillerService();
