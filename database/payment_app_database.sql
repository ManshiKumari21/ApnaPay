CREATE DATABASE IF NOT EXISTS payment_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE payment_app;

-- =====================================================
-- 1. AUTHENTICATION & KYC (6 TABLES)
-- =====================================================

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  gender VARCHAR(20) NULL,
  email_verified_at DATETIME NULL,
  phone_verified_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  date_of_birth DATE NULL,
  address TEXT NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  postal_code VARCHAR(15) NULL,
  profile_image_url VARCHAR(500) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE otp_verifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  phone VARCHAR(20) NULL,
  email VARCHAR(255) NULL,
  otp_hash VARCHAR(255) NOT NULL,
  purpose VARCHAR(40) NOT NULL,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_otp_phone (phone, purpose, expires_at)
);

CREATE TABLE sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_session_user (user_id, expires_at)
);

CREATE TABLE kyc_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  status VARCHAR(30) NULL,
  provider_reference VARCHAR(150) NULL,
  verified_at DATETIME NULL,
  rejection_reason VARCHAR(255) NULL,
  remarks VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_kyc_user_status (user_id, verification_status)
);

CREATE TABLE kyc_documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kyc_record_id BIGINT UNSIGNED NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  secure_storage_key VARCHAR(500) NOT NULL,
  document_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kyc_record_id) REFERENCES kyc_records(id)
);

CREATE TABLE IF NOT EXISTS kyc_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kyc_record_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(50) NOT NULL,
  previous_status VARCHAR(50) NULL,
  new_status VARCHAR(50) NOT NULL,
  remarks TEXT NULL,
  admin_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kyc_record_id) REFERENCES kyc_records(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_kyc_history_record (kyc_record_id)
);

-- =====================================================
-- 2. BANK ACCOUNTS, UPI & PROVIDERS (4 TABLES)
-- =====================================================

CREATE TABLE payment_providers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_name VARCHAR(100) NOT NULL,
  provider_type VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bank_accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NULL,
  bank_name VARCHAR(120) NOT NULL,
  account_number_encrypted VARBINARY(512) NULL,
  account_last4 CHAR(4) NULL,
  ifsc_code VARCHAR(11) NULL,
  account_holder_name VARCHAR(120) NULL,
  provider_token VARCHAR(255) NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id),
  INDEX idx_bank_user (user_id, status)
);

CREATE TABLE upi_handles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  bank_account_id BIGINT UNSIGNED NULL,
  upi_id VARCHAR(255) NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
);

CREATE TABLE provider_webhook_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id BIGINT UNSIGNED NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  processing_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  UNIQUE KEY uq_provider_event (provider_id, event_id),
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id)
);

-- =====================================================
-- 3. PAYMENTS, TRANSFERS, QR & REFUNDS (6 TABLES)
-- =====================================================

CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(36) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NULL,
  bank_account_id BIGINT UNSIGNED NULL,
  payment_method VARCHAR(30) NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(30) NOT NULL DEFAULT 'initiated',
  purpose VARCHAR(255) NULL,
  provider_reference VARCHAR(150) NULL,
  provider_transaction_id VARCHAR(150) NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id),
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
  INDEX idx_payment_user_date (user_id, created_at),
  INDEX idx_payment_status (status, created_at),
  CHECK (amount > 0)
);

CREATE TABLE transfers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT UNSIGNED NOT NULL UNIQUE,
  sender_user_id BIGINT UNSIGNED NOT NULL,
  receiver_user_id BIGINT UNSIGNED NULL,
  receiver_upi_id VARCHAR(255) NULL,
  receiver_account_last4 CHAR(4) NULL,
  amount DECIMAL(19,4) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (sender_user_id) REFERENCES users(id),
  FOREIGN KEY (receiver_user_id) REFERENCES users(id),
  INDEX idx_transfer_sender (sender_user_id, created_at),
  CHECK (amount > 0)
);

CREATE TABLE payment_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT UNSIGNED NOT NULL,
  attempt_number INT UNSIGNED NOT NULL,
  provider_reference VARCHAR(150) NULL,
  status VARCHAR(30) NOT NULL,
  error_code VARCHAR(100) NULL,
  error_message VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  UNIQUE KEY uq_payment_attempt (payment_id, attempt_number)
);


