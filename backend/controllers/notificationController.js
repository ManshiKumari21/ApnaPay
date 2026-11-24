
const db = require('../config/db');

// ==========================================
// 1. GET /api/notifications
// List User Notifications
// ==========================================

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        // Pagination
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit, 10) || 10)
        );
        const offset = (page - 1) * limit;

        // Status filter: all, unread, read
        const status = String(req.query.status || 'all')
            .toLowerCase()
            .trim();

        let whereClause = 'WHERE user_id = ?';
        const params = [userId];

        if (status === 'unread') {
            whereClause += ' AND is_read = 0';
        } else if (status === 'read') {
            whereClause += ' AND is_read = 1';
        }

        // Total records
        const [countResult] = await db.execute(
            `SELECT COUNT(*) AS total
             FROM notifications
             ${whereClause}`,
            params
        );

        const totalRecords = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / limit) || 1;

        // Unread count
        const [unreadResult] = await db.execute(
            `SELECT COUNT(*) AS unreadCount
             FROM notifications
             WHERE user_id = ? AND is_read = 0`,
            [userId]
        );

        const unreadCount = unreadResult[0]?.unreadCount || 0;

        // Paginated notifications
        const [rows] = await db.execute(
            `SELECT
                id,
                title,
                message,
                category,
                type,
                is_read,
                reference_id,
                reference_type,
                notification_type,
                created_at,
                read_at
             FROM notifications
             ${whereClause}
             ORDER BY created_at DESC, id DESC
             LIMIT ? OFFSET ?`,
            [...params, String(limit), String(offset)]
        );

        const notifications = rows.map((r) => ({
            id: r.id,
            title: r.title,
            message: r.message,
            category: r.category || 'general',
            type: r.type || 'info',
            is_read: Number(r.is_read),
            isRead: Boolean(r.is_read),
            reference_id: r.reference_id,
            referenceId: r.reference_id,
            reference_type: r.reference_type,
            referenceType: r.reference_type,
            notification_type: r.notification_type || r.reference_type || r.category || 'general',
            notificationType: r.notification_type || r.reference_type || r.category || 'general',
            created_at: r.created_at,
            createdAt: r.created_at,
            read_at: r.read_at,
            readAt: r.read_at
        }));

        return res.status(200).json({
            success: true,
            message: 'Notifications retrieved successfully.',
            data: {
                notifications,
                records: notifications,
                pagination: {
                    totalRecords,
                    page,
                    limit,
                    totalPages
                },
                totalRecords,
                totalPages,
                unreadCount
            }
        });

    } catch (error) {
        console.error('Get Notifications Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve notifications.'
        });
    }
};


// ==========================================
// 2. PATCH /api/notifications/:id/read
// Mark Single Notification as Read
// ==========================================

exports.markAsRead = async (req, res) => {
    try {
        const userId =
            req.user?.userId ||
            req.user?.id ||
            req.user?.adminId;

        const isAdmin =
            req.user?.isAdmin ||
            req.user?.role === 'admin' ||
            req.user?.type === 'admin';

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        // Get notification ID
        const rawId =
            req.params?.id ||
            req.body?.id ||
            req.body?.notificationId ||
            req.query?.id;

        const notificationId = parseInt(rawId, 10);

        if (
            !notificationId ||
            isNaN(notificationId) ||
            notificationId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Valid notification ID is required.'
            });
        }

        // Get notification from database
        const [rows] = await db.execute(
            `SELECT id, user_id, is_read, read_at
             FROM notifications
             WHERE id = ?
             LIMIT 1`,
            [notificationId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found.'
            });
        }

        // Get notification data
        const notif = rows[0];

        // Debug information
        console.log('NOTIFICATION DEBUG:', {
            notificationId,
            notificationUserId: notif.user_id,
            loggedInUserId: userId,
            isAdmin
        });

        // Check notification ownership
        if (
            !isAdmin &&
            String(notif.user_id) !== String(userId)
        ) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to access this notification.'
            });
        }

        // Already read check
        if (Boolean(notif.is_read)) {
            return res.status(200).json({
                success: true,
                message: 'Notification is already marked as read.',
                alreadyRead: true
            });
        }

        // Update notification status
        await db.execute(
            `UPDATE notifications
             SET is_read = 1,
                 read_at = COALESCE(read_at, NOW()),
                 updated_at = NOW()
             WHERE id = ?`,
            [notificationId]
        );

        const [updatedRows] = await db.execute(
            `SELECT id, is_read, read_at
             FROM notifications
             WHERE id = ?
             LIMIT 1`,
            [notificationId]
        );

        const updatedNotification = updatedRows[0];

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read successfully.',
            data: {
                id: notificationId,
                is_read: Number(updatedNotification.is_read),
                isRead: Boolean(updatedNotification.is_read),
                read_at: updatedNotification.read_at,
                readAt: updatedNotification.read_at
            }
        });

    } catch (error) {
        console.error('Mark As Read Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read.'
        });
    }
};


