const db = require('../config/db');

/**
 * Service for creating and managing internal notifications
 */
class NotificationService {
    /**
     * Create an in-app notification for a user
     */
    static async notify({
        userId,
        title,
        message,
        category = 'general',
        type = 'info',
        referenceId = null,
        referenceType = null
    }) {
        if (!userId || !title || !message) {
            return null;
        }

        try {
            // Check in-app notification preference
            const [prefs] = await db.execute(
                `SELECT push_enabled FROM notification_preferences WHERE user_id = ? LIMIT 1`,
                [userId]
            );

            if (prefs.length > 0 && prefs[0].push_enabled === 0) {
                return null;
            }

            // Insert notification matching real table schema
            const [result] = await db.execute(
                `INSERT INTO notifications (user_id, title, message, notification_type, created_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [
                    userId,
                    String(title).trim(),
                    String(message).trim(),
                    category || 'general'
                ]
            );

            return result.insertId;
        } catch (err) {
            console.error('[NotificationService] Error creating notification:', err.message);
            return null;
        }
    }

    /**
     * Initialize default preferences for a user if not already set
     */
    static async initializePreferences(userId) {
        try {
            await db.execute(
                `INSERT IGNORE INTO notification_preferences 
                 (user_id, email_enabled, sms_enabled, push_enabled, marketing_enabled)
                 VALUES (?, 1, 1, 1, 0)`,
                [userId]
            );
        } catch (err) {
            console.error('[NotificationService] Error initializing preferences:', err.message);
        }
    }
}

module.exports = NotificationService;
