const db = require('../config/db');

/**
 * Service for creating and managing internal notifications
 */
class NotificationService {
    /**
     * Map category to preference column name
     */
    static getPrefColumn(category) {
        const map = {
            payment: 'payment_notifications',
            wallet: 'wallet_notifications',
            bank: 'bank_notifications',
            upi: 'upi_notifications',
            kyc: 'kyc_notifications',
            digital_land: 'digital_land_notifications',
            security: 'security_notifications',
            general: 'general_notifications'
        };
        return map[category] || 'general_notifications';
    }

    /**
     * Create an in-app notification for a user
     * @param {Object} params
     * @param {number|string} params.userId
     * @param {string} params.title
     * @param {string} params.message
     * @param {string} [params.category='general'] - payment, wallet, bank, upi, kyc, digital_land, security, general
     * @param {string} [params.type='info'] - success, warning, error, info
     * @param {string|number} [params.referenceId=null]
     * @param {string} [params.referenceType=null]
     * @param {string} [params.notificationType=null]
     * @param {Object} [params.conn=null] - Optional MySQL connection for transaction consistency
     */
    static async notify({
        userId,
        title,
        message,
        category = 'general',
        type = 'info',
        referenceId = null,
        referenceType = null,
        notificationType = null,
        conn = null
    }) {
        if (!userId || !title || !message) {
            return null;
        }

        try {
            const queryExecutor = conn || db;

            // 1. Check user notification preferences
            const prefCol = this.getPrefColumn(category);
            const [prefs] = await queryExecutor.execute(
                `SELECT ${prefCol} FROM notification_preferences WHERE user_id = ? LIMIT 1`,
                [userId]
            );

            // If preference exists and is disabled (0), skip notification
            if (prefs.length > 0 && prefs[0][prefCol] === 0) {
                return null;
            }

            // 2. Prevent duplicate notifications with same reference within 5 minutes
            if (referenceId && referenceType) {
                const [existing] = await queryExecutor.execute(
                    `SELECT id FROM notifications
                     WHERE user_id = ? AND reference_id = ? AND reference_type = ?
                       AND created_at >= NOW() - INTERVAL 5 MINUTE
                     LIMIT 1`,
                    [userId, String(referenceId), String(referenceType)]
                );
                if (existing.length > 0) {
                    return existing[0].id; // Already notified recently
                }
            }

            // 3. Insert notification
            const notifType = notificationType || referenceType || category;
            const [result] = await queryExecutor.execute(
                `INSERT INTO notifications
                 (user_id, title, message, category, type, is_read, reference_id, reference_type, notification_type)
                 VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
                [
                    userId,
                    String(title).trim(),
                    String(message).trim(),
                    category,
                    type,
                    referenceId ? String(referenceId) : null,
                    referenceType ? String(referenceType) : null,
                    String(notifType).slice(0, 40)
                ]
            );

            return result.insertId;
        } catch (err) {
            // Notification failure should never crash the main business operation
            console.error('[NotificationService] Error creating notification:', err.message);
            return null;
        }
    }

    /**
     * Initialize default preferences for a user if not already set
     * @param {number|string} userId
     */
    static async initializePreferences(userId) {
        try {
            await db.execute(
                `INSERT IGNORE INTO notification_preferences 
                 (user_id, payment_notifications, wallet_notifications, bank_notifications, upi_notifications, kyc_notifications, digital_land_notifications, security_notifications, general_notifications)
                 VALUES (?, 1, 1, 1, 1, 1, 1, 1, 1)`,
                [userId]
            );
        } catch (err) {
            console.error('[NotificationService] Error initializing preferences:', err.message);
        }
    }
}

module.exports = NotificationService;