// ==========================================
// 3. POST /api/notifications/read-all
// Mark All Notifications as Read
// ==========================================

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const [result] = await db.execute(
            `UPDATE notifications
             SET is_read = 1,
                 read_at = COALESCE(read_at, NOW())
             WHERE user_id = ? AND is_read = 0`,
            [userId]
        );

        const updatedCount = result.affectedRows || 0;

        return res.status(200).json({
            success: true,
            message: 'All notifications marked as read successfully.',
            data: {
                updatedCount
            }
        });

    } catch (error) {
        console.error('Mark All As Read Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read.'
        });
    }
};


// ==========================================
// 4. GET /api/notification-preferences
// Get Notification Settings
// ==========================================

exports.getPreferences = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        // Fetch preferences
        const [rows] = await db.execute(
            `SELECT *
             FROM notification_preferences
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        let prefs;

        if (rows.length === 0) {
            // Create default preferences for new user
            try {
                await db.execute(
                    `INSERT INTO notification_preferences
                    (
                        user_id,
                        payment_notifications,
                        wallet_notifications,
                        bank_notifications,
                        upi_notifications,
                        kyc_notifications,
                        digital_land_notifications,
                        security_notifications,
                        general_notifications
                    )
                    VALUES (?, 1, 1, 1, 1, 1, 1, 1, 1)`,
                    [userId]
                );
            } catch (insertError) {
                console.error(
                    'Create Default Notification Preferences Error:',
                    insertError.message
                );
            }

            prefs = {
                paymentNotifications: true,
                walletNotifications: true,
                bankNotifications: true,
                upiNotifications: true,
                kycNotifications: true,
                digitalLandNotifications: true,
                securityNotifications: true,
                generalNotifications: true,
                payment_notifications: true,
                wallet_notifications: true,
                bank_notifications: true,
                upi_notifications: true,
                kyc_notifications: true,
                digital_land_notifications: true,
                security_notifications: true,
                general_notifications: true
            };

        } else {
            const r = rows[0];

            prefs = {
                paymentNotifications: Boolean(r.payment_notifications ?? 1),
                walletNotifications: Boolean(r.wallet_notifications ?? 1),
                bankNotifications: Boolean(r.bank_notifications ?? 1),
                upiNotifications: Boolean(r.upi_notifications ?? 1),
                kycNotifications: Boolean(r.kyc_notifications ?? 1),
                digitalLandNotifications: Boolean(r.digital_land_notifications ?? 1),
                securityNotifications: Boolean(r.security_notifications ?? 1),
                generalNotifications: Boolean(r.general_notifications ?? 1),

                payment_notifications: Boolean(r.payment_notifications ?? 1),
                wallet_notifications: Boolean(r.wallet_notifications ?? 1),
                bank_notifications: Boolean(r.bank_notifications ?? 1),
                upi_notifications: Boolean(r.upi_notifications ?? 1),
                kyc_notifications: Boolean(r.kyc_notifications ?? 1),
                digital_land_notifications: Boolean(r.digital_land_notifications ?? 1),
                security_notifications: Boolean(r.security_notifications ?? 1),
                general_notifications: Boolean(r.general_notifications ?? 1)
            };
        }

        return res.status(200).json({
            success: true,
            message: 'Notification preferences retrieved successfully.',
            data: prefs
        });

    } catch (error) {
        console.error('Get Notification Preferences Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve notification preferences.'
        });
    }
};
