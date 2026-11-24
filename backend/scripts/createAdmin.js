
require('dotenv').config();

const db = require('../config/db');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question) =>
    new Promise((resolve) => rl.question(question, resolve));

async function createAdmin() {
    try {
        const fullName = (await ask('Admin full name: ')).trim();
        const email = (await ask('Admin email: ')).trim().toLowerCase();
        const password = await ask('Admin password (minimum 8 characters): ');

        if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Please enter a valid name and email.');
        }

        if (password.length < 8) {
            throw new Error('Password must contain at least 8 characters.');
        }

        const [existing] = await db.execute(
            'SELECT id FROM admins WHERE email = ? LIMIT 1',
            [email]
        );

        if (existing.length > 0) {
            throw new Error('Admin with this email already exists.');
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await db.execute(
            `INSERT INTO admins
            (full_name, email, password_hash, role, status, email_verified_at)
            VALUES (?, ?, ?, 'admin', 'active', NOW())`,
            [fullName, email, passwordHash]
        );

        console.log('Admin account created successfully.');

    } catch (error) {
        console.error('Admin Creation Error:', error.message);
        process.exitCode = 1;
    } finally {
        rl.close();
        await db.end();
    }
}

createAdmin();