CREATE TABLE payment_methods (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  method_type VARCHAR(30) NOT NULL,
  provider_token VARCHAR(255) NULL,
  display_label VARCHAR(100) NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  public_id CHAR(36) NOT NULL UNIQUE,
  qr_reference VARCHAR(80) NOT NULL UNIQUE,
  qr_type ENUM('static', 'dynamic') NOT NULL DEFAULT 'static',
  upi_id VARCHAR(255) NULL,
  fixed_amount DECIMAL(12,2) NULL,
  purpose VARCHAR(255) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_qr_reference (qr_reference)
);

CREATE TABLE qr_payment_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    qr_id BIGINT UNSIGNED NOT NULL,
    payer_user_id BIGINT UNSIGNED DEFAULT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status ENUM('pending', 'paid', 'failed', 'cancelled')
      DEFAULT 'pending',
    reference_id VARCHAR(80) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_qr_request (qr_id),
    CONSTRAINT fk_request_qr
      FOREIGN KEY (qr_id) REFERENCES qr_codes(id)
);

CREATE TABLE qr_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT UNSIGNED NOT NULL UNIQUE,
    transaction_reference VARCHAR(80) NOT NULL UNIQUE,
    amount DECIMAL(12,2) NOT NULL,
    status ENUM('pending', 'success', 'failed')
      DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transaction_request
      FOREIGN KEY (request_id)
      REFERENCES qr_payment_requests(id)
);

CREATE TABLE refunds (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  reason VARCHAR(255) NULL,
  provider_refund_reference VARCHAR(150) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  INDEX idx_refund_payment (payment_id, status),
  CHECK (amount > 0)
);

-- =====================================================
-- 4. WALLET & DOUBLE-ENTRY LEDGER (3 TABLES)
-- =====================================================

CREATE TABLE wallets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  available_balance DECIMAL(19,4) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wallet_user_currency (user_id, currency),
  FOREIGN KEY (user_id) REFERENCES users(id),
  CHECK (available_balance >= 0)
);

CREATE TABLE ledger_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference_type VARCHAR(40) NOT NULL,
  reference_id BIGINT UNSIGNED NOT NULL,
  transaction_type VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ledger_reference
    (reference_type, reference_id, transaction_type)
);

CREATE TABLE ledger_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ledger_transaction_id BIGINT UNSIGNED NOT NULL,
  wallet_id BIGINT UNSIGNED NOT NULL,
  entry_type VARCHAR(10) NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ledger_transaction_id)
    REFERENCES ledger_transactions(id),
  FOREIGN KEY (wallet_id) REFERENCES wallets(id),
  INDEX idx_ledger_wallet_date (wallet_id, created_at),
  CHECK (entry_type IN ('debit', 'credit')),
  CHECK (amount > 0)
);

-- =====================================================
-- 5. HISTORY, DISPUTES & AUDIT (4 TABLES)
-- =====================================================

CREATE TABLE transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  payment_id BIGINT UNSIGNED NULL,
  transfer_id BIGINT UNSIGNED NULL,
  refund_id BIGINT UNSIGNED NULL,
  transaction_type VARCHAR(40) NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  status VARCHAR(30) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (transfer_id) REFERENCES transfers(id),
  FOREIGN KEY (refund_id) REFERENCES refunds(id),
  INDEX idx_history_user_date (user_id, created_at)
);

CREATE TABLE disputes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  payment_id BIGINT UNSIGNED NOT NULL,
  dispute_reason VARCHAR(100) NOT NULL,
  description TEXT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  resolution_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  INDEX idx_dispute_status (status, created_at)
);

CREATE TABLE dispute_evidence (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dispute_id BIGINT UNSIGNED NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  evidence_type VARCHAR(40) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispute_id) REFERENCES disputes(id)
);

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id BIGINT UNSIGNED NULL,
  actor_type VARCHAR(20) NOT NULL DEFAULT 'admin',
  actor_id BIGINT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  target_table VARCHAR(80) NULL,
  target_id BIGINT UNSIGNED NULL,
  entity_type VARCHAR(60) NOT NULL DEFAULT 'system',
  entity_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(45) NULL,
  diff_json JSON NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_target (target_table, target_id),
  INDEX idx_audit_date (created_at)
);

