require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../config/db');
const bcrypt = require('bcrypt');

async function seedAdmin() {
    try {
        const hash = await bcrypt.hash('Admin@123456', 12);
        
        // Check if admin exists
        const [existing] = await db.execute(
            'SELECT id, email FROM admins WHERE email = ?',
            ['gopalper8602@gmail.com']
        );

        if (existing.length === 0) {
            await db.execute(
                `INSERT INTO admins (full_name, email, password_hash, role, status, email_verified_at)
                 VALUES (?, ?, ?, 'superadmin', 'active', NOW())`,
                ['Gopal Parmar', 'gopalper8602@gmail.com', hash]
            );
            console.log('Successfully inserted Gopal Parmar (gopalper8602@gmail.com) as superadmin.');
        } else {
            await db.execute(
                `UPDATE admins 
                 SET status = 'active', email_verified_at = NOW(), role = 'superadmin'
                 WHERE email = ?`,
                ['gopalper8602@gmail.com']
            );
            console.log('Gopal Parmar admin record updated to active superadmin.');
        }

        // Also ensure admin@apnapay.com exists
        const [adminApnaPay] = await db.execute(
            'SELECT id, email FROM admins WHERE email = ?',
            ['admin@apnapay.com']
        );
        if (adminApnaPay.length === 0) {
            await db.execute(
                `INSERT INTO admins (full_name, email, password_hash, role, status, email_verified_at)
                 VALUES (?, ?, ?, 'admin', 'active', NOW())`,
                ['ApnaPay System Admin', 'admin@apnapay.com', hash]
            );
            console.log('Successfully inserted admin@apnapay.com.');
        }

        const [all] = await db.execute('SELECT id, full_name, email, role, status FROM admins');
        console.log('Current Admins:', all);

        process.exit(0);
    } catch (err) {
        console.error('Seed Admin Error:', err);
        process.exit(1);
    }
}

seedAdmin();

