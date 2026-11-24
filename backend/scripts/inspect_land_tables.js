require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../config/db');

async function check() {
    const [tables] = await db.query("SHOW TABLES LIKE 'land_%'");
    console.log('Land tables in DB:', tables);
    for (const t of tables) {
        const tableName = Object.values(t)[0];
        const [schema] = await db.query('DESCRIBE ' + tableName);
        console.log('\n=== ' + tableName + ' ===');
        console.log(schema.map(c => c.Field + ' (' + c.Type + ', ' + (c.Null === 'YES' ? 'NULL' : 'NOT NULL') + ', default: ' + c.Default + ')').join('\n'));
        const [create] = await db.query('SHOW CREATE TABLE ' + tableName);
        console.log('\nCreate Table:\n' + create[0]['Create Table']);
    }
    process.exit(0);
}

check().catch(e => {
    console.error(e);
    process.exit(1);
});