-- =====================================================
-- 6. DIGITAL LAND (4 TABLES)
-- Demo/project feature; not a real land registry.
-- =====================================================

CREATE TABLE land_projects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_name VARCHAR(150) NOT NULL,
  title VARCHAR(150) NULL,
  description TEXT NULL,
  location VARCHAR(255) NULL,
  zone VARCHAR(100) NULL,
  plot_size_sqft DECIMAL(19,4) NULL,
  price_per_sqft DECIMAL(19,4) NULL,
  total_price DECIMAL(19,4) NULL,
  unit_name VARCHAR(40) NOT NULL DEFAULT 'sqft',
  price_per_unit DECIMAL(19,4) NOT NULL DEFAULT 1000.0000,
  total_plots INT UNSIGNED NULL DEFAULT 20,
  plots_sold INT UNSIGNED NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for Digital Land Projects
INSERT INTO land_projects (id, project_name, title, description, location, zone, plot_size_sqft, price_per_sqft, total_price, total_plots, plots_sold, status)
VALUES
(1, 'Smart City Phase 1', 'Smart City Phase 1', 'Premium commercial & mixed-use digital plots', 'Sector 62, Noida Extension', 'Zone A - Commercial', 1200, 4500, 5400000, 50, 38, 'AVAILABLE'),
(2, 'Cyber Hub Virtual Tech Plots', 'Cyber Hub Virtual Tech Plots', 'High-growth IT park digital real estate', 'Phase 5, DLF Gurugram', 'Zone B - Tech Special', 2500, 6800, 17000000, 30, 26, 'SOLD_OUT'),
(3, 'Godrej Horizon Plots', 'Godrej Horizon Plots', 'Luxury residential digital plots with river view', 'Bandra Kurla Complex, Mumbai', 'Zone A - Commercial', 5000, 12500, 62500000, 10, 9, 'RESERVED'),
(4, 'Green Valley Eco-Township', 'Green Valley Eco-Township', 'Eco-friendly plotted community', 'Devanahalli, North Bengaluru', 'Zone C - Residential Eco', 1500, 3200, 4800000, 80, 64, 'AVAILABLE')
ON DUPLICATE KEY UPDATE status = VALUES(status);

CREATE TABLE land_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  user_name VARCHAR(120) NULL,
  project_id BIGINT UNSIGNED NULL,
  project_title VARCHAR(150) NULL,
  plot_number VARCHAR(50) NULL,
  order_type VARCHAR(50) NULL,
  units DECIMAL(19,4) NOT NULL DEFAULT 1,
  amount DECIMAL(19,4) NULL,
  total_amount DECIMAL(19,4) NOT NULL DEFAULT 0,
  payment_id BIGINT UNSIGNED NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES land_projects(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE TABLE land_holdings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NULL,
  project_title VARCHAR(150) NULL,
  plot_number VARCHAR(50) NULL,
  plot_size_sqft DECIMAL(19,4) NULL,
  invested_amount DECIMAL(19,4) NULL,
  deed_certificate VARCHAR(100) NULL,
  registry_date DATE NULL,
  units_owned DECIMAL(19,4) NOT NULL DEFAULT 0,
  average_purchase_price DECIMAL(19,4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES land_projects(id)
);

CREATE TABLE land_valuations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  price_per_unit DECIMAL(19,4) NOT NULL,
  valuation_source VARCHAR(150) NULL,
  valued_at DATETIME NOT NULL,
  FOREIGN KEY (project_id) REFERENCES land_projects(id),
  INDEX idx_land_valuation_date (project_id, valued_at),
  CHECK (price_per_unit > 0)
);

-- =====================================================
-- 7. SIP & INVESTMENTS (4 TABLES)
-- =====================================================

CREATE TABLE sip_products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(150) NOT NULL,
  provider_name VARCHAR(150) NULL,
  risk_level VARCHAR(30) NULL,
  minimum_investment DECIMAL(19,4) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (minimum_investment > 0)
);

CREATE TABLE sip_plans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  installment_amount DECIMAL(19,4) NOT NULL,
  frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  next_due_date DATE NULL,
  end_date DATE NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES sip_products(id),
  INDEX idx_sip_due (status, next_due_date),
  CHECK (installment_amount > 0)
);

