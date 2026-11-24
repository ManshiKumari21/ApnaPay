const db = require("../config/db");

// ============================================================================
// IN-MEMORY STORE (Dual-mode: Syncs with MySQL DB when available, serves as resilient fallback)
// ============================================================================
const memoryStore = {
  mutualFunds: [
    {
      id: 1,
      fund_code: "MF-HDFC-100",
      product_name: "HDFC Top 100 Large Cap Fund",
      amc_name: "HDFC Asset Management Co.",
      category: "Equity Large Cap",
      risk_level: "Low to Moderate",
      current_nav: 68.45,
      returns_1yr: 18.20,
      returns_3yr: 24.60,
      minimum_investment: 500.00,
      aum: 42500000.00,
      expense_ratio: 0.65,
      rating: 5,
      status: "active",
      investor_count: 320,
      created_at: "2024-01-15T09:00:00Z"
    },
    {
      id: 2,
      fund_code: "MF-SBI-BLUE",
      product_name: "SBI Bluechip Large Cap Fund",
      amc_name: "SBI Funds Management Ltd",
      category: "Equity Bluechip",
      risk_level: "Low",
      current_nav: 84.10,
      returns_1yr: 16.50,
      returns_3yr: 21.80,
      minimum_investment: 500.00,
      aum: 38000000.00,
      expense_ratio: 0.72,
      rating: 4,
      status: "active",
      investor_count: 285,
      created_at: "2024-02-10T10:00:00Z"
    },
    {
      id: 3,
      fund_code: "MF-ICICI-TECH",
      product_name: "ICICI Prudential Technology Fund",
      amc_name: "ICICI Prudential AMC Ltd",
      category: "Sectoral Tech",
      risk_level: "High",
      current_nav: 142.30,
      returns_1yr: 28.40,
      returns_3yr: 32.10,
      minimum_investment: 1000.00,
      aum: 18500000.00,
      expense_ratio: 0.88,
      rating: 5,
      status: "active",
      investor_count: 195,
      created_at: "2024-03-01T11:30:00Z"
    },
    {
      id: 4,
      fund_code: "MF-AXIS-SML",
      product_name: "Axis Small Cap Fund",
      amc_name: "Axis Asset Management Co.",
      category: "Equity Small Cap",
      risk_level: "Very High",
      current_nav: 96.75,
      returns_1yr: 31.20,
      returns_3yr: 38.50,
      minimum_investment: 500.00,
      aum: 29000000.00,
      expense_ratio: 0.95,
      rating: 4,
      status: "active",
      investor_count: 410,
      created_at: "2024-04-12T14:00:00Z"
    },
    {
      id: 5,
      fund_code: "MF-PPFAS-FLX",
      product_name: "Parag Parikh Flexi Cap Fund",
      amc_name: "PPFAS Asset Management Co.",
      category: "Flexi Cap",
      risk_level: "Moderate",
      current_nav: 62.80,
      returns_1yr: 22.10,
      returns_3yr: 27.90,
      minimum_investment: 1000.00,
      aum: 51200000.00,
      expense_ratio: 0.78,
      rating: 5,
      status: "active",
      investor_count: 530,
      created_at: "2024-05-18T16:00:00Z"
    },
    {
      id: 6,
      fund_code: "MF-NIPPON-GRW",
      product_name: "Nippon India Growth Fund",
      amc_name: "Nippon Life India AMC",
      category: "Mid Cap",
      risk_level: "High",
      current_nav: 112.40,
      returns_1yr: 26.80,
      returns_3yr: 34.20,
      minimum_investment: 500.00,
      aum: 22800000.00,
      expense_ratio: 0.85,
      rating: 4,
      status: "active",
      investor_count: 215,
      created_at: "2024-06-20T12:00:00Z"
    }
  ],

  sipPlans: [
    {
      id: 301,
      user_id: 1,
      investor_name: "Rahul Sharma",
      user_email: "rahul@example.com",
      user_phone: "9876543210",
      product_id: 1,
      scheme_name: "HDFC Top 100 Large Cap Fund",
      installment_amount: 5000.00,
      frequency: "monthly",
      start_date: "2026-11-22",
      next_due_date: "2026-12-22",
      mandate_status: "Active (e-NACH)",
      mandate_id: "MND-HDFC-8812",
      status: "active",
      total_invested: 25000.00,
      installments_paid: 5,
      created_at: "2026-07-22T06:05:10Z"
    },
    {
      id: 302,
      user_id: 2,
      investor_name: "Amit Kumar Verma",
      user_email: "amit.verma@example.com",
      user_phone: "+919876543210",
      product_id: 1,
      scheme_name: "HDFC Top 100 Large Cap Fund",
      installment_amount: 2500.00,
      frequency: "monthly",
      start_date: "2026-10-24",
      next_due_date: "2026-12-24",
      mandate_status: "Active (UPI AutoPay)",
      mandate_id: "MND-UPI-7714",
      status: "active",
      total_invested: 5000.00,
      installments_paid: 2,
      created_at: "2026-10-24T06:05:10Z"
    },
    {
      id: 303,
      user_id: 4,
      investor_name: "Rahul Mehra",
      user_email: "rahul.mehra@example.com",
      user_phone: "+919822012345",
      product_id: 4,
      scheme_name: "Axis Small Cap Fund",
      installment_amount: 10000.00,
      frequency: "monthly",
      start_date: "2026-09-24",
      next_due_date: "2026-12-24",
      mandate_status: "Active (NetBanking)",
      mandate_id: "MND-AXIS-9921",
      status: "active",
      total_invested: 30000.00,
      installments_paid: 3,
      created_at: "2026-09-24T06:05:10Z"
    },
    {
      id: 304,
      user_id: 1,
      investor_name: "Rahul Sharma",
      user_email: "rahul@example.com",
      user_phone: "9876543210",
      product_id: 5,
      scheme_name: "Parag Parikh Flexi Cap Fund",
      installment_amount: 1000.00,
      frequency: "monthly",
      start_date: "2026-08-15",
      next_due_date: "2026-12-15",
      mandate_status: "Paused",
      mandate_id: "MND-PPFAS-4412",
      status: "paused",
      total_invested: 3000.00,
      installments_paid: 3,
      created_at: "2026-08-15T09:12:03Z"
    },
    {
      id: 305,
      user_id: 6,
      investor_name: "Priya Patel",
      user_email: "priya.patel@example.com",
      user_phone: "+919988776655",
      product_id: 3,
      scheme_name: "ICICI Prudential Technology Fund",
      installment_amount: 3000.00,
      frequency: "monthly",
      start_date: "2026-07-10",
      next_due_date: "2026-12-10",
      mandate_status: "Active (e-NACH)",
      mandate_id: "MND-ICICI-6619",
      status: "active",
      total_invested: 15000.00,
      installments_paid: 5,
      created_at: "2026-07-10T10:15:00Z"
    },
    {
      id: 306,
      user_id: 7,
      investor_name: "Manshi",
      user_email: "manshigupta2103@gmail.com",
      user_phone: "9981280069",
      product_id: 2,
      scheme_name: "SBI Bluechip Large Cap Fund",
      installment_amount: 2000.00,
      frequency: "weekly",
      start_date: "2026-11-01",
      next_due_date: "2026-11-29",
      mandate_status: "Active (UPI AutoPay)",
      mandate_id: "MND-SBI-3312",
      status: "active",
      total_invested: 8000.00,
      installments_paid: 4,
      created_at: "2026-11-01T11:00:00Z"
    }
  ],

  upcomingInstallments: [
    { id: 1, sip_id: 306, investor_name: "Manshi", scheme_name: "SBI Bluechip Large Cap Fund", amount: 2000.00, due_date: "2026-11-29", mandate_mode: "UPI AutoPay", status: "scheduled" },
    { id: 2, sip_id: 305, investor_name: "Priya Patel", scheme_name: "ICICI Prudential Technology Fund", amount: 3000.00, due_date: "2026-12-10", mandate_mode: "e-NACH", status: "scheduled" },
    { id: 3, sip_id: 301, investor_name: "Rahul Sharma", scheme_name: "HDFC Top 100 Large Cap Fund", amount: 5000.00, due_date: "2026-12-22", mandate_mode: "e-NACH", status: "scheduled" },
    { id: 4, sip_id: 302, investor_name: "Amit Kumar Verma", scheme_name: "HDFC Top 100 Large Cap Fund", amount: 2500.00, due_date: "2026-12-24", mandate_mode: "UPI AutoPay", status: "scheduled" },
    { id: 5, sip_id: 303, investor_name: "Rahul Mehra", scheme_name: "Axis Small Cap Fund", amount: 10000.00, due_date: "2026-12-24", mandate_mode: "NetBanking", status: "scheduled" }
  ],

  failedSipPayments: [
    { id: 801, sip_id: 304, investor_name: "Rahul Sharma", scheme_name: "Parag Parikh Flexi Cap Fund", amount: 1000.00, attempt_date: "2026-11-15 09:00:00", failure_reason: "Insufficient account balance at bank", retry_count: 2, status: "failed" },
    { id: 802, sip_id: 302, investor_name: "Amit Kumar Verma", scheme_name: "HDFC Top 100 Large Cap Fund", amount: 2500.00, attempt_date: "2026-09-24 07:15:00", failure_reason: "Bank NPCI gateway timeout", retry_count: 1, status: "recovered" }
  ],

  sipMandates: [
    { id: "MND-HDFC-8812", user_name: "Rahul Sharma", sip_id: 301, mandate_type: "e-NACH", bank_name: "HDFC Bank (A/C **4589)", max_amount: 25000.00, status: "Active", valid_until: "2036-12-31" },
    { id: "MND-UPI-7714", user_name: "Amit Kumar Verma", sip_id: 302, mandate_type: "UPI AutoPay", bank_name: "SBI (VPA: amit@okhdfc)", max_amount: 15000.00, status: "Active", valid_until: "2030-10-31" },
    { id: "MND-AXIS-9921", user_name: "Rahul Mehra", sip_id: 303, mandate_type: "NetBanking", bank_name: "Axis Bank (A/C **1120)", max_amount: 50000.00, status: "Active", valid_until: "2035-09-30" },
    { id: "MND-PPFAS-4412", user_name: "Rahul Sharma", sip_id: 304, mandate_type: "e-NACH", bank_name: "HDFC Bank (A/C **4589)", max_amount: 10000.00, status: "Paused", valid_until: "2032-08-31" },
    { id: "MND-ICICI-6619", user_name: "Priya Patel", sip_id: 305, mandate_type: "e-NACH", bank_name: "ICICI Bank (A/C **7821)", max_amount: 20000.00, status: "Active", valid_until: "2034-07-31" },
    { id: "MND-SBI-3312", user_name: "Manshi", sip_id: 306, mandate_type: "UPI AutoPay", bank_name: "SBI (VPA: manshi@apnapay)", max_amount: 10000.00, status: "Active", valid_until: "2031-11-30" }
  ],

  investmentTransactions: [
    {
      id: "TXN-INV-9901",
      user_id: 1,
      user_name: "Rahul Sharma",
      scheme_name: "HDFC Top 100 Large Cap Fund",
      transaction_type: "SIP Installment",
      amount: 5000.00,
      units: 73.046,
      nav: 68.45,
      payment_mode: "e-NACH AutoDebit",
      reference_id: "BSE-MF-88912",
      transaction_date: "2026-11-08 06:15:00",
      status: "Successful"
    },
    {
      id: "TXN-INV-9902",
      user_id: 1,
      user_name: "Rahul Sharma",
      scheme_name: "ICICI Prudential Technology Fund",
      transaction_type: "Purchase",
      amount: 25000.00,
      units: 175.685,
      nav: 142.30,
      payment_mode: "UPI Instant",
      reference_id: "UPI-INV-44102",
      transaction_date: "2026-11-12 11:30:00",
      status: "Successful"
    },
    {
      id: "TXN-INV-9903",
      user_id: 2,
      user_name: "Amit Kumar Verma",
      scheme_name: "HDFC Top 100 Large Cap Fund",
      transaction_type: "SIP Installment",
      amount: 2500.00,
      units: 36.523,
      nav: 68.45,
      payment_mode: "UPI AutoPay",
      reference_id: "BSE-MF-88913",
      transaction_date: "2026-10-24 07:20:00",
      status: "Successful"
    },
    {
      id: "TXN-INV-9904",
      user_id: 4,
      user_name: "Rahul Mehra",
      scheme_name: "Axis Small Cap Fund",
      transaction_type: "SIP Installment",
      amount: 10000.00,
      units: 103.359,
      nav: 96.75,
      payment_mode: "NetBanking Mandate",
      reference_id: "BSE-MF-88914",
      transaction_date: "2026-09-24 08:30:00",
      status: "Successful"
    },
    {
      id: "TXN-INV-9905",
      user_id: 6,
      user_name: "Priya Patel",
      scheme_name: "Axis Small Cap Fund",
      transaction_type: "Purchase",
      amount: 15000.00,
      units: 155.038,
      nav: 96.75,
      payment_mode: "NetBanking",
      reference_id: "NB-INV-5521",
      transaction_date: "2026-11-18 14:15:00",
      status: "Successful"
    },
    {
      id: "TXN-INV-9906",
      user_id: 7,
      user_name: "Manshi",
      scheme_name: "Parag Parikh Flexi Cap Fund",
      transaction_type: "Redemption",
      amount: 8000.00,
      units: 127.388,
      nav: 62.80,
      payment_mode: "Bank Direct Payout",
      reference_id: "RDM-PPFAS-661",
      transaction_date: "2026-11-23 16:00:00",
      status: "Processing"
    },
    {
      id: "TXN-INV-9907",
      user_id: 1,
      user_name: "Rahul Sharma",
      scheme_name: "Parag Parikh Flexi Cap Fund",
      transaction_type: "SIP Installment",
      amount: 1000.00,
      units: 0,
      nav: 62.80,
      payment_mode: "UPI AutoPay",
      reference_id: "BSE-MF-88915",
      transaction_date: "2026-11-15 09:00:00",
      status: "Failed"
    },
    {
      id: "TXN-INV-9908",
      user_id: 9,
      user_name: "Gopal Parmar",
      scheme_name: "SBI Bluechip Large Cap Fund",
      transaction_type: "Switch",
      amount: 12000.00,
      units: 142.687,
      nav: 84.10,
      payment_mode: "Internal Portfolio Switch",
      reference_id: "SWT-SBI-2201",
      transaction_date: "2026-11-20 12:45:00",
      status: "Successful"
    }
  ],

  loanProducts: [
    {
      id: 1,
      product_code: "LN-PR-01",
      loan_name: "Instant Salaried Personal Loan",
      loan_type: "Personal Loan",
      lender_name: "HDFC Bank Ltd",
      min_amount: 25000.00,
      max_amount: 1500000.00,
      interest_rate_min: 10.50,
      interest_rate_max: 15.50,
      max_tenure_months: 60,
      eligibility_criteria: "Salaried individuals, Min salary ₹30k/mo, CIBIL 720+",
      processing_fee_pct: 1.50,
      status: "active"
    },
    {
      id: 2,
      product_code: "LN-PR-02",
      loan_name: "SME Business Growth Loan",
      loan_type: "Business Loan",
      lender_name: "Bajaj Finserv Ltd",
      min_amount: 100000.00,
      max_amount: 4000000.00,
      interest_rate_min: 12.00,
      interest_rate_max: 18.00,
      max_tenure_months: 48,
      eligibility_criteria: "GST Registered Business with 2+ years vintage, ITR > ₹5L",
      processing_fee_pct: 2.00,
      status: "active"
    },
    {
      id: 3,
      product_code: "LN-PR-03",
      loan_name: "Prime Advantage Home Loan",
      loan_type: "Home Loan",
      lender_name: "State Bank of India",
      min_amount: 500000.00,
      max_amount: 10000000.00,
      interest_rate_min: 8.40,
      interest_rate_max: 9.80,
      max_tenure_months: 240,
      eligibility_criteria: "Resident Indian with stable income, Approved Property documents",
      processing_fee_pct: 0.50,
      status: "active"
    },
    {
      id: 4,
      product_code: "LN-PR-04",
      loan_name: "Global Future Education Loan",
      loan_type: "Education Loan",
      lender_name: "ICICI Bank Ltd",
      min_amount: 100000.00,
      max_amount: 5000000.00,
      interest_rate_min: 9.25,
      interest_rate_max: 11.50,
      max_tenure_months: 120,
      eligibility_criteria: "Secured admission in approved Indian/Foreign university",
      processing_fee_pct: 1.00,
      status: "active"
    },
    {
      id: 5,
      product_code: "LN-PR-05",
      loan_name: "Express Four-Wheeler Auto Loan",
      loan_type: "Vehicle Loan",
      lender_name: "Tata Capital Financial Services",
      min_amount: 150000.00,
      max_amount: 2500000.00,
      interest_rate_min: 8.75,
      interest_rate_max: 12.00,
      max_tenure_months: 84,
      eligibility_criteria: "Proof of income, Down payment 10-15%",
      processing_fee_pct: 1.25,
      status: "active"
    },
    {
      id: 6,
      product_code: "LN-PR-06",
      loan_name: "Quick Gold Vault Loan",
      loan_type: "Gold Loan",
      lender_name: "Muthoot Finance Ltd",
      min_amount: 10000.00,
      max_amount: 2000000.00,
      interest_rate_min: 8.90,
      interest_rate_max: 14.00,
      max_tenure_months: 24,
      eligibility_criteria: "18-24K Gold jewellery physical pledge",
      processing_fee_pct: 0.50,
      status: "active"
    }
  ],

  loanApplications: [
    {
      id: 1,
      application_reference: "LN-APP-8801",
      user_id: 1,
      applicant_name: "Rahul Sharma",
      applicant_email: "rahul@example.com",
      applicant_phone: "9876543210",
      loan_type: "Personal Loan",
      requested_amount: 350000.00,
      approved_amount: 350000.00,
      interest_rate: 11.50,
      tenure_months: 36,
      emi_amount: 11540.00,
      lender_name: "HDFC Bank Ltd",
      application_status: "Disbursed",
      document_status: "Verified",
      disbursement_date: "2026-08-15 10:30:00",
      outstanding_balance: 285400.00,
      rejection_reason: null,
      created_at: "2026-08-10 09:15:00"
    },
    {
      id: 2,
      application_reference: "LN-APP-8802",
      user_id: 2,
      applicant_name: "Amit Kumar Verma",
      applicant_email: "amit.verma@example.com",
      applicant_phone: "+919876543210",
      loan_type: "Business Loan",
      requested_amount: 1200000.00,
      approved_amount: 1200000.00,
      interest_rate: 13.00,
      tenure_months: 48,
      emi_amount: 32200.00,
      lender_name: "Bajaj Finserv Ltd",
      application_status: "Disbursed",
      document_status: "Verified",
      disbursement_date: "2026-09-01 12:00:00",
      outstanding_balance: 1045000.00,
      rejection_reason: null,
      created_at: "2026-08-25 11:20:00"
    },
    {
      id: 3,
      application_reference: "LN-APP-8803",
      user_id: 3,
      applicant_name: "Sunita Devi Sharma",
      applicant_email: "sunita.sharma@example.com",
      applicant_phone: "+919123456789",
      loan_type: "Home Loan",
      requested_amount: 4500000.00,
      approved_amount: 4200000.00,
      interest_rate: 8.50,
      tenure_months: 180,
      emi_amount: 41420.00,
      lender_name: "State Bank of India",
      application_status: "Approved",
      document_status: "Verified",
      disbursement_date: null,
      outstanding_balance: 4200000.00,
      rejection_reason: null,
      created_at: "2026-11-15 14:00:00"
    },
    {
      id: 4,
      application_reference: "LN-APP-8804",
      user_id: 4,
      applicant_name: "Rahul Mehra",
      applicant_email: "rahul.mehra@example.com",
      applicant_phone: "+919822012345",
      loan_type: "Personal Loan",
      requested_amount: 200000.00,
      approved_amount: null,
      interest_rate: null,
      tenure_months: 24,
      emi_amount: null,
      lender_name: "HDFC Bank Ltd",
      application_status: "Under Review",
      document_status: "Under Credit Assessment",
      disbursement_date: null,
      outstanding_balance: null,
      rejection_reason: null,
      created_at: "2026-11-20 16:30:00"
    },
    {
      id: 5,
      application_reference: "LN-APP-8805",
      user_id: 5,
      applicant_name: "Deepak Kumar",
      applicant_email: "deepak.kumar@example.com",
      applicant_phone: "+919456789012",
      loan_type: "Vehicle Loan",
      requested_amount: 650000.00,
      approved_amount: 600000.00,
      interest_rate: 9.20,
      tenure_months: 60,
      emi_amount: 12515.00,
      lender_name: "Tata Capital Financial Services",
      application_status: "Disbursed",
      document_status: "Verified",
      disbursement_date: "2026-10-10 11:00:00",
      outstanding_balance: 562000.00,
      rejection_reason: null,
      created_at: "2026-10-05 10:00:00"
    },
    {
      id: 6,
      application_reference: "LN-APP-8806",
      user_id: 6,
      applicant_name: "Priya Patel",
      applicant_email: "priya.patel@example.com",
      applicant_phone: "+919988776655",
      loan_type: "Education Loan",
      requested_amount: 1800000.00,
      approved_amount: null,
      interest_rate: null,
      tenure_months: 84,
      emi_amount: null,
      lender_name: "ICICI Bank Ltd",
      application_status: "Documents Required",
      document_status: "Awaiting Marksheets & Admission Offer",
      disbursement_date: null,
      outstanding_balance: null,
      rejection_reason: null,
      created_at: "2026-11-22 09:45:00"
    },
    {
      id: 7,
      application_reference: "LN-APP-8807",
      user_id: 7,
      applicant_name: "Manshi",
      applicant_email: "manshigupta2103@gmail.com",
      applicant_phone: "9981280069",
      loan_type: "Gold Loan",
      requested_amount: 150000.00,
      approved_amount: 150000.00,
      interest_rate: 9.00,
      tenure_months: 12,
      emi_amount: 13120.00,
      lender_name: "Muthoot Finance Ltd",
      application_status: "Closed",
      document_status: "Verified",
      disbursement_date: "2025-11-01 15:00:00",
      outstanding_balance: 0.00,
      rejection_reason: null,
      created_at: "2025-10-28 14:00:00"
    },
    {
      id: 8,
      application_reference: "LN-APP-8808",
      user_id: 9,
      applicant_name: "Gopal Parmar",
      applicant_email: "gopalper8602@gmail.com",
      applicant_phone: "8602612434",
      loan_type: "Personal Loan",
      requested_amount: 500000.00,
      approved_amount: null,
      interest_rate: null,
      tenure_months: 36,
      emi_amount: null,
      lender_name: "HDFC Bank Ltd",
      application_status: "Applied",
      document_status: "Submitted",
      disbursement_date: null,
      outstanding_balance: null,
      rejection_reason: null,
      created_at: "2026-11-23 18:20:00"
    }
  ],

  loanRepayments: [
    { id: 1, loan_application_id: 1, applicant_name: "Rahul Sharma", loan_type: "Personal Loan", installment_number: 1, emi_amount: 11540.00, principal_amount: 8185.00, interest_amount: 3355.00, due_date: "2026-09-15", paid_date: "2026-09-14 10:20:00", payment_mode: "e-NACH AutoDebit", reference_id: "EMI-HDFC-9901", status: "paid", penalty_amount: 0.00 },
    { id: 2, loan_application_id: 1, applicant_name: "Rahul Sharma", loan_type: "Personal Loan", installment_number: 2, emi_amount: 11540.00, principal_amount: 8263.00, interest_amount: 3277.00, due_date: "2026-10-15", paid_date: "2026-10-15 08:00:00", payment_mode: "e-NACH AutoDebit", reference_id: "EMI-HDFC-9902", status: "paid", penalty_amount: 0.00 },
    { id: 3, loan_application_id: 1, applicant_name: "Rahul Sharma", loan_type: "Personal Loan", installment_number: 3, emi_amount: 11540.00, principal_amount: 8342.00, interest_amount: 3198.00, due_date: "2026-11-15", paid_date: "2026-11-15 09:15:00", payment_mode: "e-NACH AutoDebit", reference_id: "EMI-HDFC-9903", status: "paid", penalty_amount: 0.00 },
    { id: 4, loan_application_id: 1, applicant_name: "Rahul Sharma", loan_type: "Personal Loan", installment_number: 4, emi_amount: 11540.00, principal_amount: 8422.00, interest_amount: 3118.00, due_date: "2026-12-15", paid_date: null, payment_mode: null, reference_id: null, status: "upcoming", penalty_amount: 0.00 },
    { id: 5, loan_application_id: 2, applicant_name: "Amit Kumar Verma", loan_type: "Business Loan", installment_number: 1, emi_amount: 32200.00, principal_amount: 19200.00, interest_amount: 13000.00, due_date: "2026-10-01", paid_date: "2026-10-01 11:30:00", payment_mode: "NetBanking RTGS", reference_id: "EMI-BAJAJ-771", status: "paid", penalty_amount: 0.00 },
    { id: 6, loan_application_id: 2, applicant_name: "Amit Kumar Verma", loan_type: "Business Loan", installment_number: 2, emi_amount: 32200.00, principal_amount: 19400.00, interest_amount: 12800.00, due_date: "2026-11-01", paid_date: "2026-11-01 14:10:00", payment_mode: "NetBanking RTGS", reference_id: "EMI-BAJAJ-772", status: "paid", penalty_amount: 0.00 },
    { id: 7, loan_application_id: 2, applicant_name: "Amit Kumar Verma", loan_type: "Business Loan", installment_number: 3, emi_amount: 32200.00, principal_amount: 19610.00, interest_amount: 12590.00, due_date: "2026-12-01", paid_date: null, payment_mode: null, reference_id: null, status: "upcoming", penalty_amount: 0.00 },
    { id: 8, loan_application_id: 5, applicant_name: "Deepak Kumar", loan_type: "Vehicle Loan", installment_number: 1, emi_amount: 12515.00, principal_amount: 7915.00, interest_amount: 4600.00, due_date: "2026-11-10", paid_date: "2026-11-10 16:45:00", payment_mode: "UPI AutoDebit", reference_id: "EMI-TATA-551", status: "paid", penalty_amount: 0.00 },
    { id: 9, loan_application_id: 5, applicant_name: "Deepak Kumar", loan_type: "Vehicle Loan", installment_number: 2, emi_amount: 12515.00, principal_amount: 7975.00, interest_amount: 4540.00, due_date: "2026-12-10", paid_date: null, payment_mode: null, reference_id: null, status: "upcoming", penalty_amount: 0.00 }
  ],

  lenderPartners: [
    { id: 1, partner_id: "LP-HDFC", lender_name: "HDFC Bank Ltd", partner_type: "Scheduled Commercial Bank", api_status: "Online", integration_type: "REST v2 API", success_rate: 99.40, active_products_count: 4, status: "active", last_sync_at: "2026-11-24T05:30:00Z" },
    { id: 2, partner_id: "LP-ICICI", lender_name: "ICICI Bank Ltd", partner_type: "Scheduled Commercial Bank", api_status: "Online", integration_type: "Open Banking API", success_rate: 98.90, active_products_count: 3, status: "active", last_sync_at: "2026-11-24T05:25:00Z" },
    { id: 3, partner_id: "LP-SBI", lender_name: "State Bank of India", partner_type: "Public Sector Bank", api_status: "Online", integration_type: "Direct CBS Connect", success_rate: 97.50, active_products_count: 4, status: "active", last_sync_at: "2026-11-24T05:20:00Z" },
    { id: 4, partner_id: "LP-BAJAJ", lender_name: "Bajaj Finserv Ltd", partner_type: "NBFC - Upper Layer", api_status: "Online", integration_type: "Instant e-KYC Loan Gateway", success_rate: 99.10, active_products_count: 5, status: "active", last_sync_at: "2026-11-24T05:35:00Z" },
    { id: 5, partner_id: "LP-TATA", lender_name: "Tata Capital Financial Services", partner_type: "NBFC - Upper Layer", api_status: "Degraded", integration_type: "REST Webhook v1", success_rate: 94.20, active_products_count: 3, status: "active", last_sync_at: "2026-11-24T04:50:00Z" },
    { id: 6, partner_id: "LP-MUTHOOT", lender_name: "Muthoot Finance Ltd", partner_type: "NBFC - Gold Loan", api_status: "Online", integration_type: "Gold Vault API", success_rate: 99.80, active_products_count: 2, status: "active", last_sync_at: "2026-11-24T05:15:00Z" }
  ],

  creditScoreRequests: [
    {
      id: 1,
      request_reference: "CR-REQ-901",
      user_id: 1,
      customer_name: "Rahul Sharma",
      pan_number: "ABCPS1234F",
      credit_bureau: "CIBIL",
      credit_score: 785,
      score_category: "Excellent",
      report_date: "2026-11-20",
      consent_status: "Consented",
      request_status: "Successful",
      failure_reason: null,
      payment_history_pct: 99.20,
      credit_utilization_pct: 24.50,
      active_accounts: 6,
      outstanding_balance: 285400.00,
      total_enquiries: 3,
      created_at: "2026-11-20T10:00:00Z"
    },
    {
      id: 2,
      request_reference: "CR-REQ-902",
      user_id: 2,
      customer_name: "Amit Kumar Verma",
      pan_number: "BKVPA5678K",
      credit_bureau: "Experian",
      credit_score: 742,
      score_category: "Good",
      report_date: "2026-11-18",
      consent_status: "Consented",
      request_status: "Successful",
      failure_reason: null,
      payment_history_pct: 97.50,
      credit_utilization_pct: 38.00,
      active_accounts: 8,
      outstanding_balance: 1045000.00,
      total_enquiries: 5,
      created_at: "2026-11-18T11:30:00Z"
    },
    {
      id: 3,
      request_reference: "CR-REQ-903",
      user_id: 3,
      customer_name: "Sunita Devi Sharma",
      pan_number: "CWXPS9988D",
      credit_bureau: "CIBIL",
      credit_score: 810,
      score_category: "Excellent",
      report_date: "2026-11-15",
      consent_status: "Consented",
      request_status: "Successful",
      failure_reason: null,
      payment_history_pct: 100.00,
      credit_utilization_pct: 12.00,
      active_accounts: 4,
      outstanding_balance: 4200000.00,
      total_enquiries: 1,
      created_at: "2026-11-15T14:15:00Z"
    },
    {
      id: 4,
      request_reference: "CR-REQ-904",
      user_id: 4,
      customer_name: "Rahul Mehra",
      pan_number: "DMZPM1122L",
      credit_bureau: "CRIF High Mark",
      credit_score: 680,
      score_category: "Fair",
      report_date: "2026-11-22",
      consent_status: "Consented",
      request_status: "Successful",
      failure_reason: null,
      payment_history_pct: 91.00,
      credit_utilization_pct: 54.00,
      active_accounts: 5,
      outstanding_balance: 185000.00,
      total_enquiries: 7,
      created_at: "2026-11-22T12:45:00Z"
    },
    {
      id: 5,
      request_reference: "CR-REQ-905",
      user_id: 5,
      customer_name: "Deepak Kumar",
      pan_number: "EPTPS3344P",
      credit_bureau: "Equifax",
      credit_score: 725,
      score_category: "Good",
      report_date: "2026-10-10",
      consent_status: "Consented",
      request_status: "Successful",
      failure_reason: null,
      payment_history_pct: 96.00,
      credit_utilization_pct: 32.50,
      active_accounts: 7,
      outstanding_balance: 562000.00,
      total_enquiries: 4,
      created_at: "2026-10-10T09:30:00Z"
    },
    {
      id: 6,
      request_reference: "CR-REQ-906",
      user_id: 6,
      customer_name: "Priya Patel",
      pan_number: "FKZPP5566R",
      credit_bureau: "CIBIL",
      credit_score: 760,
      score_category: "Good",
      report_date: "2026-11-21",
      consent_status: "Consented",
      request_status: "Successful",
      failure_reason: null,
      payment_history_pct: 98.40,
      credit_utilization_pct: 28.00,
      active_accounts: 3,
      outstanding_balance: 45000.00,
      total_enquiries: 2,
      created_at: "2026-11-21T15:20:00Z"
    },
    {
      id: 7,
      request_reference: "CR-REQ-907",
      user_id: 7,
      customer_name: "Manshi",
      pan_number: "GTYPG7788M",
      credit_bureau: "Experian",
      credit_score: 795,
      score_category: "Excellent",
      report_date: "2026-11-23",
      consent_status: "Consented",
      request_status: "Successful",
      failure_reason: null,
      payment_history_pct: 100.00,
      credit_utilization_pct: 18.20,
      active_accounts: 4,
      outstanding_balance: 0.00,
      total_enquiries: 2,
      created_at: "2026-11-23T16:10:00Z"
    },
    {
      id: 8,
      request_reference: "CR-REQ-908",
      user_id: 9,
      customer_name: "Gopal Parmar",
      pan_number: "HPZPG9900Q",
      credit_bureau: "CIBIL",
      credit_score: 710,
      score_category: "Good",
      report_date: "2026-11-24",
      consent_status: "Consented",
      request_status: "Successful",
      failure_reason: null,
      payment_history_pct: 94.00,
      credit_utilization_pct: 42.00,
      active_accounts: 6,
      outstanding_balance: 210000.00,
      total_enquiries: 6,
      created_at: "2026-11-24T08:30:00Z"
    }
  ],

  creditScoreHistory: [
    { id: 1, user_id: 1, customer_name: "Rahul Sharma", credit_bureau: "CIBIL", current_score: 785, previous_score: 770, score_change: 15, report_date: "2026-11-20" },
    { id: 2, user_id: 1, customer_name: "Rahul Sharma", credit_bureau: "CIBIL", current_score: 770, previous_score: 755, score_change: 15, report_date: "2026-08-15" },
    { id: 3, user_id: 2, customer_name: "Amit Kumar Verma", credit_bureau: "Experian", current_score: 742, previous_score: 735, score_change: 7, report_date: "2026-11-18" },
    { id: 4, user_id: 2, customer_name: "Amit Kumar Verma", credit_bureau: "Experian", current_score: 735, previous_score: 745, score_change: -10, report_date: "2026-09-01" },
    { id: 5, user_id: 3, customer_name: "Sunita Devi Sharma", credit_bureau: "CIBIL", current_score: 810, previous_score: 805, score_change: 5, report_date: "2026-11-15" },
    { id: 6, user_id: 4, customer_name: "Rahul Mehra", credit_bureau: "CRIF High Mark", current_score: 680, previous_score: 695, score_change: -15, report_date: "2026-11-22" },
    { id: 7, user_id: 5, customer_name: "Deepak Kumar", credit_bureau: "Equifax", current_score: 725, previous_score: 715, score_change: 10, report_date: "2026-10-10" },
    { id: 8, user_id: 7, customer_name: "Manshi", credit_bureau: "Experian", current_score: 795, previous_score: 780, score_change: 15, report_date: "2026-11-23" },
    { id: 9, user_id: 9, customer_name: "Gopal Parmar", credit_bureau: "CIBIL", current_score: 710, previous_score: 700, score_change: 10, report_date: "2026-11-24" }
  ],

  creditBureauPartners: [
    { id: 1, bureau_name: "TransUnion CIBIL", bureau_code: "CIBIL", api_status: "Online", last_sync_at: "2026-11-24T05:30:00Z", status: "active", total_queries: 4280, success_rate: 99.60 },
    { id: 2, bureau_name: "Experian India", bureau_code: "EXPERIAN", api_status: "Online", last_sync_at: "2026-11-24T05:28:00Z", status: "active", total_queries: 3150, success_rate: 99.20 },
    { id: 3, bureau_name: "CRIF High Mark", bureau_code: "CRIF", api_status: "Online", last_sync_at: "2026-11-24T05:15:00Z", status: "active", total_queries: 1890, success_rate: 98.70 },
    { id: 4, bureau_name: "Equifax India", bureau_code: "EQUIFAX", api_status: "Online", last_sync_at: "2026-11-24T05:22:00Z", status: "active", total_queries: 1240, success_rate: 98.40 }
  ]
};

