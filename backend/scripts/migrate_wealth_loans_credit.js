const db = require('../config/db');

async function migrate() {
  console.log("Starting Wealth, Loans, and Credit Score migration...");

  // 1. Upgrade sip_products
  console.log("1. Checking sip_products schema...");
  try {
    const [cols] = await db.execute("DESCRIBE sip_products");
    const fields = cols.map(c => c.Field);
    if (!fields.includes("category")) {
      await db.execute("ALTER TABLE sip_products ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'Equity' AFTER product_name");
      console.log(" - Added category to sip_products");
    }
    if (!fields.includes("current_nav")) {
      await db.execute("ALTER TABLE sip_products ADD COLUMN current_nav DECIMAL(10,2) NOT NULL DEFAULT 42.50 AFTER risk_level");
      console.log(" - Added current_nav to sip_products");
    }
    if (!fields.includes("returns_1yr")) {
      await db.execute("ALTER TABLE sip_products ADD COLUMN returns_1yr DECIMAL(5,2) NOT NULL DEFAULT 15.80 AFTER current_nav");
      console.log(" - Added returns_1yr to sip_products");
    }
    if (!fields.includes("returns_3yr")) {
      await db.execute("ALTER TABLE sip_products ADD COLUMN returns_3yr DECIMAL(5,2) NOT NULL DEFAULT 22.40 AFTER returns_1yr");
      console.log(" - Added returns_3yr to sip_products");
    }
    if (!fields.includes("aum")) {
      await db.execute("ALTER TABLE sip_products ADD COLUMN aum DECIMAL(19,4) NOT NULL DEFAULT 25000000.00 AFTER minimum_investment");
      console.log(" - Added aum to sip_products");
    }
    if (!fields.includes("expense_ratio")) {
      await db.execute("ALTER TABLE sip_products ADD COLUMN expense_ratio DECIMAL(4,2) NOT NULL DEFAULT 0.75 AFTER aum");
      console.log(" - Added expense_ratio to sip_products");
    }

    // Update existing products with realistic financial metadata
    await db.execute(`
      UPDATE sip_products SET 
        category = 'Equity Large Cap', current_nav = 68.45, returns_1yr = 18.2, returns_3yr = 24.6, aum = 42500000.00, expense_ratio = 0.65 
      WHERE id = 1
    `);
    await db.execute(`
      UPDATE sip_products SET 
        category = 'Equity Bluechip', current_nav = 84.10, returns_1yr = 16.5, returns_3yr = 21.8, aum = 38000000.00, expense_ratio = 0.72 
      WHERE id = 2
    `);
    await db.execute(`
      UPDATE sip_products SET 
        category = 'Sectoral Tech', current_nav = 142.30, returns_1yr = 28.4, returns_3yr = 32.1, aum = 18500000.00, expense_ratio = 0.88 
      WHERE id = 3
    `);
    await db.execute(`
      UPDATE sip_products SET 
        category = 'Equity Small Cap', current_nav = 96.75, returns_1yr = 31.2, returns_3yr = 38.5, aum = 29000000.00, expense_ratio = 0.95 
      WHERE id = 4
    `);
    await db.execute(`
      UPDATE sip_products SET 
        category = 'Flexi Cap', current_nav = 62.80, returns_1yr = 22.1, returns_3yr = 27.9, aum = 51200000.00, expense_ratio = 0.78 
      WHERE id = 5
    `);
    console.log(" - Updated sip_products with realistic NAV, category & returns");
  } catch (err) {
    console.error("Error upgrading sip_products:", err.message);
  }

  // 2. Seed sip_transactions & investment_orders if empty
  console.log("2. Checking sip_transactions & investment_orders...");
  try {
    const [txCount] = await db.execute("SELECT COUNT(*) AS cnt FROM sip_transactions");
    if (txCount[0].cnt === 0) {
      await db.execute(`
        INSERT INTO sip_transactions (user_id, sip_plan_id, installment_id, amount, transaction_reference, provider_reference, payment_method, status, paid_at, created_at)
        VALUES 
        (1, 2, 1, 5000.00, 'TXN-SIP-1001', 'BSE-MF-88912', 'UPI AutoPay', 'success', '2026-11-08 06:15:00', '2026-11-08 06:10:00'),
        (2, 3, 2, 2500.00, 'TXN-SIP-1002', 'BSE-MF-88913', 'e-NACH Mandate', 'success', '2026-10-24 07:20:00', '2026-10-24 07:15:00'),
        (4, 4, 3, 10000.00, 'TXN-SIP-1003', 'BSE-MF-88914', 'NetBanking Mandate', 'success', '2026-09-24 08:30:00', '2026-09-24 08:25:00'),
        (1, 1, 4, 1000.00, 'TXN-SIP-1004', 'BSE-MF-88915', 'UPI AutoPay', 'failed', NULL, '2026-11-14 09:00:00'),
        (2, 3, 5, 2500.00, 'TXN-SIP-1005', 'BSE-MF-88916', 'e-NACH Mandate', 'success', '2026-11-24 05:45:00', '2026-11-24 05:40:00')
      `);
      console.log(" - Seeded sip_transactions");
    }

    const [orderCount] = await db.execute("SELECT COUNT(*) AS cnt FROM investment_orders");
    if (orderCount[0].cnt === 0) {
      await db.execute(`
        INSERT INTO investment_orders (user_id, product_id, sip_plan_id, installment_id, order_reference, order_type, amount, nav, units, status, provider_order_id, created_at)
        VALUES 
        (1, 1, 2, 1, 'ORD-MF-7701', 'sip_installment', 5000.00, 68.45, 73.046, 'completed', 'AMC-HDFC-991', '2026-11-08 06:15:00'),
        (2, 1, 3, 2, 'ORD-MF-7702', 'sip_installment', 2500.00, 68.45, 36.523, 'completed', 'AMC-HDFC-992', '2026-10-24 07:20:00'),
        (4, 1, 4, 3, 'ORD-MF-7703', 'sip_installment', 10000.00, 68.45, 146.092, 'completed', 'AMC-HDFC-993', '2026-09-24 08:30:00'),
        (1, 3, NULL, NULL, 'ORD-MF-7704', 'lumpsum', 25000.00, 142.30, 175.685, 'completed', 'AMC-ICICI-441', '2026-11-12 11:30:00'),
        (6, 4, NULL, NULL, 'ORD-MF-7705', 'lumpsum', 15000.00, 96.75, 155.038, 'completed', 'AMC-AXIS-552', '2026-11-18 14:15:00'),
        (7, 5, NULL, NULL, 'ORD-MF-7706', 'redemption', 8000.00, 62.80, 127.388, 'processing', 'AMC-PPFAS-661', '2026-11-23 16:00:00')
      `);
      console.log(" - Seeded investment_orders");
    }
  } catch (err) {
    console.error("Error seeding transactions/orders:", err.message);
  }

  // 3. Create Loan Tables: loan_products, loan_applications, loan_repayments, lender_partners
  console.log("3. Creating Loan tables...");
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS lender_partners (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        partner_id VARCHAR(50) NOT NULL UNIQUE,
        lender_name VARCHAR(150) NOT NULL,
        partner_type VARCHAR(50) NOT NULL DEFAULT 'Bank',
        api_status VARCHAR(30) NOT NULL DEFAULT 'Online',
        integration_type VARCHAR(50) NOT NULL DEFAULT 'Direct API',
        success_rate DECIMAL(5,2) NOT NULL DEFAULT 98.50,
        active_products_count INT NOT NULL DEFAULT 3,
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        last_sync_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [lenderCount] = await db.execute("SELECT COUNT(*) AS cnt FROM lender_partners");
    if (lenderCount[0].cnt === 0) {
      await db.execute(`
        INSERT INTO lender_partners (partner_id, lender_name, partner_type, api_status, integration_type, success_rate, active_products_count, status, last_sync_at)
        VALUES 
        ('LP-HDFC', 'HDFC Bank Ltd', 'Scheduled Commercial Bank', 'Online', 'REST v2 API', 99.40, 4, 'active', NOW()),
        ('LP-ICICI', 'ICICI Bank Ltd', 'Scheduled Commercial Bank', 'Online', 'Open Banking API', 98.90, 3, 'active', NOW()),
        ('LP-SBI', 'State Bank of India', 'Public Sector Bank', 'Online', 'Direct CBS Connect', 97.50, 4, 'active', NOW()),
        ('LP-BAJAJ', 'Bajaj Finserv Ltd', 'NBFC - Upper Layer', 'Online', 'Instant e-KYC Loan Gateway', 99.10, 5, 'active', NOW()),
        ('LP-TATA', 'Tata Capital Financial Services', 'NBFC - Upper Layer', 'Degraded', 'REST Webhook v1', 94.20, 3, 'active', NOW()),
        ('LP-MUTHOOT', 'Muthoot Finance Ltd', 'NBFC - Gold Loan', 'Online', 'Gold Vault API', 99.80, 2, 'active', NOW())
      `);
      console.log(" - Seeded lender_partners");
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS loan_products (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        product_code VARCHAR(50) NOT NULL UNIQUE,
        loan_name VARCHAR(150) NOT NULL,
        loan_type VARCHAR(50) NOT NULL,
        lender_name VARCHAR(150) NOT NULL,
        min_amount DECIMAL(19,4) NOT NULL DEFAULT 10000.00,
        max_amount DECIMAL(19,4) NOT NULL DEFAULT 5000000.00,
        interest_rate_min DECIMAL(5,2) NOT NULL DEFAULT 10.50,
        interest_rate_max DECIMAL(5,2) NOT NULL DEFAULT 18.00,
        max_tenure_months INT NOT NULL DEFAULT 60,
        eligibility_criteria VARCHAR(255) NOT NULL DEFAULT 'Age 21-58, Min Salaried ₹25k/mo or ITR > ₹3.5L',
        processing_fee_pct DECIMAL(4,2) NOT NULL DEFAULT 1.50,
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [loanProdCount] = await db.execute("SELECT COUNT(*) AS cnt FROM loan_products");
    if (loanProdCount[0].cnt === 0) {
      await db.execute(`
        INSERT INTO loan_products (product_code, loan_name, loan_type, lender_name, min_amount, max_amount, interest_rate_min, interest_rate_max, max_tenure_months, eligibility_criteria, processing_fee_pct, status)
        VALUES 
        ('LN-PR-01', 'Instant Salaried Personal Loan', 'Personal Loan', 'HDFC Bank Ltd', 25000.00, 1500000.00, 10.50, 15.50, 60, 'Salaried individuals, Min salary ₹30k/mo, CIBIL 720+', 1.50, 'active'),
        ('LN-PR-02', 'SME Business Growth Loan', 'Business Loan', 'Bajaj Finserv Ltd', 100000.00, 4000000.00, 12.00, 18.00, 48, 'GST Registered Business with 2+ years vintage, ITR > ₹5L', 2.00, 'active'),
        ('LN-PR-03', 'Prime Advantage Home Loan', 'Home Loan', 'State Bank of India', 500000.00, 10000000.00, 8.40, 9.80, 240, 'Resident Indian with stable income, Approved Property', 0.50, 'active'),
        ('LN-PR-04', 'Global Future Education Loan', 'Education Loan', 'ICICI Bank Ltd', 100000.00, 5000000.00, 9.25, 11.50, 120, 'Secured admission in approved Indian/Foreign university', 1.00, 'active'),
        ('LN-PR-05', 'Express Four-Wheeler Auto Loan', 'Vehicle Loan', 'Tata Capital Financial Services', 150000.00, 2500000.00, 8.75, 12.00, 84, 'Proof of income, Down payment 10-15%', 1.25, 'active'),
        ('LN-PR-06', 'Quick Gold Vault Loan', 'Gold Loan', 'Muthoot Finance Ltd', 10000.00, 2000000.00, 8.90, 14.00, 24, '18-24K Gold jewellery physical pledge', 0.50, 'active')
      `);
      console.log(" - Seeded loan_products");
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS loan_applications (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        application_reference VARCHAR(60) NOT NULL UNIQUE,
        user_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NULL,
        applicant_name VARCHAR(150) NOT NULL,
        applicant_email VARCHAR(150) NULL,
        applicant_phone VARCHAR(20) NULL,
        loan_type VARCHAR(50) NOT NULL,
        requested_amount DECIMAL(19,4) NOT NULL,
        approved_amount DECIMAL(19,4) NULL,
        interest_rate DECIMAL(5,2) NULL,
        tenure_months INT NOT NULL,
        emi_amount DECIMAL(19,4) NULL,
        lender_name VARCHAR(150) NOT NULL,
        application_status ENUM('Applied', 'Under Review', 'Documents Required', 'Approved', 'Rejected', 'Disbursed', 'Closed') NOT NULL DEFAULT 'Applied',
        document_status VARCHAR(50) NOT NULL DEFAULT 'Verified',
        disbursement_date DATETIME NULL,
        outstanding_balance DECIMAL(19,4) NULL,
        rejection_reason VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [appCount] = await db.execute("SELECT COUNT(*) AS cnt FROM loan_applications");
    if (appCount[0].cnt === 0) {
      await db.execute(`
        INSERT INTO loan_applications (application_reference, user_id, product_id, applicant_name, applicant_email, applicant_phone, loan_type, requested_amount, approved_amount, interest_rate, tenure_months, emi_amount, lender_name, application_status, document_status, disbursement_date, outstanding_balance, created_at)
        VALUES 
        ('LN-APP-8801', 1, 1, 'Rahul Sharma', 'rahul@example.com', '9876543210', 'Personal Loan', 350000.00, 350000.00, 11.50, 36, 11540.00, 'HDFC Bank Ltd', 'Disbursed', 'Verified', '2026-08-15 10:30:00', 285400.00, '2026-08-10 09:15:00'),
        ('LN-APP-8802', 2, 2, 'Amit Kumar Verma', 'amit.verma@example.com', '+919876543210', 'Business Loan', 1200000.00, 1200000.00, 13.00, 48, 32200.00, 'Bajaj Finserv Ltd', 'Disbursed', 'Verified', '2026-09-01 12:00:00', 1045000.00, '2026-08-25 11:20:00'),
        ('LN-APP-8803', 3, 3, 'Sunita Devi Sharma', 'sunita.sharma@example.com', '+919123456789', 'Home Loan', 4500000.00, 4200000.00, 8.50, 180, 41420.00, 'State Bank of India', 'Approved', 'Verified', NULL, 4200000.00, '2026-11-15 14:00:00'),
        ('LN-APP-8804', 4, 1, 'Rahul Mehra', 'rahul.mehra@example.com', '+919822012345', 'Personal Loan', 200000.00, NULL, NULL, 24, NULL, 'HDFC Bank Ltd', 'Under Review', 'Pending Verification', NULL, NULL, '2026-11-20 16:30:00'),
        ('LN-APP-8805', 5, 5, 'Deepak Kumar', 'deepak.kumar@example.com', '+919456789012', 'Vehicle Loan', 650000.00, 600000.00, 9.20, 60, 12515.00, 'Tata Capital Financial Services', 'Disbursed', 'Verified', '2026-10-10 11:00:00', 562000.00, '2026-10-05 10:00:00'),
        ('LN-APP-8806', 6, 4, 'Priya Patel', 'priya.patel@example.com', '+919988776655', 'Education Loan', 1800000.00, NULL, NULL, 84, NULL, 'ICICI Bank Ltd', 'Documents Required', 'Awaiting Marksheets & I20', NULL, NULL, '2026-11-22 09:45:00'),
        ('LN-APP-8807', 7, 6, 'Manshi', 'manshigupta2103@gmail.com', '9981280069', 'Gold Loan', 150000.00, 150000.00, 9.00, 12, 13120.00, 'Muthoot Finance Ltd', 'Closed', 'Verified', '2025-11-01 15:00:00', 0.00, '2025-10-28 14:00:00'),
        ('LN-APP-8808', 9, 1, 'Gopal Parmar', 'gopalper8602@gmail.com', '8602612434', 'Personal Loan', 500000.00, NULL, NULL, 36, NULL, 'HDFC Bank Ltd', 'Applied', 'Submitted', NULL, NULL, '2026-11-23 18:20:00')
      `);
      console.log(" - Seeded loan_applications");
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS loan_repayments (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        loan_application_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        installment_number INT NOT NULL,
        emi_amount DECIMAL(19,4) NOT NULL,
        principal_amount DECIMAL(19,4) NOT NULL,
        interest_amount DECIMAL(19,4) NOT NULL,
        due_date DATE NOT NULL,
        paid_date DATETIME NULL,
        payment_mode VARCHAR(50) NULL,
        reference_id VARCHAR(80) NULL,
        status ENUM('paid', 'upcoming', 'overdue') NOT NULL DEFAULT 'upcoming',
        penalty_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [repayCount] = await db.execute("SELECT COUNT(*) AS cnt FROM loan_repayments");
    if (repayCount[0].cnt === 0) {
      await db.execute(`
        INSERT INTO loan_repayments (loan_application_id, user_id, installment_number, emi_amount, principal_amount, interest_amount, due_date, paid_date, payment_mode, reference_id, status, penalty_amount)
        VALUES 
        (1, 1, 1, 11540.00, 8185.00, 3355.00, '2026-09-15', '2026-09-14 10:20:00', 'e-NACH AutoDebit', 'EMI-HDFC-9901', 'paid', 0.00),
        (1, 1, 2, 11540.00, 8263.00, 3277.00, '2026-10-15', '2026-10-15 08:00:00', 'e-NACH AutoDebit', 'EMI-HDFC-9902', 'paid', 0.00),
        (1, 1, 3, 11540.00, 8342.00, 3198.00, '2026-11-15', '2026-11-15 09:15:00', 'e-NACH AutoDebit', 'EMI-HDFC-9903', 'paid', 0.00),
        (1, 1, 4, 11540.00, 8422.00, 3118.00, '2026-12-15', NULL, NULL, NULL, 'upcoming', 0.00),
        (2, 2, 1, 32200.00, 19200.00, 13000.00, '2026-10-01', '2026-10-01 11:30:00', 'NetBanking RTGS', 'EMI-BAJAJ-771', 'paid', 0.00),
        (2, 2, 2, 32200.00, 19400.00, 12800.00, '2026-11-01', '2026-11-01 14:10:00', 'NetBanking RTGS', 'EMI-BAJAJ-772', 'paid', 0.00),
        (2, 2, 3, 32200.00, 19610.00, 12590.00, '2026-12-01', NULL, NULL, NULL, 'upcoming', 0.00),
        (5, 5, 1, 12515.00, 7915.00, 4600.00, '2026-11-10', '2026-11-10 16:45:00', 'UPI AutoDebit', 'EMI-TATA-551', 'paid', 0.00),
        (5, 5, 2, 12515.00, 7975.00, 4540.00, '2026-12-10', NULL, NULL, NULL, 'upcoming', 0.00)
      `);
      console.log(" - Seeded loan_repayments");
    }
  } catch (err) {
    console.error("Error creating loan tables:", err.message);
  }

  // 4. Create Credit Score Tables: credit_score_requests, credit_score_history, credit_bureau_partners
  console.log("4. Creating Credit Score tables...");
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS credit_bureau_partners (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        bureau_name VARCHAR(100) NOT NULL UNIQUE,
        bureau_code VARCHAR(30) NOT NULL UNIQUE,
        api_status VARCHAR(30) NOT NULL DEFAULT 'Online',
        last_sync_at DATETIME NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        total_queries INT NOT NULL DEFAULT 0,
        success_rate DECIMAL(5,2) NOT NULL DEFAULT 99.20,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [bureauCount] = await db.execute("SELECT COUNT(*) AS cnt FROM credit_bureau_partners");
    if (bureauCount[0].cnt === 0) {
      await db.execute(`
        INSERT INTO credit_bureau_partners (bureau_name, bureau_code, api_status, last_sync_at, status, total_queries, success_rate)
        VALUES 
        ('TransUnion CIBIL', 'CIBIL', 'Online', NOW(), 'active', 4280, 99.60),
        ('Experian India', 'EXPERIAN', 'Online', NOW(), 'active', 3150, 99.20),
        ('CRIF High Mark', 'CRIF', 'Online', NOW(), 'active', 1890, 98.70),
        ('Equifax India', 'EQUIFAX', 'Online', NOW(), 'active', 1240, 98.40)
      `);
      console.log(" - Seeded credit_bureau_partners");
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS credit_score_requests (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        request_reference VARCHAR(60) NOT NULL UNIQUE,
        user_id BIGINT UNSIGNED NOT NULL,
        customer_name VARCHAR(150) NOT NULL,
        pan_number VARCHAR(20) NOT NULL,
        credit_bureau ENUM('CIBIL', 'Experian', 'CRIF High Mark', 'Equifax') NOT NULL DEFAULT 'CIBIL',
        credit_score INT NULL,
        score_category VARCHAR(30) NULL,
        report_date DATE NOT NULL,
        consent_status ENUM('Consented', 'Revoked') NOT NULL DEFAULT 'Consented',
        request_status ENUM('Successful', 'Pending', 'Failed') NOT NULL DEFAULT 'Successful',
        failure_reason VARCHAR(255) NULL,
        payment_history_pct DECIMAL(5,2) NULL,
        credit_utilization_pct DECIMAL(5,2) NULL,
        active_accounts INT NULL,
        outstanding_balance DECIMAL(19,4) NULL,
        total_enquiries INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [scoreCount] = await db.execute("SELECT COUNT(*) AS cnt FROM credit_score_requests");
    if (scoreCount[0].cnt === 0) {
      await db.execute(`
        INSERT INTO credit_score_requests (request_reference, user_id, customer_name, pan_number, credit_bureau, credit_score, score_category, report_date, consent_status, request_status, payment_history_pct, credit_utilization_pct, active_accounts, outstanding_balance, total_enquiries, created_at)
        VALUES 
        ('CR-REQ-901', 1, 'Rahul Sharma', 'ABCPS1234F', 'CIBIL', 785, 'Excellent', '2026-11-20', 'Consented', 'Successful', 99.20, 24.50, 6, 285400.00, 3, '2026-11-20 10:00:00'),
        ('CR-REQ-902', 2, 'Amit Kumar Verma', 'BKVPA5678K', 'Experian', 742, 'Good', '2026-11-18', 'Consented', 'Successful', 97.50, 38.00, 8, 1045000.00, 5, '2026-11-18 11:30:00'),
        ('CR-REQ-903', 3, 'Sunita Devi Sharma', 'CWXPS9988D', 'CIBIL', 810, 'Excellent', '2026-11-15', 'Consented', 'Successful', 100.00, 12.00, 4, 4200000.00, 1, '2026-11-15 14:15:00'),
        ('CR-REQ-904', 4, 'Rahul Mehra', 'DMZPM1122L', 'CRIF High Mark', 680, 'Fair', '2026-11-22', 'Consented', 'Successful', 91.00, 54.00, 5, 185000.00, 7, '2026-11-22 12:45:00'),
        ('CR-REQ-905', 5, 'Deepak Kumar', 'EPTPS3344P', 'Equifax', 725, 'Good', '2026-10-10', 'Consented', 'Successful', 96.00, 32.50, 7, 562000.00, 4, '2026-10-10 09:30:00'),
        ('CR-REQ-906', 6, 'Priya Patel', 'FKZPP5566R', 'CIBIL', 760, 'Good', '2026-11-21', 'Consented', 'Successful', 98.40, 28.00, 3, 45000.00, 2, '2026-11-21 15:20:00'),
        ('CR-REQ-907', 7, 'Manshi', 'GTYPG7788M', 'Experian', 795, 'Excellent', '2026-11-23', 'Consented', 'Successful', 100.00, 18.20, 4, 0.00, 2, '2026-11-23 16:10:00'),
        ('CR-REQ-908', 9, 'Gopal Parmar', 'HPZPG9900Q', 'CIBIL', 710, 'Good', '2026-11-24', 'Consented', 'Successful', 94.00, 42.00, 6, 210000.00, 6, '2026-11-24 08:30:00')
      `);
      console.log(" - Seeded credit_score_requests");
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS credit_score_history (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        customer_name VARCHAR(150) NOT NULL,
        credit_bureau VARCHAR(50) NOT NULL,
        current_score INT NOT NULL,
        previous_score INT NOT NULL,
        score_change INT NOT NULL,
        report_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [histCount] = await db.execute("SELECT COUNT(*) AS cnt FROM credit_score_history");
    if (histCount[0].cnt === 0) {
      await db.execute(`
        INSERT INTO credit_score_history (user_id, customer_name, credit_bureau, current_score, previous_score, score_change, report_date)
        VALUES 
        (1, 'Rahul Sharma', 'CIBIL', 785, 770, 15, '2026-11-20'),
        (1, 'Rahul Sharma', 'CIBIL', 770, 755, 15, '2026-08-15'),
        (2, 'Amit Kumar Verma', 'Experian', 742, 735, 7, '2026-11-18'),
        (2, 'Amit Kumar Verma', 'Experian', 735, 745, -10, '2026-09-01'),
        (3, 'Sunita Devi Sharma', 'CIBIL', 810, 805, 5, '2026-11-15'),
        (4, 'Rahul Mehra', 'CRIF High Mark', 680, 695, -15, '2026-11-22'),
        (5, 'Deepak Kumar', 'Equifax', 725, 715, 10, '2026-10-10'),
        (7, 'Manshi', 'Experian', 795, 780, 15, '2026-11-23'),
        (9, 'Gopal Parmar', 'CIBIL', 710, 700, 10, '2026-11-24')
      `);
      console.log(" - Seeded credit_score_history");
    }
  } catch (err) {
    console.error("Error creating credit tables:", err.message);
  }

  console.log("Migration completed successfully!");
}

migrate()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Fatal migration error:", e);
    process.exit(1);
  });