CREATE TABLE sip_installments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sip_plan_id BIGINT UNSIGNED NOT NULL,
  installment_number INT UNSIGNED NOT NULL DEFAULT 1,
  due_date DATE NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  payment_id BIGINT UNSIGNED NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  paid_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sip_plan_id) REFERENCES sip_plans(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  INDEX idx_sip_installment_plan (sip_plan_id, due_date),
  CHECK (amount > 0)
);


CREATE TABLE IF NOT EXISTS sip_mandates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  sip_plan_id BIGINT UNSIGNED NOT NULL,
  mandate_reference VARCHAR(80) NOT NULL UNIQUE,
  mandate_type ENUM('enach', 'upi_autopay', 'other') NOT NULL,
  bank_account_id BIGINT UNSIGNED NULL,
  maximum_amount DECIMAL(19,4) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (sip_plan_id) REFERENCES sip_plans(id)
);

CREATE TABLE IF NOT EXISTS sip_cancellations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sip_plan_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  cancellation_reference VARCHAR(80) NOT NULL UNIQUE,
  cancellation_reason VARCHAR(255) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'requested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sip_plan_id) REFERENCES sip_plans(id)
);

CREATE TABLE IF NOT EXISTS sip_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sip_plan_id BIGINT UNSIGNED NOT NULL,
  installment_id BIGINT UNSIGNED NULL,
  transaction_reference VARCHAR(80) NOT NULL UNIQUE,
  amount DECIMAL(19,4) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sip_plan_id) REFERENCES sip_plans(id),
  FOREIGN KEY (installment_id) REFERENCES sip_installments(id)
);

-- Seed data for SIP products
INSERT INTO sip_products (id, product_name, provider_name, risk_level, minimum_investment, status)
VALUES 
(1, 'HDFC Top 100 Large Cap Fund', 'HDFC Mutual Fund', 'low', 500.00, 'active'),
(2, 'SBI Bluechip Large Cap Fund', 'SBI Mutual Fund', 'low', 500.00, 'active'),
(3, 'ICICI Prudential Technology Fund', 'ICICI Prudential Mutual Fund', 'high', 1000.00, 'active'),
(4, 'Axis Small Cap Fund', 'Axis Mutual Fund', 'very high', 500.00, 'active'),
(5, 'Parag Parikh Flexi Cap Fund', 'PPFAS Mutual Fund', 'moderate', 1000.00, 'active')
ON DUPLICATE KEY UPDATE status = 'active';

CREATE TABLE investment_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_reference VARCHAR(150) NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  sip_plan_id BIGINT UNSIGNED NULL,
  order_type VARCHAR(30) NOT NULL DEFAULT 'one_time',
  investment_type VARCHAR(30) NULL DEFAULT 'one_time',
  amount DECIMAL(19,4) NOT NULL,
  provider_reference VARCHAR(150) NULL,
  payment_status VARCHAR(30) NULL DEFAULT 'pending',
  order_status VARCHAR(30) NULL DEFAULT 'pending_payment',
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES sip_products(id),
  FOREIGN KEY (sip_plan_id) REFERENCES sip_plans(id),
  CHECK (amount > 0)
);

-- =====================================================
-- 8. NOTIFICATIONS & ADMIN (4 TABLES)
-- =====================================================

CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(40) NOT NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_notification_user (user_id, read_at, created_at)
);

CREATE TABLE notification_preferences (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE admin_users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_name VARCHAR(80) NOT NULL DEFAULT 'support',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for Admin Users
INSERT INTO admin_users (id, name, email, password_hash, role_name, status)
VALUES
(1, 'Super Administrator', 'admin@apnapay.com', 'Admin@123', 'super_admin', 'active'),
(2, 'Compliance Officer', 'compliance@apnapay.com', 'Admin@123', 'compliance_manager', 'active'),
(3, 'Finance Admin', 'finance@apnapay.com', 'Admin@123', 'finance_lead', 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name);


CREATE TABLE roles_permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(80) NOT NULL,
  permission_key VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_role_permission (role_name, permission_key)
);

