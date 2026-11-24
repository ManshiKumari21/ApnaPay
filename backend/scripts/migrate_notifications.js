const db = require('../config/db');

async function migrateNotifications() {
    console.log('--- Migrating Notification Tables ---');
    try {
        // 1. Ensure notifications table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                title VARCHAR(150) NOT NULL,
                message TEXT NOT NULL,
                category VARCHAR(50) NOT NULL DEFAULT 'general',
                type VARCHAR(20) NOT NULL DEFAULT 'info',
                is_read TINYINT(1) NOT NULL DEFAULT 0,
                reference_id VARCHAR(100) NULL,
                reference_type VARCHAR(50) NULL,
                read_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_notifications_user_filter (user_id, is_read, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Check if existing notifications table is missing any columns
        const [notifCols] = await db.execute("DESCRIBE notifications");
        const notifColNames = notifCols.map(c => c.Field.toLowerCase());

        if (!notifColNames.includes('category')) {
            console.log('Adding column category to notifications...');
            await db.execute("ALTER TABLE notifications ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'general' AFTER message");
        }
        if (!notifColNames.includes('type')) {
            console.log('Adding column type to notifications...');
            await db.execute("ALTER TABLE notifications ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'info' AFTER category");
        }
        if (!notifColNames.includes('is_read')) {
            console.log('Adding column is_read to notifications...');
            await db.execute("ALTER TABLE notifications ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0 AFTER type");
        }
        if (!notifColNames.includes('reference_id')) {
            console.log('Adding column reference_id to notifications...');
            await db.execute("ALTER TABLE notifications ADD COLUMN reference_id VARCHAR(100) NULL AFTER is_read");
        }
        if (!notifColNames.includes('reference_type')) {
            console.log('Adding column reference_type to notifications...');
            await db.execute("ALTER TABLE notifications ADD COLUMN reference_type VARCHAR(50) NULL AFTER reference_id");
        }
        if (!notifColNames.includes('updated_at')) {
            console.log('Adding column updated_at to notifications...');
            await db.execute("ALTER TABLE notifications ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
        }

        // Sync is_read with read_at
        await db.execute("UPDATE notifications SET is_read = 1 WHERE read_at IS NOT NULL AND is_read = 0");

        // 2. Ensure notification_preferences table exists and has category columns
        await db.execute(`
            CREATE TABLE IF NOT EXISTS notification_preferences (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL UNIQUE,
                payment_notifications TINYINT(1) NOT NULL DEFAULT 1,
                wallet_notifications TINYINT(1) NOT NULL DEFAULT 1,
                bank_notifications TINYINT(1) NOT NULL DEFAULT 1,
                upi_notifications TINYINT(1) NOT NULL DEFAULT 1,
                kyc_notifications TINYINT(1) NOT NULL DEFAULT 1,
                digital_land_notifications TINYINT(1) NOT NULL DEFAULT 1,
                security_notifications TINYINT(1) NOT NULL DEFAULT 1,
                general_notifications TINYINT(1) NOT NULL DEFAULT 1,
                email_enabled TINYINT(1) NOT NULL DEFAULT 1,
                sms_enabled TINYINT(1) NOT NULL DEFAULT 1,
                push_enabled TINYINT(1) NOT NULL DEFAULT 1,
                marketing_enabled TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        const [prefCols] = await db.execute("DESCRIBE notification_preferences");
        const prefColNames = prefCols.map(c => c.Field.toLowerCase());

        const requiredPrefCols = [
            { name: 'payment_notifications', def: 'TINYINT(1) NOT NULL DEFAULT 1' },
            { name: 'wallet_notifications', def: 'TINYINT(1) NOT NULL DEFAULT 1' },
            { name: 'bank_notifications', def: 'TINYINT(1) NOT NULL DEFAULT 1' },
            { name: 'upi_notifications', def: 'TINYINT(1) NOT NULL DEFAULT 1' },
            { name: 'kyc_notifications', def: 'TINYINT(1) NOT NULL DEFAULT 1' },
            { name: 'digital_land_notifications', def: 'TINYINT(1) NOT NULL DEFAULT 1' },
            { name: 'security_notifications', def: 'TINYINT(1) NOT NULL DEFAULT 1' },
            { name: 'general_notifications', def: 'TINYINT(1) NOT NULL DEFAULT 1' },
            { name: 'created_at', def: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
            { name: 'updated_at', def: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
        ];

        for (const col of requiredPrefCols) {
            if (!prefColNames.includes(col.name)) {
                console.log(`Adding column ${col.name} to notification_preferences...`);
                await db.execute(`ALTER TABLE notification_preferences ADD COLUMN ${col.name} ${col.def}`);
            }
        }

        console.log('Notification tables migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrateNotifications();

