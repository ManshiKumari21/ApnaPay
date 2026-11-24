const db = require('../config/db');

async function inspect() {
    try {
        const [tables] = await db.execute("SHOW TABLES LIKE '%notification%'");
        console.log('Tables found:', tables);

        for (const t of tables) {
            const tableName = Object.values(t)[0];
            const [cols] = await db.execute(`DESCRIBE ${tableName}`);
            console.log(`\nColumns of ${tableName}:`);
            cols.forEach(c => console.log(`  - ${c.Field} (${c.Type}) Nullable: ${c.Null} Default: ${c.Default}`));
        }

        process.exit(0);
    } catch (err) {
        console.error('Error inspecting:', err.message);
        process.exit(1);
    }
}

inspect();