CREATE TABLE IF NOT EXISTS commission_rules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_code VARCHAR(80) NOT NULL UNIQUE,
  service_name VARCHAR(120) NOT NULL,
  commission_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
  commission_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_amount DECIMAL(19,4) NOT NULL DEFAULT 0.00,
  max_amount DECIMAL(19,4) NOT NULL DEFAULT 100000.00,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed data for Commission Rules
INSERT INTO commission_rules (id, service_code, service_name, commission_type, commission_value, min_amount, max_amount, status)
VALUES
(1, 'MOBILE_RECHARGE', 'Prepaid Mobile Recharge', 'percentage', 2.50, 10.00, 5000.00, 'active'),
(2, 'DTH_RECHARGE', 'DTH Satellite TV', 'percentage', 2.20, 50.00, 10000.00, 'active'),
(3, 'ELECTRICITY_BILL', 'Electricity Bill BBPS', 'flat', 5.00, 100.00, 50000.00, 'active'),
(4, 'WATER_BILL', 'Water Utility BBPS', 'flat', 3.00, 50.00, 20000.00, 'active'),
(5, 'WALLET_TO_BANK', 'Wallet Payout to Bank Account', 'percentage', 1.50, 100.00, 100000.00, 'active'),
(6, 'DIGITAL_LAND', 'Digital Land Registry Fee', 'percentage', 0.50, 100.00, 500000.00, 'active')
ON DUPLICATE KEY UPDATE status = 'active';

CREATE TABLE IF NOT EXISTS app_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed data for App Settings
INSERT INTO app_settings (id, setting_key, setting_value, description)
VALUES
(1, 'maintenance_mode', 'false', 'Enable/disable temporary platform maintenance mode'),
(2, 'min_transfer_amount', '10.00', 'Minimum single transfer allowed in INR'),
(3, 'max_daily_transfer_limit', '100000.00', 'Maximum daily transfer volume per user in INR'),
(4, 'kyc_mandatory_above', '10000.00', 'Mandatory KYC requirement threshold for transactions'),
(5, 'auto_refund_window_hours', '48', 'Hours allowed for merchant refund processing')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- =====================================================
-- 9. MOBILE RECHARGE & BILL PAYMENTS (7 TABLES)
-- =====================================================

CREATE TABLE recharge_operators (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  operator_name VARCHAR(120) NOT NULL,
  service_type VARCHAR(40) NOT NULL,
  provider_id BIGINT UNSIGNED NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id)
);

CREATE TABLE recharge_plans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  operator_id BIGINT UNSIGNED NOT NULL,
  plan_name VARCHAR(150) NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  validity_days INT UNSIGNED NULL,
  benefits JSON NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  FOREIGN KEY (operator_id) REFERENCES recharge_operators(id),
  CHECK (amount > 0)
);

CREATE TABLE recharge_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  operator_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NULL,
  mobile_number VARCHAR(20) NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  payment_id BIGINT UNSIGNED NULL,
  provider_reference VARCHAR(150) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (operator_id) REFERENCES recharge_operators(id),
  FOREIGN KEY (plan_id) REFERENCES recharge_plans(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  INDEX idx_recharge_user_date (user_id, created_at),
  CHECK (amount > 0)
);


-- Seed data for Recharge Operators
INSERT INTO recharge_operators (id, operator_name, service_type, status)
VALUES 
(1, 'Jio Prepaid', 'prepaid', 'active'),
(2, 'Airtel Prepaid', 'prepaid', 'active'),
(3, 'Vodafone Idea (Vi)', 'prepaid', 'active'),
(4, 'BSNL Prepaid', 'prepaid', 'active'),
(5, 'Tata Play DTH', 'dth', 'active'),
(6, 'Airtel Digital TV', 'dth', 'active')
ON DUPLICATE KEY UPDATE status = 'active';

