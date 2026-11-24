const db = require('../config/db');

async function clean() {
    try {
        const [users] = await db.execute("SELECT id FROM users WHERE email LIKE 'test_notif_%'");
        if (users.length > 0) {
            const ids = users.map(u => u.id);
            const placeholders = ids.map(() => '?').join(',');
            await db.execute(`DELETE FROM notifications WHERE user_id IN (${placeholders})`, ids);
            await db.execute(`DELETE FROM notification_preferences WHERE user_id IN (${placeholders})`, ids);
            await db.execute(`DELETE FROM sessions WHERE user_id IN (${placeholders})`, ids);
            await db.execute(`DELETE FROM wallets WHERE user_id IN (${placeholders})`, ids);
            await db.execute(`DELETE FROM users WHERE id IN (${placeholders})`, ids);
            console.log(`Cleaned up ${ids.length} leftover test users.`);
        } else {
            console.log('No leftover test users found.');
        }
    } catch (err) {
        console.error('Clean error:', err.message);
    } finally {
        await db.end();
    }
}

clean();

