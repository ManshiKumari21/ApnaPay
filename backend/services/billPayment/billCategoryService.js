const db = require('../../config/db');

class BillCategoryService {
  /**
   * Retrieve all active bill categories from MySQL
   */
  async getActiveCategories() {
    const [rows] = await db.execute(
      `SELECT id, category_name AS name, category_key AS categoryKey, 
              description, icon, display_order AS displayOrder, status
       FROM bill_categories
       WHERE status = 'active'
       ORDER BY display_order ASC, id ASC`
    );

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      categoryKey: r.categoryKey || r.name.toLowerCase().replace(/\s+/g, '-'),
      description: r.description || `Pay your ${r.name} bills`,
      icon: r.icon || 'FileText',
      displayOrder: r.displayOrder || 0,
      status: r.status
    }));
  }

  /**
   * Find category by ID or Key
   */
  async getCategoryByIdOrKey(identifier) {
    if (!identifier) return null;

    let query = `SELECT id, category_name AS name, category_key AS categoryKey, description, icon, status
                 FROM bill_categories WHERE `;
    const params = [];

    if (!isNaN(identifier) && Number.isInteger(Number(identifier))) {
      query += `id = ? LIMIT 1`;
      params.push(Number(identifier));
    } else {
      const key = String(identifier).trim().toLowerCase();
      query += `(category_key = ? OR LOWER(category_name) = ?) LIMIT 1`;
      params.push(key, key);
    }

    const [rows] = await db.execute(query, params);
    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      categoryKey: r.categoryKey,
      description: r.description,
      icon: r.icon,
      status: r.status
    };
  }
}

module.exports = new BillCategoryService();