-- Seed data for Recharge Plans
INSERT INTO recharge_plans (id, operator_id, plan_name, amount, validity_days, benefits, status)
VALUES 
(1, 1, 'Jio 1.5GB/Day Truly Unlimited', 299.00, 28, '{"data": "1.5GB/day", "voice": "Unlimited Calls", "sms": "100/day"}', 'active'),
(2, 1, 'Jio 2GB/Day + Unlimited 5G', 349.00, 28, '{"data": "2GB/day + 5G", "voice": "Unlimited Calls", "sms": "100/day"}', 'active'),
(3, 1, 'Jio 3-Month Plan (84 Days)', 799.00, 84, '{"data": "1.5GB/day", "voice": "Unlimited Calls", "sms": "100/day"}', 'active'),
(4, 2, 'Airtel Truly Unlimited 1.5GB/Day', 299.00, 28, '{"data": "1.5GB/day", "voice": "Unlimited Calls", "sms": "100/day"}', 'active'),
(5, 2, 'Airtel 2GB/Day + OTT Pack', 399.00, 28, '{"data": "2GB/day", "voice": "Unlimited Calls", "sms": "100/day"}', 'active'),
(6, 3, 'Vi Hero Unlimited 1.5GB/Day', 299.00, 28, '{"data": "1.5GB/day", "voice": "Unlimited Calls", "sms": "100/day"}', 'active')
ON DUPLICATE KEY UPDATE status = 'active';

CREATE TABLE bill_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
);

CREATE TABLE billers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NULL,
  biller_name VARCHAR(150) NOT NULL,
  biller_code VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  FOREIGN KEY (category_id) REFERENCES bill_categories(id),
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id)
);

CREATE TABLE bill_payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  biller_id BIGINT UNSIGNED NOT NULL,
  customer_reference VARCHAR(255) NOT NULL,
  bill_reference VARCHAR(150) NULL,
  amount DECIMAL(19,4) NOT NULL,
  payment_id BIGINT UNSIGNED NULL,
  provider_reference VARCHAR(150) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  due_date DATE NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (biller_id) REFERENCES billers(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  INDEX idx_bill_user_date (user_id, created_at),
  CHECK (amount > 0)
);

CREATE TABLE saved_billers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  biller_id BIGINT UNSIGNED NOT NULL,
  nickname VARCHAR(100) NULL,
  customer_reference_encrypted VARBINARY(1024) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (biller_id) REFERENCES billers(id),
  INDEX idx_saved_biller_user (user_id)
);

-- =====================================================
-- 10. OPERATIONS & SECURITY (5 TABLES)
-- =====================================================

CREATE TABLE provider_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id BIGINT UNSIGNED NOT NULL,
  internal_reference VARCHAR(150) NOT NULL,
  provider_reference VARCHAR(150) NULL,
  amount DECIMAL(19,4) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(30) NOT NULL,
  provider_payload JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id),
  UNIQUE KEY uq_provider_internal (provider_id, internal_reference),
  INDEX idx_provider_reference (provider_id, provider_reference)
);

CREATE TABLE reconciliation_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_id BIGINT UNSIGNED NOT NULL,
  reconciliation_date DATE NOT NULL,
  internal_amount DECIMAL(19,4) NOT NULL DEFAULT 0,
  provider_amount DECIMAL(19,4) NOT NULL DEFAULT 0,
  difference_amount DECIMAL(19,4) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES payment_providers(id),
  UNIQUE KEY uq_reconciliation_day (provider_id, reconciliation_date)
);

CREATE TABLE webhook_delivery_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_event_id BIGINT UNSIGNED NOT NULL,
  attempt_number INT UNSIGNED NOT NULL DEFAULT 1,
  delivery_status VARCHAR(30) NOT NULL,
  response_code INT NULL,
  response_excerpt VARCHAR(1000) NULL,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_event_id) REFERENCES provider_webhook_events(id),
  UNIQUE KEY uq_webhook_attempt (provider_event_id, attempt_number)
);

CREATE TABLE idempotency_keys (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  response_status INT NULL,
  response_body JSON NULL,
  resource_type VARCHAR(60) NULL,
  resource_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  UNIQUE KEY uq_user_idempotency (user_id, idempotency_key),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_devices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  device_identifier_hash VARCHAR(255) NOT NULL,
  device_name VARCHAR(120) NULL,
  platform VARCHAR(40) NULL,
  push_token_encrypted VARBINARY(1024) NULL,
  last_seen_at DATETIME NULL,
  trusted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uq_user_device (user_id, device_identifier_hash)
);

-- =====================================================
-- END OF 47-TABLE STARTER SCHEMA
-- =====================================================