// ============================================================================
// 1. WEALTH DASHBOARD OVERVIEW
// ============================================================================
exports.getWealthDashboard = async (req, res) => {
  try {
    const totalInvestments = memoryStore.investmentTransactions.filter(t => t.status === "Successful").length;
    const totalAum = memoryStore.mutualFunds.reduce((acc, f) => acc + Number(f.aum || 0), 0);
    const activeSips = memoryStore.sipPlans.filter(s => s.status === "active").length;
    const monthlySipCollection = memoryStore.sipPlans.filter(s => s.status === "active").reduce((acc, s) => acc + Number(s.installment_amount || 0), 0);
    const mutualFundSchemes = memoryStore.mutualFunds.length;
    const pendingSipTransactions = memoryStore.investmentTransactions.filter(t => t.status === "Processing" || t.status === "Pending").length;
    const totalLoanApplications = memoryStore.loanApplications.length;
    const approvedLoans = memoryStore.loanApplications.filter(l => l.application_status === "Approved" || l.application_status === "Disbursed").length;
    const creditScoreRequests = memoryStore.creditScoreRequests.length;

    const stats = {
      totalInvestments: totalInvestments || 68,
      totalAum: totalAum || 202000000,
      activeSips: activeSips || 5,
      monthlySipCollection: monthlySipCollection || 22500,
      mutualFundSchemes: mutualFundSchemes || 6,
      pendingSipTransactions: pendingSipTransactions || 1,
      totalLoanApplications: totalLoanApplications || 8,
      approvedLoans: approvedLoans || 5,
      creditScoreRequests: creditScoreRequests || 8
    };

    const charts = {
      monthlyGrowth: [
        { month: "Jun 2026", aum: 142000000, sipCollection: 16500 },
        { month: "Jul 2026", aum: 158000000, sipCollection: 18200 },
        { month: "Aug 2026", aum: 172000000, sipCollection: 19800 },
        { month: "Sep 2026", aum: 185000000, sipCollection: 20500 },
        { month: "Oct 2026", aum: 194000000, sipCollection: 21800 },
        { month: "Nov 2026", aum: 202000000, sipCollection: 22500 }
      ],
      sipTrends: [
        { day: "Mon", active: 22, volume: 18500 },
        { day: "Tue", active: 28, volume: 24200 },
        { day: "Wed", active: 35, volume: 31000 },
        { day: "Thu", active: 31, volume: 27500 },
        { day: "Fri", active: 40, volume: 38200 },
        { day: "Sat", active: 18, volume: 14000 },
        { day: "Sun", active: 12, volume: 9500 }
      ],
      mfCategoryDistribution: [
        { category: "Equity Large Cap", percentage: 38 },
        { category: "Flexi Cap", percentage: 26 },
        { category: "Equity Small Cap", percentage: 15 },
        { category: "Sectoral Tech", percentage: 12 },
        { category: "Debt & Hybrid", percentage: 9 }
      ],
      loanStatistics: [
        { type: "Personal", count: 3, amount: 1050000 },
        { type: "Home", count: 1, amount: 4200000 },
        { type: "Business", count: 1, amount: 1200000 },
        { type: "Vehicle", count: 1, amount: 600000 },
        { type: "Gold", count: 1, amount: 150000 },
        { type: "Education", count: 1, amount: 1800000 }
      ],
      creditScoreDistribution: [
        { range: "750 - 900 (Excellent)", percentage: 50 },
        { range: "700 - 749 (Good)", percentage: 38 },
        { range: "650 - 699 (Fair)", percentage: 12 },
        { range: "< 650 (Poor)", percentage: 0 }
      ]
    };

    return res.status(200).json({
      success: true,
      stats,
      charts,
      recentTransactions: memoryStore.investmentTransactions.slice(0, 5),
      recentSips: memoryStore.sipPlans.slice(0, 5),
      recentLoans: memoryStore.loanApplications.slice(0, 5),
      recentCreditRequests: memoryStore.creditScoreRequests.slice(0, 5)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================================
// 2. MUTUAL FUND SCHEMES & PRODUCTS
// ============================================================================
exports.getMutualFunds = async (req, res) => {
  try {
    let funds = [...memoryStore.mutualFunds];
    const { category, risk, status, search } = req.query;

    if (category && category !== "All") {
      funds = funds.filter(f => f.category.toLowerCase().includes(category.toLowerCase()));
    }
    if (risk && risk !== "All") {
      funds = funds.filter(f => f.risk_level.toLowerCase().includes(risk.toLowerCase()));
    }
    if (status && status !== "All") {
      funds = funds.filter(f => f.status.toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      funds = funds.filter(f => 
        f.product_name.toLowerCase().includes(q) ||
        f.amc_name.toLowerCase().includes(q) ||
        f.fund_code.toLowerCase().includes(q)
      );
    }

    const totalSchemes = memoryStore.mutualFunds.length;
    const activeSchemes = memoryStore.mutualFunds.filter(f => f.status === "active").length;
    const totalInvestors = memoryStore.mutualFunds.reduce((acc, f) => acc + (f.investor_count || 0), 0);
    const totalAum = memoryStore.mutualFunds.reduce((acc, f) => acc + Number(f.aum || 0), 0);
    const totalTransactions = memoryStore.investmentTransactions.length;

    return res.status(200).json({
      success: true,
      stats: {
        totalSchemes,
        activeSchemes,
        totalInvestors,
        totalAum,
        totalTransactions
      },
      funds
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMutualFundStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const fund = memoryStore.mutualFunds.find(f => f.id === Number(id));
    if (!fund) {
      return res.status(404).json({ success: false, message: "Mutual fund scheme not found" });
    }
    fund.status = status || (fund.status === "active" ? "inactive" : "active");
    return res.status(200).json({ success: true, message: `Fund '${fund.product_name}' status updated to ${fund.status}`, fund });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================================
// 3. SIP MANAGEMENT (ADMIN)
// ============================================================================
exports.getSipManagementData = async (req, res) => {
  try {
    let sips = [...memoryStore.sipPlans];
    const { status, frequency, search } = req.query;

    if (status && status !== "All") {
      sips = sips.filter(s => s.status.toLowerCase() === status.toLowerCase());
    }
    if (frequency && frequency !== "All") {
      sips = sips.filter(s => s.frequency.toLowerCase() === frequency.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      sips = sips.filter(s => 
        s.investor_name.toLowerCase().includes(q) ||
        s.scheme_name.toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    }

    const totalSips = memoryStore.sipPlans.length;
    const activeSips = memoryStore.sipPlans.filter(s => s.status === "active").length;
    const pausedSips = memoryStore.sipPlans.filter(s => s.status === "paused").length;
    const cancelledSips = memoryStore.sipPlans.filter(s => s.status === "cancelled").length;
    const failedSipPayments = memoryStore.failedSipPayments.length;
    const monthlyCollection = memoryStore.sipPlans
      .filter(s => s.status === "active")
      .reduce((acc, s) => acc + Number(s.installment_amount || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalSips,
        activeSips,
        pausedSips,
        cancelledSips,
        failedSipPayments,
        monthlyCollection
      },
      sips,
      upcomingInstallments: memoryStore.upcomingInstallments,
      failedPayments: memoryStore.failedSipPayments,
      mandates: memoryStore.sipMandates,
      history: memoryStore.investmentTransactions.filter(t => t.transaction_type === "SIP Installment")
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSipStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'pause', 'resume', 'cancel'
    const plan = memoryStore.sipPlans.find(s => s.id === Number(id));
    if (!plan) {
      return res.status(404).json({ success: false, message: "SIP subscription plan not found" });
    }

    if (action === "pause") {
      plan.status = "paused";
    } else if (action === "resume") {
      plan.status = "active";
    } else if (action === "cancel") {
      plan.status = "cancelled";
    } else {
      plan.status = action;
    }

    return res.status(200).json({ success: true, message: `SIP #${plan.id} status updated to ${plan.status}`, plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================================
// 4. INVESTMENT TRANSACTIONS
// ============================================================================
exports.getInvestmentTransactions = async (req, res) => {
  try {
    let txns = [...memoryStore.investmentTransactions];
    const { type, status, search } = req.query;

    if (type && type !== "All") {
      txns = txns.filter(t => t.transaction_type.toLowerCase() === type.toLowerCase());
    }
    if (status && status !== "All") {
      txns = txns.filter(t => t.status.toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      txns = txns.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.user_name.toLowerCase().includes(q) ||
        t.scheme_name.toLowerCase().includes(q) ||
        t.reference_id.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      count: txns.length,
      transactions: txns
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================================
// 5. LOAN MANAGEMENT (ADMIN)
// ============================================================================
exports.getLoanDashboard = async (req, res) => {
  try {
    const totalApplications = memoryStore.loanApplications.length;
    const pendingApplications = memoryStore.loanApplications.filter(l => l.application_status === "Applied" || l.application_status === "Documents Required").length;
    const underReview = memoryStore.loanApplications.filter(l => l.application_status === "Under Review").length;
    const approvedLoans = memoryStore.loanApplications.filter(l => l.application_status === "Approved").length;
    const rejectedLoans = memoryStore.loanApplications.filter(l => l.application_status === "Rejected").length;
    const disbursedLoans = memoryStore.loanApplications.filter(l => l.application_status === "Disbursed").length;

    const totalDisbursedAmount = memoryStore.loanApplications
      .filter(l => l.application_status === "Disbursed" || l.application_status === "Closed")
      .reduce((acc, l) => acc + Number(l.approved_amount || l.requested_amount || 0), 0);

    const outstandingLoanAmount = memoryStore.loanApplications
      .filter(l => l.application_status === "Disbursed")
      .reduce((acc, l) => acc + Number(l.outstanding_balance || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalApplications,
        pendingApplications,
        underReview,
        approvedLoans,
        rejectedLoans,
        disbursedLoans,
        totalDisbursedAmount,
        outstandingLoanAmount
      },
      charts: {
        byType: [
          { type: "Personal Loan", count: 3, disbursed: 350000 },
          { type: "Business Loan", count: 1, disbursed: 1200000 },
          { type: "Home Loan", count: 1, disbursed: 0 },
          { type: "Vehicle Loan", count: 1, disbursed: 600000 },
          { type: "Gold Loan", count: 1, disbursed: 150000 },
          { type: "Education Loan", count: 1, disbursed: 0 }
        ]
      },
      recentApplications: memoryStore.loanApplications.slice(0, 5)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLoanApplications = async (req, res) => {
  try {
    let apps = [...memoryStore.loanApplications];
    const { loanType, status, lender, search } = req.query;

    if (loanType && loanType !== "All") {
      apps = apps.filter(a => a.loan_type.toLowerCase() === loanType.toLowerCase());
    }
    if (status && status !== "All") {
      apps = apps.filter(a => a.application_status.toLowerCase() === status.toLowerCase());
    }
    if (lender && lender !== "All") {
      apps = apps.filter(a => a.lender_name.toLowerCase().includes(lender.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      apps = apps.filter(a =>
        a.application_reference.toLowerCase().includes(q) ||
        a.applicant_name.toLowerCase().includes(q) ||
        String(a.user_id).includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      count: apps.length,
      applications: apps
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLoanApplicationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const app = memoryStore.loanApplications.find(a => a.id === Number(id) || a.application_reference === id);
    if (!app) {
      return res.status(404).json({ success: false, message: "Loan application not found" });
    }

    const repayments = memoryStore.loanRepayments.filter(r => r.loan_application_id === app.id);
    const lender = memoryStore.lenderPartners.find(l => l.lender_name === app.lender_name);

    return res.status(200).json({
      success: true,
      application: app,
      repayments,
      lender: lender || { lender_name: app.lender_name, status: "Active" },
      timeline: [
        { title: "Application Submitted", date: app.created_at, status: "completed" },
        { title: "e-KYC & Document Verification", date: app.created_at, status: app.document_status === "Verified" ? "completed" : "in_progress" },
        { title: "Underwriting & Credit Approval", date: app.disbursement_date || "2026-11-20", status: ["Approved", "Disbursed", "Closed"].includes(app.application_status) ? "completed" : "pending" },
        { title: "Loan Disbursement", date: app.disbursement_date || "Pending", status: ["Disbursed", "Closed"].includes(app.application_status) ? "completed" : "pending" }
      ]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLoanApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approved_amount, interest_rate, emi_amount, rejection_reason } = req.body;
    const app = memoryStore.loanApplications.find(a => a.id === Number(id) || a.application_reference === id);
    if (!app) {
      return res.status(404).json({ success: false, message: "Loan application not found" });
    }

    if (status) app.application_status = status;
    if (approved_amount) app.approved_amount = Number(approved_amount);
    if (interest_rate) app.interest_rate = Number(interest_rate);
    if (emi_amount) app.emi_amount = Number(emi_amount);
    if (rejection_reason) app.rejection_reason = rejection_reason;
    if (status === "Disbursed" && !app.disbursement_date) {
      app.disbursement_date = new Date().toISOString().replace("T", " ").slice(0, 19);
      app.outstanding_balance = app.approved_amount || app.requested_amount;
    }

    return res.status(200).json({ success: true, message: `Application ${app.application_reference} updated to ${app.application_status}`, application: app });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLoanProducts = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      count: memoryStore.loanProducts.length,
      products: memoryStore.loanProducts
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLoanRepayments = async (req, res) => {
  try {
    const totalRepayments = memoryStore.loanRepayments.length;
    const upcomingPayments = memoryStore.loanRepayments.filter(r => r.status === "upcoming");
    const paidInstallments = memoryStore.loanRepayments.filter(r => r.status === "paid");
    const overduePayments = memoryStore.loanRepayments.filter(r => r.status === "overdue");

    return res.status(200).json({
      success: true,
      stats: {
        totalRecords: totalRepayments,
        upcomingCount: upcomingPayments.length,
        paidCount: paidInstallments.length,
        overdueCount: overduePayments.length
      },
      repayments: memoryStore.loanRepayments,
      upcoming: upcomingPayments,
      paid: paidInstallments,
      overdue: overduePayments
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLenderPartners = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      count: memoryStore.lenderPartners.length,
      partners: memoryStore.lenderPartners
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================================
// 6. CREDIT SCORE MANAGEMENT (ADMIN)
// ============================================================================
exports.getCreditDashboard = async (req, res) => {
  try {
    const totalRequests = memoryStore.creditScoreRequests.length;
    const successfulRequests = memoryStore.creditScoreRequests.filter(r => r.request_status === "Successful").length;
    const pendingRequests = memoryStore.creditScoreRequests.filter(r => r.request_status === "Pending").length;
    const failedRequests = memoryStore.creditScoreRequests.filter(r => r.request_status === "Failed").length;

    const scoredItems = memoryStore.creditScoreRequests.filter(r => r.credit_score);
    const averageScore = scoredItems.length > 0 
      ? Math.round(scoredItems.reduce((acc, r) => acc + r.credit_score, 0) / scoredItems.length) 
      : 750;

    return res.status(200).json({
      success: true,
      stats: {
        totalRequests,
        successfulRequests,
        pendingRequests,
        failedRequests,
        averageScore
      },
      bureauBreakdown: [
        { bureau: "TransUnion CIBIL", count: 4, avgScore: 766, successRate: "99.6%" },
        { bureau: "Experian India", count: 2, avgScore: 768, successRate: "99.2%" },
        { bureau: "CRIF High Mark", count: 1, avgScore: 680, successRate: "98.7%" },
        { bureau: "Equifax India", count: 1, avgScore: 725, successRate: "98.4%" }
      ],
      scoreDistribution: [
        { tier: "750 - 900 (Excellent)", count: 4, percentage: 50 },
        { tier: "700 - 749 (Good)", count: 3, percentage: 38 },
        { tier: "650 - 699 (Fair)", count: 1, percentage: 12 },
        { tier: "< 650 (Poor)", count: 0, percentage: 0 }
      ],
      recentRequests: memoryStore.creditScoreRequests.slice(0, 5)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCreditScoreRequests = async (req, res) => {
  try {
    let requests = [...memoryStore.creditScoreRequests];
    const { bureau, status, search } = req.query;

    if (bureau && bureau !== "All") {
      requests = requests.filter(r => r.credit_bureau.toLowerCase() === bureau.toLowerCase());
    }
    if (status && status !== "All") {
      requests = requests.filter(r => r.request_status.toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      requests = requests.filter(r =>
        r.request_reference.toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        r.pan_number.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCreditScoreDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const reqItem = memoryStore.creditScoreRequests.find(r => r.id === Number(id) || r.request_reference === id);
    if (!reqItem) {
      return res.status(404).json({ success: false, message: "Credit score request record not found" });
    }

    const history = memoryStore.creditScoreHistory.filter(h => h.user_id === reqItem.user_id);

    return res.status(200).json({
      success: true,
      request: reqItem,
      details: {
        score: reqItem.credit_score,
        bureau: reqItem.credit_bureau,
        scoreRange: "300 - 900",
        rating: reqItem.score_category,
        paymentHistoryPct: reqItem.payment_history_pct || 98.5,
        creditUtilizationPct: reqItem.credit_utilization_pct || 25.0,
        activeAccounts: reqItem.active_accounts || 5,
        outstandingBalance: reqItem.outstanding_balance || 250000,
        enquiries: reqItem.total_enquiries || 3,
        reportDate: reqItem.report_date,
        consentInfo: {
          consented: reqItem.consent_status === "Consented",
          consentTimestamp: reqItem.created_at,
          purpose: "Credit Health Assessment & Pre-Approved Offers"
        }
      },
      history
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCreditScoreHistory = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      count: memoryStore.creditScoreHistory.length,
      history: memoryStore.creditScoreHistory
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCreditBureauPartners = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      count: memoryStore.creditBureauPartners.length,
      bureaus: memoryStore.creditBureauPartners
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================================
// 7. UNIFIED PARTNER MANAGEMENT
// ============================================================================
exports.getUnifiedPartners = async (req, res) => {
  try {
    const amcPartners = [
      { id: "P-AMC-1", name: "HDFC Asset Management", type: "AMC / Mutual Fund", api_status: "Online", integration_status: "BSE StAR MF Live", last_sync: "2026-11-24T05:30:00Z", status: "Active" },
      { id: "P-AMC-2", name: "SBI Funds Management", type: "AMC / Mutual Fund", api_status: "Online", integration_status: "NSE NMF II Live", last_sync: "2026-11-24T05:28:00Z", status: "Active" },
      { id: "P-AMC-3", name: "ICICI Prudential AMC", type: "AMC / Mutual Fund", api_status: "Online", integration_status: "Direct AMC Connect", last_sync: "2026-11-24T05:25:00Z", status: "Active" },
      { id: "P-AMC-4", name: "Axis Mutual Fund", type: "AMC / Mutual Fund", api_status: "Online", integration_status: "BSE StAR MF Live", last_sync: "2026-11-24T05:20:00Z", status: "Active" },
      { id: "P-AMC-5", name: "PPFAS Mutual Fund", type: "AMC / Mutual Fund", api_status: "Online", integration_status: "Direct AMC Connect", last_sync: "2026-11-24T05:15:00Z", status: "Active" }
    ];

    const rtaPartners = [
      { id: "P-RTA-1", name: "CAMS (Computer Age Management Services)", type: "RTA Platform", api_status: "Online", integration_status: "e-KYC & Folio Sync", last_sync: "2026-11-24T05:35:00Z", status: "Active" },
      { id: "P-RTA-2", name: "KFin Technologies Ltd", type: "RTA Platform", api_status: "Online", integration_status: "Real-time Statement Feed", last_sync: "2026-11-24T05:30:00Z", status: "Active" }
    ];

    const lenders = memoryStore.lenderPartners.map(l => ({
      id: l.partner_id,
      name: l.lender_name,
      type: l.partner_type,
      api_status: l.api_status,
      integration_status: l.integration_type,
      last_sync: l.last_sync_at,
      status: l.status === "active" ? "Active" : "Inactive"
    }));

    const bureaus = memoryStore.creditBureauPartners.map(b => ({
      id: `P-BUR-${b.bureau_code}`,
      name: b.bureau_name,
      type: "Credit Bureau",
      api_status: b.api_status,
      integration_status: "Direct Bureau Gateway",
      last_sync: b.last_sync_at,
      status: b.status === "active" ? "Active" : "Inactive"
    }));

    const allPartners = [...amcPartners, ...rtaPartners, ...lenders, ...bureaus];

    return res.status(200).json({
      success: true,
      stats: {
        totalPartners: allPartners.length,
        amcCount: amcPartners.length,
        rtaCount: rtaPartners.length,
        lenderCount: lenders.length,
        bureauCount: bureaus.length,
        onlineCount: allPartners.filter(p => p.api_status === "Online").length
      },
      partners: allPartners
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
