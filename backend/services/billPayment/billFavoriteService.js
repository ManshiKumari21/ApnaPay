const db = require('../../config/db');
const billerService = require('./billerService');

class BillFavoriteService {
  /**
   * Helper: Mask consumer numbers for safe display
   */
  maskConsumerNumber(num) {
    if (!num) return '••••';
    const str = String(num).trim();
    if (str.length <= 4) return '••••' + str;
    const last4 = str.slice(-4);
    const maskedPrefix = '•'.repeat(Math.min(str.length - 4, 8));
    return `${maskedPrefix}${last4}`;
  }

  /**
   * Save a biller and consumer number to favorites
   */
  async addFavorite({ userId, billerId, consumerNumber, nickname }) {
    if (!userId) {
      throw { status: 401, message: 'Authentication required.' };
    }

    if (!billerId) {
      throw { status: 400, message: 'Biller ID is required.' };
    }

    if (!consumerNumber || typeof consumerNumber !== 'string') {
      throw { status: 400, message: 'Consumer number is required.' };
    }

    // 1. Verify biller exists and is active
    const biller = await billerService.getBillerById(billerId);
    if (!biller || biller.status !== 'active') {
      throw { status: 404, message: 'Biller not found or is currently inactive.' };
    }

    // 2. Validate consumer number format
    const valResult = billerService.validateConsumerNumber(biller, consumerNumber);
    if (!valResult.valid) {
      throw { status: 400, message: valResult.error };
    }
    const cleanConsumerNumber = valResult.cleanValue;

    // 3. Check for duplicates
    const [existing] = await db.execute(
      `SELECT id FROM bill_favorites
       WHERE user_id = ? AND biller_id = ? AND consumer_number = ? AND is_active = TRUE
       LIMIT 1`,
      [userId, biller.id, cleanConsumerNumber]
    );

    if (existing.length > 0) {
      throw {
        status: 409,
        message: 'This biller and consumer number is already saved in your favorites.'
      };
    }

    const cleanNickname = nickname && String(nickname).trim()
      ? String(nickname).trim().slice(0, 100)
      : `${biller.billerName} (${cleanConsumerNumber.slice(-4)})`;

    // 4. Insert or reactivate favorite
    const [insertResult] = await db.execute(
      `INSERT INTO bill_favorites (user_id, biller_id, consumer_number, nickname, is_active)
       VALUES (?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), is_active = TRUE, updated_at = NOW()`,
      [userId, biller.id, cleanConsumerNumber, cleanNickname]
    );

    const favoriteId = insertResult.insertId || existing[0]?.id;

    return {
      id: favoriteId,
      billerId: biller.id,
      billerName: biller.billerName,
      billerCode: biller.billerCode,
      categoryName: biller.categoryName,
      categoryKey: biller.categoryKey,
      paramName: biller.paramName,
      consumerNumber: cleanConsumerNumber,
      maskedConsumerNumber: this.maskConsumerNumber(cleanConsumerNumber),
      nickname: cleanNickname,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Retrieve saved favorites for authenticated user
   */
  async getFavorites({ userId, page = 1, limit = 50 }) {
    if (!userId) {
      throw { status: 401, message: 'Authentication required.' };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Count
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM bill_favorites WHERE user_id = ? AND is_active = TRUE`,
      [userId]
    );
    const totalRecords = countRows[0]?.total || 0;

    const [rows] = await db.execute(
      `SELECT f.id, f.consumer_number, f.nickname, f.created_at, f.updated_at,
              b.id AS biller_id, b.biller_name, b.biller_code, b.status AS biller_status,
              b.param_name, b.param_placeholder,
              c.id AS category_id, c.category_name, c.category_key, c.icon AS category_icon
       FROM bill_favorites f
       JOIN billers b ON f.biller_id = b.id
       JOIN bill_categories c ON b.category_id = c.id
       WHERE f.user_id = ? AND f.is_active = TRUE
       ORDER BY f.id DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      [userId]
    );

    const favorites = rows.map(r => ({
      id: r.id,
      nickname: r.nickname || r.biller_name,
      consumerNumber: r.consumer_number,
      maskedConsumerNumber: this.maskConsumerNumber(r.consumer_number),
      biller: {
        id: r.biller_id,
        billerName: r.biller_name,
        billerCode: r.biller_code,
        status: r.biller_status,
        isActive: r.biller_status === 'active',
        paramName: r.param_name,
        paramPlaceholder: r.param_placeholder
      },
      category: {
        id: r.category_id,
        name: r.category_name,
        key: r.category_key,
        icon: r.category_icon
      },
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    return {
      favorites,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum) || 1
      }
    };
  }

  /**
   * Delete a favorite (owner-only)
   */
  async deleteFavorite(favoriteId, userId) {
    if (!userId) {
      throw { status: 401, message: 'Authentication required.' };
    }

    if (!favoriteId) {
      throw { status: 400, message: 'Favorite ID is required.' };
    }

    // Verify ownership and existence
    const [existing] = await db.execute(
      `SELECT id, nickname, consumer_number FROM bill_favorites
       WHERE id = ? AND user_id = ? AND is_active = TRUE
       LIMIT 1`,
      [favoriteId, userId]
    );

    if (existing.length === 0) {
      throw {
        status: 404,
        message: 'Saved biller not found in your favorites or you are not authorized to remove it.'
      };
    }

    // Soft delete or hard delete
    await db.execute(
      `DELETE FROM bill_favorites WHERE id = ? AND user_id = ?`,
      [favoriteId, userId]
    );

    return {
      success: true,
      message: 'Saved biller successfully removed from your favorites.',
      deletedId: Number(favoriteId)
    };
  }
}

module.exports = new BillFavoriteService();

