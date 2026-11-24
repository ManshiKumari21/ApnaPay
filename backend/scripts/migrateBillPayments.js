const db = require('../config/db');

async function migrateBillPayments() {
  console.log('--- Starting Bill Payments Database Migration ---');
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Helper to check if column exists in table
    const checkColumnExists = async (tableName, columnName) => {
      const [rows] = await conn.execute(
        `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [tableName, columnName]
      );
      return rows[0].cnt > 0;
    };

    // 2. Enhance bill_categories
    console.log('1. Checking bill_categories table...');
    if (!await checkColumnExists('bill_categories', 'category_key')) {
      await conn.execute(`ALTER TABLE bill_categories ADD COLUMN category_key VARCHAR(50) NULL AFTER category_name`);
      console.log('   Added category_key column to bill_categories');
    }
    if (!await checkColumnExists('bill_categories', 'description')) {
      await conn.execute(`ALTER TABLE bill_categories ADD COLUMN description VARCHAR(255) NULL AFTER category_key`);
      console.log('   Added description column to bill_categories');
    }
    if (!await checkColumnExists('bill_categories', 'icon')) {
      await conn.execute(`ALTER TABLE bill_categories ADD COLUMN icon VARCHAR(50) NULL AFTER description`);
      console.log('   Added icon column to bill_categories');
    }
    if (!await checkColumnExists('bill_categories', 'display_order')) {
      await conn.execute(`ALTER TABLE bill_categories ADD COLUMN display_order INT DEFAULT 0 AFTER icon`);
      console.log('   Added display_order column to bill_categories');
    }
    if (!await checkColumnExists('bill_categories', 'created_at')) {
      await conn.execute(`ALTER TABLE bill_categories ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log('   Added created_at column to bill_categories');
    }

    // 3. Enhance billers
    console.log('2. Checking billers table...');
    if (!await checkColumnExists('billers', 'param_name')) {
      await conn.execute(`ALTER TABLE billers ADD COLUMN param_name VARCHAR(100) DEFAULT 'Consumer Number' AFTER biller_code`);
      console.log('   Added param_name column to billers');
    }
    if (!await checkColumnExists('billers', 'param_placeholder')) {
      await conn.execute(`ALTER TABLE billers ADD COLUMN param_placeholder VARCHAR(150) DEFAULT 'Enter consumer number' AFTER param_name`);
      console.log('   Added param_placeholder column to billers');
    }
    if (!await checkColumnExists('billers', 'param_regex')) {
      await conn.execute(`ALTER TABLE billers ADD COLUMN param_regex VARCHAR(255) NULL AFTER param_placeholder`);
      console.log('   Added param_regex column to billers');
    }
    if (!await checkColumnExists('billers', 'param_min_length')) {
      await conn.execute(`ALTER TABLE billers ADD COLUMN param_min_length INT DEFAULT 4 AFTER param_regex`);
      console.log('   Added param_min_length column to billers');
    }
    if (!await checkColumnExists('billers', 'param_max_length')) {
      await conn.execute(`ALTER TABLE billers ADD COLUMN param_max_length INT DEFAULT 25 AFTER param_min_length`);
      console.log('   Added param_max_length column to billers');
    }
    if (!await checkColumnExists('billers', 'param_help_text')) {
      await conn.execute(`ALTER TABLE billers ADD COLUMN param_help_text VARCHAR(255) NULL AFTER param_max_length`);
      console.log('   Added param_help_text column to billers');
    }
    if (!await checkColumnExists('billers', 'is_demo')) {
      await conn.execute(`ALTER TABLE billers ADD COLUMN is_demo BOOLEAN DEFAULT TRUE AFTER param_help_text`);
      console.log('   Added is_demo column to billers');
    }
    if (!await checkColumnExists('billers', 'created_at')) {
      await conn.execute(`ALTER TABLE billers ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log('   Added created_at column to billers');
    }

    // 4. Create bill_fetches table
    console.log('3. Checking bill_fetches table...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS bill_fetches (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        fetch_reference VARCHAR(64) NOT NULL UNIQUE,
        user_id BIGINT UNSIGNED NOT NULL,
        biller_id BIGINT UNSIGNED NOT NULL,
        consumer_number VARCHAR(100) NOT NULL,
        customer_name VARCHAR(150) NOT NULL,
        bill_number VARCHAR(100) NOT NULL,
        bill_date DATE NOT NULL,
        due_date DATE NOT NULL,
        bill_amount DECIMAL(12,2) NOT NULL,
        bill_period VARCHAR(100) NULL,
        bill_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
        description VARCHAR(255) NULL,
        metadata JSON NULL,
        expires_at DATETIME NOT NULL,
        is_paid BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (biller_id) REFERENCES billers(id),
        INDEX idx_bf_user_ref (user_id, fetch_reference),
        INDEX idx_bf_user_biller (user_id, biller_id, consumer_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   bill_fetches table ready.');

    // 5. Enhance bill_payments
    console.log('4. Checking bill_payments table...');
    if (!await checkColumnExists('bill_payments', 'txn_reference')) {
      await conn.execute(`ALTER TABLE bill_payments ADD COLUMN txn_reference VARCHAR(64) NULL AFTER bill_reference`);
      await conn.execute(`ALTER TABLE bill_payments ADD UNIQUE INDEX uq_bp_txn_ref (txn_reference)`);
      console.log('   Added txn_reference column and unique index to bill_payments');
    }
    if (!await checkColumnExists('bill_payments', 'fetch_id')) {
      await conn.execute(`ALTER TABLE bill_payments ADD COLUMN fetch_id BIGINT UNSIGNED NULL AFTER txn_reference`);
      console.log('   Added fetch_id column to bill_payments');
    }
    if (!await checkColumnExists('bill_payments', 'consumer_number')) {
      await conn.execute(`ALTER TABLE bill_payments ADD COLUMN consumer_number VARCHAR(100) NULL AFTER fetch_id`);
      console.log('   Added consumer_number column to bill_payments');
    }
    if (!await checkColumnExists('bill_payments', 'customer_name')) {
      await conn.execute(`ALTER TABLE bill_payments ADD COLUMN customer_name VARCHAR(150) NULL AFTER consumer_number`);
      console.log('   Added customer_name column to bill_payments');
    }
    if (!await checkColumnExists('bill_payments', 'payment_mode')) {
      await conn.execute(`ALTER TABLE bill_payments ADD COLUMN payment_mode VARCHAR(30) NOT NULL DEFAULT 'DEMO' AFTER amount`);
      console.log('   Added payment_mode column to bill_payments');
    }
    if (!await checkColumnExists('bill_payments', 'idempotency_key')) {
      await conn.execute(`ALTER TABLE bill_payments ADD COLUMN idempotency_key VARCHAR(255) NULL AFTER status`);
      console.log('   Added idempotency_key column to bill_payments');
    }
    if (!await checkColumnExists('bill_payments', 'failure_reason')) {
      await conn.execute(`ALTER TABLE bill_payments ADD COLUMN failure_reason VARCHAR(255) NULL AFTER idempotency_key`);
      console.log('   Added failure_reason column to bill_payments');
    }
    if (!await checkColumnExists('bill_payments', 'metadata')) {
      await conn.execute(`ALTER TABLE bill_payments ADD COLUMN metadata JSON NULL AFTER failure_reason`);
      console.log('   Added metadata column to bill_payments');
    }
    if (!await checkColumnExists('bill_payments', 'updated_at')) {
      await conn.execute(`ALTER TABLE bill_payments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at`);
      console.log('   Added updated_at column to bill_payments');
    }

    // 6. Create bill_favorites table
    console.log('5. Checking bill_favorites table...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS bill_favorites (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        biller_id BIGINT UNSIGNED NOT NULL,
        consumer_number VARCHAR(100) NOT NULL,
        nickname VARCHAR(100) NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_biller_consumer (user_id, biller_id, consumer_number),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (biller_id) REFERENCES billers(id),
        INDEX idx_fav_user (user_id, is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   bill_favorites table ready.');

    // 7. Create bill_payment_events table
    console.log('6. Checking bill_payment_events table...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS bill_payment_events (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        payment_id BIGINT UNSIGNED NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_status VARCHAR(30) NOT NULL,
        payload JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES bill_payments(id),
        INDEX idx_bpe_payment (payment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   bill_payment_events table ready.');

    // 8. Seed Categories
    console.log('7. Seeding 10 Required Bill Categories...');
    const categories = [
      {
        name: 'Electricity',
        key: 'electricity',
        desc: 'Pay electricity bills across state and private electricity distribution companies',
        icon: 'Zap',
        order: 1
      },
      {
        name: 'Water',
        key: 'water',
        desc: 'Pay municipal and state water utility and sewage charges',
        icon: 'Droplet',
        order: 2
      },
      {
        name: 'Gas',
        key: 'gas',
        desc: 'Book LPG gas cylinders and pay piped natural gas (PNG) bills',
        icon: 'Flame',
        order: 3
      },
      {
        name: 'DTH',
        key: 'dth',
        desc: 'Recharge satellite direct-to-home television connections',
        icon: 'Tv',
        order: 4
      },
      {
        name: 'Broadband',
        key: 'broadband',
        desc: 'Pay high-speed broadband and fiber internet bills',
        icon: 'Wifi',
        order: 5
      },
      {
        name: 'Landline',
        key: 'landline',
        desc: 'Pay landline telephone and postpaid fixed line bills',
        icon: 'PhoneCall',
        order: 6
      },
      {
        name: 'FASTag',
        key: 'fastag',
        desc: 'Recharge electronic toll collection FASTag accounts',
        icon: 'CreditCard',
        order: 7
      },
      {
        name: 'Insurance',
        key: 'insurance',
        desc: 'Pay life, health, and general insurance renewal premiums',
        icon: 'Shield',
        order: 8
      },
      {
        name: 'Loan Repayment',
        key: 'loan-repayment',
        desc: 'Pay personal, vehicle, and consumer durable loan EMIs',
        icon: 'Landmark',
        order: 9
      },
      {
        name: 'Municipal Taxes',
        key: 'municipal-taxes',
        desc: 'Pay municipal property tax, civic duties, and urban local body assessments',
        icon: 'Building',
        order: 10
      }
    ];

    for (const cat of categories) {
      const [existing] = await conn.execute(
        `SELECT id FROM bill_categories WHERE category_name = ? OR category_key = ? LIMIT 1`,
        [cat.name, cat.key]
      );

      if (existing.length === 0) {
        await conn.execute(
          `INSERT INTO bill_categories (category_name, category_key, description, icon, display_order, status)
           VALUES (?, ?, ?, ?, ?, 'active')`,
          [cat.name, cat.key, cat.desc, cat.icon, cat.order]
        );
        console.log(`   + Seeded category: ${cat.name}`);
      } else {
        await conn.execute(
          `UPDATE bill_categories 
           SET category_key = ?, description = ?, icon = ?, display_order = ?, status = 'active'
           WHERE id = ?`,
          [cat.key, cat.desc, cat.icon, cat.order, existing[0].id]
        );
      }
    }

    // 9. Fetch Category IDs for Billers Seeding
    const [allCats] = await conn.execute(`SELECT id, category_key FROM bill_categories`);
    const catMap = {};
    allCats.forEach(c => { catMap[c.category_key] = c.id; });

    // 10. Seed Realistic Demo Billers
    console.log('8. Seeding Realistic Demo Billers...');
    const billers = [
      // Electricity
      {
        categoryKey: 'electricity',
        name: 'MP Paschim Kshetra Vidyut Vitran Company (MPPKVVCL)',
        code: 'MPPKVVCL-W',
        paramName: 'Service Connection Number (IVRS)',
        placeholder: 'Enter 10-digit IVRS number (e.g. 1000234567)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: 'Find 10-digit IVRS consumer number on top-right of your MP electricity bill'
      },
      {
        categoryKey: 'electricity',
        name: 'MP Poorv Kshetra Vidyut Vitran Company (MPPKVVCL-JBP)',
        code: 'MPPKVVCL-E',
        paramName: 'Consumer Number',
        placeholder: 'Enter 10-digit consumer number (e.g. 2000543210)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit consumer number on your East MP bill statement'
      },
      {
        categoryKey: 'electricity',
        name: 'Tata Power - Mumbai & Delhi',
        code: 'TATAPOWER',
        paramName: 'Consumer Account Number (CA)',
        placeholder: 'Enter 11-digit CA number (e.g. 50001234567)',
        regex: '^[0-9]{11}$',
        minLen: 11,
        maxLen: 11,
        helpText: '11-digit Consumer Account (CA) number shown on Tata Power bill'
      },
      {
        categoryKey: 'electricity',
        name: 'Adani Electricity Mumbai Limited',
        code: 'ADANIELEC',
        paramName: 'Customer Account Number',
        placeholder: 'Enter 9-digit account number (e.g. 150123456)',
        regex: '^[0-9]{9}$',
        minLen: 9,
        maxLen: 9,
        helpText: '9-digit account number starting with 10 or 15'
      },
      {
        categoryKey: 'electricity',
        name: 'BSES Rajdhani Power Limited (Delhi)',
        code: 'BSES-RDL',
        paramName: 'Consumer Account (CA) Number',
        placeholder: 'Enter 9-digit CA number (e.g. 100123456)',
        regex: '^[0-9]{9}$',
        minLen: 9,
        maxLen: 9,
        helpText: '9-digit CA number displayed on top of BSES bill'
      },

      // Water
      {
        categoryKey: 'water',
        name: 'Delhi Jal Board (DJB)',
        code: 'DELHIJAL',
        paramName: 'K Number',
        placeholder: 'Enter 10-digit K Number (e.g. 1234567890)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit K Number printed on your DJB bill'
      },
      {
        categoryKey: 'water',
        name: 'Bangalore Water Supply & Sewerage Board (BWSSB)',
        code: 'BWSSB',
        paramName: 'Consumer RR Number',
        placeholder: 'Enter 8-digit Consumer RR Number',
        regex: '^[A-Za-z0-9]{6,10}$',
        minLen: 6,
        maxLen: 10,
        helpText: 'Consumer RR number on the water meter reading receipt'
      },
      {
        categoryKey: 'water',
        name: 'Indore Municipal Corporation - Water',
        code: 'IMC-WATER',
        paramName: 'Water Connection Number',
        placeholder: 'Enter 8-digit connection ID (e.g. 40123456)',
        regex: '^[0-9]{8}$',
        minLen: 8,
        maxLen: 8,
        helpText: '8-digit water connection number from Indore Nagar Nigam'
      },
      {
        categoryKey: 'water',
        name: 'Municipal Corporation of Greater Mumbai (MCGM Water)',
        code: 'MCGM-WATER',
        paramName: 'CCN (Computer Consumer Number)',
        placeholder: 'Enter 10-digit CCN (e.g. 3001234567)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit CCN code from BMC water tax bill'
      },

      // Gas
      {
        categoryKey: 'gas',
        name: 'Indane Gas (Indian Oil Corporation)',
        code: 'INDANE-LPG',
        paramName: '17-Digit LPG ID / Registered Mobile',
        placeholder: 'Enter 17-digit LPG ID or 10-digit Mobile',
        regex: '^([0-9]{10}|[0-9]{17})$',
        minLen: 10,
        maxLen: 17,
        helpText: '17-digit LPG ID printed in your Indane Blue Book / SV document'
      },
      {
        categoryKey: 'gas',
        name: 'Bharat Gas (BPCL LPG)',
        code: 'BHARAT-LPG',
        paramName: '17-Digit LPG ID / Consumer Number',
        placeholder: 'Enter 17-digit LPG ID or Consumer No',
        regex: '^([0-9]{6,10}|[0-9]{17})$',
        minLen: 6,
        maxLen: 17,
        helpText: '17-digit LPG ID from Bharat Gas subscription receipt'
      },
      {
        categoryKey: 'gas',
        name: 'HP Gas (Hindustan Petroleum)',
        code: 'HP-LPG',
        paramName: '17-Digit LPG ID / Registered Mobile',
        placeholder: 'Enter 17-digit LPG ID or Mobile',
        regex: '^([0-9]{10}|[0-9]{17})$',
        minLen: 10,
        maxLen: 17,
        helpText: '17-digit LPG ID printed on cash memo'
      },
      {
        categoryKey: 'gas',
        name: 'Indraprastha Gas Limited (IGL Piped Gas)',
        code: 'IGL-PNG',
        paramName: 'Business Partner (BP) Number',
        placeholder: 'Enter 10-digit BP Number (e.g. 4001234567)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit BP number on your IGL PNG monthly bill'
      },
      {
        categoryKey: 'gas',
        name: 'Mahanagar Gas Limited (MGL Mumbai)',
        code: 'MGL-PNG',
        paramName: 'CA Number',
        placeholder: 'Enter 12-digit CA Number (e.g. 200012345678)',
        regex: '^[0-9]{12}$',
        minLen: 12,
        maxLen: 12,
        helpText: '12-digit CA number printed on MGL gas bill'
      },

      // DTH
      {
        categoryKey: 'dth',
        name: 'Tata Play (Formerly Tata Sky)',
        code: 'TATAPLAY',
        paramName: 'Subscriber ID / Registered Mobile',
        placeholder: 'Enter 10-digit Subscriber ID or Mobile',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: 'Press yellow button on remote or enter 10-digit Subscriber ID'
      },
      {
        categoryKey: 'dth',
        name: 'Airtel Digital TV',
        code: 'AIRTEL-DTH',
        paramName: 'Customer ID',
        placeholder: 'Enter 10-digit Customer ID (e.g. 3001234567)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit Customer ID displayed on channel 998'
      },
      {
        categoryKey: 'dth',
        name: 'Dish TV India',
        code: 'DISHTV',
        paramName: 'Viewing Card (VC) Number',
        placeholder: 'Enter 11-digit VC number (e.g. 02512345678)',
        regex: '^[0-9]{11}$',
        minLen: 11,
        maxLen: 11,
        helpText: '11-digit VC number found under your set-top box'
      },
      {
        categoryKey: 'dth',
        name: 'Sun Direct DTH',
        code: 'SUNDIRECT',
        paramName: 'Smart Card Number (SMC)',
        placeholder: 'Enter 11-digit Smart Card Number',
        regex: '^[0-9]{11}$',
        minLen: 11,
        maxLen: 11,
        helpText: '11-digit SMC number from your Sun Direct viewing card'
      },

      // Broadband
      {
        categoryKey: 'broadband',
        name: 'Airtel Xstream Fiber Broadband',
        code: 'AIRTEL-BROADBAND',
        paramName: 'DSL / Landline ID with STD Code',
        placeholder: 'Enter DSL ID with STD (e.g. 01140501234)',
        regex: '^[0-9]{10,12}$',
        minLen: 10,
        maxLen: 12,
        helpText: 'DSL number including city STD code without 0'
      },
      {
        categoryKey: 'broadband',
        name: 'JioFiber Broadband',
        code: 'JIOFIBER',
        paramName: '12-Digit JioFiber Service ID',
        placeholder: 'Enter 12-digit Service ID (e.g. 400123456789)',
        regex: '^[0-9]{12}$',
        minLen: 12,
        maxLen: 12,
        helpText: '12-digit Service ID from MyJio app'
      },
      {
        categoryKey: 'broadband',
        name: 'BSNL Bharat Fiber (FTTH)',
        code: 'BSNL-FIBER',
        paramName: 'Telephone / Account Number with STD Code',
        placeholder: 'Enter phone with STD (e.g. 07312456789)',
        regex: '^[0-9]{10,11}$',
        minLen: 10,
        maxLen: 11,
        helpText: 'BSNL landline/fiber number with STD code'
      },
      {
        categoryKey: 'broadband',
        name: 'ACT Fibernet',
        code: 'ACT-FIBER',
        paramName: 'ACT Account Number / User ID',
        placeholder: 'Enter ACT Account Number (e.g. 10401234567)',
        regex: '^[A-Za-z0-9]{8,14}$',
        minLen: 8,
        maxLen: 14,
        helpText: 'Account number found on ACT monthly tax invoice'
      },

      // Landline
      {
        categoryKey: 'landline',
        name: 'BSNL Landline Corporate & Individual',
        code: 'BSNL-LANDLINE',
        paramName: 'Phone Number with STD Code (No leading 0)',
        placeholder: 'Enter STD+Phone (e.g. 7312456789)',
        regex: '^[0-9]{10,11}$',
        minLen: 10,
        maxLen: 11,
        helpText: '10 or 11 digit number including city code without leading zero'
      },
      {
        categoryKey: 'landline',
        name: 'Airtel Landline Postpaid',
        code: 'AIRTEL-LANDLINE',
        paramName: 'Landline Number with STD Code',
        placeholder: 'Enter 10-digit number (e.g. 01123456789)',
        regex: '^[0-9]{10,11}$',
        minLen: 10,
        maxLen: 11,
        helpText: 'Telephone number with local STD code'
      },
      {
        categoryKey: 'landline',
        name: 'MTNL Delhi - Landline',
        code: 'MTNL-DELHI',
        paramName: 'Telephone Number with CA Number',
        placeholder: 'Enter 8-digit telephone number (e.g. 23456789)',
        regex: '^[0-9]{8}$',
        minLen: 8,
        maxLen: 8,
        helpText: '8-digit MTNL Delhi phone number'
      },

      // FASTag
      {
        categoryKey: 'fastag',
        name: 'ICICI Bank FASTag Recharge',
        code: 'ICICI-FASTAG',
        paramName: 'Vehicle Registration Number',
        placeholder: 'Enter vehicle number (e.g. MP09AB1234)',
        regex: '^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$',
        minLen: 8,
        maxLen: 11,
        helpText: 'Standard vehicle number without spaces (e.g. MH02CD5678)'
      },
      {
        categoryKey: 'fastag',
        name: 'State Bank of India (SBI) FASTag',
        code: 'SBI-FASTAG',
        paramName: 'Vehicle Registration Number',
        placeholder: 'Enter vehicle number (e.g. DL01AB9999)',
        regex: '^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$',
        minLen: 8,
        maxLen: 11,
        helpText: 'Vehicle registration plate number as registered with FASTag'
      },
      {
        categoryKey: 'fastag',
        name: 'HDFC Bank FASTag',
        code: 'HDFC-FASTAG',
        paramName: 'Vehicle Registration Number',
        placeholder: 'Enter vehicle number (e.g. KA05MN1234)',
        regex: '^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$',
        minLen: 8,
        maxLen: 11,
        helpText: 'Enter vehicle registration number without spaces'
      },
      {
        categoryKey: 'fastag',
        name: 'Paytm Payments Bank FASTag',
        code: 'PAYTM-FASTAG',
        paramName: 'Vehicle Registration Number',
        placeholder: 'Enter vehicle number (e.g. UP16XY4321)',
        regex: '^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$',
        minLen: 8,
        maxLen: 11,
        helpText: 'Vehicle registration number linked to Paytm FASTag'
      },

      // Insurance
      {
        categoryKey: 'insurance',
        name: 'Life Insurance Corporation of India (LIC)',
        code: 'LIC-PREMIUM',
        paramName: 'Policy Number',
        placeholder: 'Enter 9-digit policy number (e.g. 123456789)',
        regex: '^[0-9]{9}$',
        minLen: 9,
        maxLen: 9,
        helpText: '9-digit LIC policy number without slashes or spaces'
      },
      {
        categoryKey: 'insurance',
        name: 'HDFC Life Insurance',
        code: 'HDFC-LIFE',
        paramName: '8-Digit Policy Number',
        placeholder: 'Enter policy number (e.g. 18012345)',
        regex: '^[0-9]{8}$',
        minLen: 8,
        maxLen: 8,
        helpText: '8-digit policy number on premium notice'
      },
      {
        categoryKey: 'insurance',
        name: 'ICICI Prudential Life Insurance',
        code: 'ICICI-PRU',
        paramName: 'Policy Number',
        placeholder: 'Enter 8-digit policy number (e.g. 21012345)',
        regex: '^[0-9]{8}$',
        minLen: 8,
        maxLen: 8,
        helpText: '8-digit policy number on your schedule'
      },
      {
        categoryKey: 'insurance',
        name: 'SBI Life Insurance',
        code: 'SBI-LIFE',
        paramName: 'Policy Number',
        placeholder: 'Enter 9-digit policy number (e.g. 500123456)',
        regex: '^[0-9]{9}$',
        minLen: 9,
        maxLen: 9,
        helpText: '9-digit policy number on SBI Life certificate'
      },

      // Loan Repayment
      {
        categoryKey: 'loan-repayment',
        name: 'Bajaj Finance Limited',
        code: 'BAJAJ-FIN',
        paramName: 'Loan Account Number (LAN)',
        placeholder: 'Enter 10-15 character LAN (e.g. L3W12345678)',
        regex: '^[A-Za-z0-9]{8,16}$',
        minLen: 8,
        maxLen: 16,
        helpText: 'Loan Account Number from EMI card or welcome letter'
      },
      {
        categoryKey: 'loan-repayment',
        name: 'Home Credit India',
        code: 'HOMECREDIT',
        paramName: 'Contract Number',
        placeholder: 'Enter 10-digit Contract Number (e.g. 3001234567)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit contract number on Home Credit loan agreement'
      },
      {
        categoryKey: 'loan-repayment',
        name: 'Muthoot Finance Loan Repayment',
        code: 'MUTHOOT',
        paramName: 'Gold / Personal Loan Account Number',
        placeholder: 'Enter Account Number (e.g. GML00123456)',
        regex: '^[A-Za-z0-9]{8,18}$',
        minLen: 8,
        maxLen: 18,
        helpText: 'Account number printed on Muthoot loan receipt token'
      },
      {
        categoryKey: 'loan-repayment',
        name: 'Tata Capital Financial Services',
        code: 'TATACAP',
        paramName: 'Loan Agreement Number',
        placeholder: 'Enter 8-12 character Agreement ID',
        regex: '^[A-Za-z0-9]{8,14}$',
        minLen: 8,
        maxLen: 14,
        helpText: 'Agreement number found on Tata Capital sanction letter'
      },

      // Municipal Taxes
      {
        categoryKey: 'municipal-taxes',
        name: 'Municipal Corporation of Delhi (MCD Property Tax)',
        code: 'MCD-TAX',
        paramName: 'Property UPIC / Property ID',
        placeholder: 'Enter 10-character UPIC (e.g. DEL1234567)',
        regex: '^[A-Za-z0-9]{6,12}$',
        minLen: 6,
        maxLen: 12,
        helpText: 'Unique Property Identification Code (UPIC) from previous tax receipt'
      },
      {
        categoryKey: 'municipal-taxes',
        name: 'Greater Hyderabad Municipal Corporation (GHMC Property Tax)',
        code: 'GHMC-TAX',
        paramName: 'Property Tax Index Number (PTIN)',
        placeholder: 'Enter 10-digit PTIN (e.g. 1012345678)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: '10-digit PTIN assigned by GHMC'
      },
      {
        categoryKey: 'municipal-taxes',
        name: 'Bruhat Bengaluru Mahanagara Palike (BBMP Property Tax)',
        code: 'BBMP-TAX',
        paramName: 'Application Number / SAS Number',
        placeholder: 'Enter 10-digit SAS number (e.g. 5001234567)',
        regex: '^[0-9]{10}$',
        minLen: 10,
        maxLen: 10,
        helpText: 'SAS application number from last year BBMP property receipt'
      }
    ];

    for (const b of billers) {
      const catId = catMap[b.categoryKey];
      if (!catId) {
        console.warn(`   ! Category key "${b.categoryKey}" not found in catMap, skipping biller "${b.name}"`);
        continue;
      }

      const [existing] = await conn.execute(
        `SELECT id FROM billers WHERE biller_code = ? LIMIT 1`,
        [b.code]
      );

      if (existing.length === 0) {
        await conn.execute(
          `INSERT INTO billers (category_id, biller_name, biller_code, param_name, param_placeholder, param_regex, param_min_length, param_max_length, param_help_text, is_demo, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'active')`,
          [
            catId,
            b.name,
            b.code,
            b.paramName,
            b.placeholder,
            b.regex,
            b.minLen,
            b.maxLen,
            b.helpText
          ]
        );
        console.log(`   + Seeded biller: [${b.code}] ${b.name}`);
      } else {
        await conn.execute(
          `UPDATE billers 
           SET category_id = ?, biller_name = ?, param_name = ?, param_placeholder = ?, param_regex = ?, param_min_length = ?, param_max_length = ?, param_help_text = ?, is_demo = TRUE, status = 'active'
           WHERE id = ?`,
          [
            catId,
            b.name,
            b.paramName,
            b.placeholder,
            b.regex,
            b.minLen,
            b.maxLen,
            b.helpText,
            existing[0].id
          ]
        );
      }
    }

    await conn.commit();
    console.log('--- Bill Payments Database Migration Completed Successfully! ---');
  } catch (error) {
    await conn.rollback();
    console.error('Migration failed:', error);
    throw error;
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  migrateBillPayments()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = migrateBillPayments;
