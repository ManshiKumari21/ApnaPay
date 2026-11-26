require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../config/db');

async function runMigration() {
    console.log('========================================================');
    console.log('STARTING DIGITAL LAND DATABASE MIGRATION & SETUP');
    console.log('========================================================\n');

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Update land_projects table if columns missing
        console.log('Checking land_projects table columns...');
        const [projCols] = await conn.query("SHOW COLUMNS FROM land_projects");
        const existingProjCols = projCols.map(c => c.Field);

        if (!existingProjCols.includes('total_area')) {
            await conn.query("ALTER TABLE land_projects ADD COLUMN total_area decimal(19,4) NOT NULL DEFAULT 10000.0000 AFTER location");
            console.log('  -> Added total_area to land_projects');
        }
        if (!existingProjCols.includes('total_units')) {
            await conn.query("ALTER TABLE land_projects ADD COLUMN total_units decimal(19,4) NOT NULL DEFAULT 100.0000 AFTER total_area");
            console.log('  -> Added total_units to land_projects');
        }
        if (!existingProjCols.includes('available_units')) {
            await conn.query("ALTER TABLE land_projects ADD COLUMN available_units decimal(19,4) NOT NULL DEFAULT 100.0000 AFTER total_units");
            console.log('  -> Added available_units to land_projects');
        }
        if (!existingProjCols.includes('updated_at')) {
            await conn.query("ALTER TABLE land_projects ADD COLUMN updated_at timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() AFTER created_at");
            console.log('  -> Added updated_at to land_projects');
        }

        // 2. Update land_orders table if columns missing
        console.log('Checking land_orders table columns...');
        const [orderCols] = await conn.query("SHOW COLUMNS FROM land_orders");
        const existingOrderCols = orderCols.map(c => c.Field);

        if (!existingOrderCols.includes('order_reference')) {
            await conn.query("ALTER TABLE land_orders ADD COLUMN order_reference varchar(64) UNIQUE AFTER id");
            console.log('  -> Added order_reference to land_orders');
        }
        if (!existingOrderCols.includes('price_per_unit')) {
            await conn.query("ALTER TABLE land_orders ADD COLUMN price_per_unit decimal(19,4) NOT NULL DEFAULT 0.0000 AFTER units");
            console.log('  -> Added price_per_unit to land_orders');
        }
        if (!existingOrderCols.includes('updated_at')) {
            await conn.query("ALTER TABLE land_orders ADD COLUMN updated_at timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() AFTER created_at");
            console.log('  -> Added updated_at to land_orders');
        }
        if (!existingOrderCols.includes('approved_by')) {
            await conn.query("ALTER TABLE land_orders ADD COLUMN approved_by bigint(20) unsigned DEFAULT NULL AFTER status");
            console.log('  -> Added approved_by to land_orders');
        }
        if (!existingOrderCols.includes('approved_at')) {
            await conn.query("ALTER TABLE land_orders ADD COLUMN approved_at timestamp NULL DEFAULT NULL AFTER approved_by");
            console.log('  -> Added approved_at to land_orders');
        }
        if (!existingOrderCols.includes('rejected_by')) {
            await conn.query("ALTER TABLE land_orders ADD COLUMN rejected_by bigint(20) unsigned DEFAULT NULL AFTER approved_at");
            console.log('  -> Added rejected_by to land_orders');
        }
        if (!existingOrderCols.includes('rejected_at')) {
            await conn.query("ALTER TABLE land_orders ADD COLUMN rejected_at timestamp NULL DEFAULT NULL AFTER rejected_by");
            console.log('  -> Added rejected_at to land_orders');
        }
        if (!existingOrderCols.includes('rejection_reason')) {
            await conn.query("ALTER TABLE land_orders ADD COLUMN rejection_reason varchar(255) DEFAULT NULL AFTER rejected_at");
            console.log('  -> Added rejection_reason to land_orders');
        }

        // 3. Update land_holdings table if columns missing
        console.log('Checking land_holdings table columns...');
        const [holdingCols] = await conn.query("SHOW COLUMNS FROM land_holdings");
        const existingHoldingCols = holdingCols.map(c => c.Field);

        if (!existingHoldingCols.includes('total_invested')) {
            await conn.query("ALTER TABLE land_holdings ADD COLUMN total_invested decimal(19,4) NOT NULL DEFAULT 0.0000 AFTER average_purchase_price");
            console.log('  -> Added total_invested to land_holdings');
        }
        if (!existingHoldingCols.includes('status')) {
            await conn.query("ALTER TABLE land_holdings ADD COLUMN status varchar(30) NOT NULL DEFAULT 'active' AFTER total_invested");
            console.log('  -> Added status to land_holdings');
        }
        if (!existingHoldingCols.includes('created_at')) {
            await conn.query("ALTER TABLE land_holdings ADD COLUMN created_at timestamp NULL DEFAULT current_timestamp() AFTER status");
            console.log('  -> Added created_at to land_holdings');
        }

        // 4. Update land_valuations table if columns missing
        console.log('Checking land_valuations table columns...');
        const [valCols] = await conn.query("SHOW COLUMNS FROM land_valuations");
        const existingValCols = valCols.map(c => c.Field);

        if (!existingValCols.includes('previous_valuation')) {
            await conn.query("ALTER TABLE land_valuations ADD COLUMN previous_valuation decimal(19,4) DEFAULT 0.0000 AFTER project_id");
            console.log('  -> Added previous_valuation to land_valuations');
        }
        if (!existingValCols.includes('current_valuation')) {
            await conn.query("ALTER TABLE land_valuations ADD COLUMN current_valuation decimal(19,4) NOT NULL DEFAULT 0.0000 AFTER previous_valuation");
            console.log('  -> Added current_valuation to land_valuations');
        }
        if (!existingValCols.includes('created_at')) {
            await conn.query("ALTER TABLE land_valuations ADD COLUMN created_at timestamp NULL DEFAULT current_timestamp() AFTER valued_at");
            console.log('  -> Added created_at to land_valuations');
        }

        // 5. Create land_transactions table if not exists
        console.log('Checking land_transactions table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS land_transactions (
                id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
                user_id bigint(20) unsigned NOT NULL,
                order_id bigint(20) unsigned DEFAULT NULL,
                project_id bigint(20) unsigned NOT NULL,
                order_reference varchar(64) DEFAULT NULL,
                transaction_type varchar(40) NOT NULL DEFAULT 'purchase',
                units decimal(19,4) NOT NULL,
                amount decimal(19,4) NOT NULL,
                status varchar(30) NOT NULL DEFAULT 'completed',
                description varchar(255) DEFAULT NULL,
                created_at timestamp NULL DEFAULT current_timestamp(),
                PRIMARY KEY (id),
                KEY idx_land_txn_user_date (user_id, created_at),
                KEY order_id (order_id),
                KEY project_id (project_id),
                CONSTRAINT land_transactions_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id),
                CONSTRAINT land_transactions_ibfk_2 FOREIGN KEY (order_id) REFERENCES land_orders (id) ON DELETE SET NULL,
                CONSTRAINT land_transactions_ibfk_3 FOREIGN KEY (project_id) REFERENCES land_projects (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci
        `);
        console.log('  -> land_transactions table verified/created successfully.');

        // 6. Seed demo land projects if table is empty
        const [existingProjects] = await conn.query("SELECT COUNT(*) AS count FROM land_projects");
        if (existingProjects[0].count === 0) {
            console.log('Seeding initial premium digital land projects...');
            await conn.query(`
                INSERT INTO land_projects (id, project_name, description, location, total_area, total_units, available_units, unit_name, price_per_unit, status)
                VALUES 
                (1, 'Apna Green Tech Park', 'Premium commercial and IT ecosystem land plots with smart infrastructure, green energy, and high capital appreciation potential.', 'Electronic City, Bengaluru', 250000.0000, 5000.0000, 4850.0000, 'sqft', 2450.0000, 'active'),
                (2, 'Yamuna Expressway Smart Hub', 'Strategic logistics and warehousing digital land parcel directly connected to the upcoming International Airport corridor.', 'Yamuna Expressway, Greater Noida', 500000.0000, 10000.0000, 9200.0000, 'sqyd', 4800.0000, 'active'),
                (3, 'Fintech Coastal Valley', 'Ultra-modern financial district development adjacent to coastal mega highway with verified title and instant digital registry.', 'GIFT City Extension, Gujarat', 150000.0000, 3000.0000, 2750.0000, 'sqft', 3200.0000, 'active'),
                (4, 'Deccan Oasis Agro Estates', 'Organic eco-farming and managed farm land with perimeter fencing, drip irrigation, and annual organic yield payouts.', 'Wadi Road, Hyderabad', 1000000.0000, 20000.0000, 18500.0000, 'sqyd', 1150.0000, 'active'),
                (5, 'Himalayan Pine Retreat', 'Eco-tourism and luxury mountain villa residential land plots with breathtaking panoramic views and tourist rental yields.', 'Kasauli Hills, Himachal Pradesh', 80000.0000, 1600.0000, 0.0000, 'sqyd', 6500.0000, 'sold_out')
            `);
            console.log('  -> Seeded 5 initial digital land projects.');

            // Seed Valuations for these projects
            console.log('Seeding valuation history for projects...');
            await conn.query(`
                INSERT INTO land_valuations (project_id, previous_valuation, current_valuation, price_per_unit, valuation_source, valued_at)
                VALUES
                (1, 1150000000.0000, 1225000000.0000, 2450.0000, 'National Real Estate Valuation Board', NOW() - INTERVAL 1 MONTH),
                (1, 1080000000.0000, 1150000000.0000, 2300.0000, 'National Real Estate Valuation Board', NOW() - INTERVAL 6 MONTH),
                (1, 980000000.0000, 1080000000.0000, 2160.0000, 'National Real Estate Valuation Board', NOW() - INTERVAL 1 YEAR),
                (2, 4400000000.0000, 4800000000.0000, 4800.0000, 'State Land Revenue Authority', NOW() - INTERVAL 2 MONTH),
                (2, 3900000000.0000, 4400000000.0000, 4400.0000, 'State Land Revenue Authority', NOW() - INTERVAL 8 MONTH),
                (3, 900000000.0000, 960000000.0000, 3200.0000, 'GIFT City Asset Assessor', NOW() - INTERVAL 15 DAY),
                (4, 1050000000.0000, 1150000000.0000, 1150.0000, 'Agro-Land Board of India', NOW() - INTERVAL 3 MONTH)
            `);
            console.log('  -> Seeded valuation history records.');
        }

        await conn.commit();
        console.log('\n========================================================');
        console.log('DIGITAL LAND MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('========================================================\n');
        process.exit(0);

    } catch (err) {
        await conn.rollback();
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        conn.release();
    }
}

runMigration();

