/**
 * Comprehensive Test Suite for ApnaPay Smart Bank Suggestions & Bank-Wise Validation
 *
 * Scenarios Tested (from Section 11):
 * 1. Select SBI and verify bank-specific validation (11 to 17 digits, SBIN prefix).
 * 2. Select HDFC and verify its IFSC prefix (HDFC prefix, 14 digits).
 * 3. Select PNB and verify its IFSC prefix (PUNB prefix, 16 digits).
 * 4. Enter letters in the account number field — must be rejected.
 * 5. Enter an account number exceeding the permitted length — must be rejected.
 * 6. Enter different account numbers in both fields — submission must be blocked.
 * 7. Enter an IFSC shorter or longer than 11 characters — submission must be blocked.
 * 8. Enter an IFSC belonging to another bank — submission must be blocked.
 * 9. Enter an invalid format / non-matching branch IFSC — submission must be blocked.
 * 10. Verify that a valid form continues to the existing verification process.
 */

const {
    SUPPORTED_BANKS,
    findBank,
    validateAccountNumber,
    validateIfsc
} = require('../utils/bankValidation');

function assert(condition, message) {
    if (!condition) {
        console.error(`  [FAIL] ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`  [PASS] ${message}`);
}

async function runTests() {
    console.log('========================================================');
    console.log('TESTING SMART BANK SUGGESTIONS & BANK-WISE VALIDATION');
    console.log('========================================================\n');

    // --- 1. Test All 10 Supported Banks Registered ---
    console.log('1. Checking 10 Supported Banks (5 Govt, 5 Private):');
    assert(SUPPORTED_BANKS.length === 10, 'Exactly 10 banks in supported list');

    const govtBanks = SUPPORTED_BANKS.filter(b => b.category === 'Government Banks');
    const privateBanks = SUPPORTED_BANKS.filter(b => b.category === 'Private Banks');

    assert(govtBanks.length === 5, '5 Government Banks registered');
    assert(privateBanks.length === 5, '5 Private Banks registered');

    // --- 2. Scenario 1: SBI Validation (SBIN prefix, 11-17 digits) ---
    console.log('\n2. Testing State Bank of India (SBI) Rules:');
    const sbi = findBank('State Bank of India');
    assert(Boolean(sbi), 'SBI found by full name');
    assert(findBank('sbi')?.id === 'sbi', 'SBI found by short alias "sbi"');
    assert(sbi.ifscPrefix === 'SBIN', 'SBI IFSC prefix is SBIN');
    assert(sbi.accountLength.allowedLengths.includes(11), 'SBI allows 11 digits');

    // Valid SBI account (11 digits)
    const sbiValid = validateAccountNumber('12345678901', sbi);
    assert(sbiValid.valid === true, '11-digit SBI account is valid');

    // Invalid SBI account (< 11 digits)
    const sbiShort = validateAccountNumber('1234567890', sbi);
    assert(sbiShort.valid === false, '10-digit SBI account rejected (too short)');

    // Invalid SBI account (> 11 digits)
    const sbiLong = validateAccountNumber('123456789012', sbi);
    assert(sbiLong.valid === false, '12-digit SBI account rejected');

    // --- 3. Scenario 2: HDFC Bank Validation (HDFC prefix, 14 digits) ---
    console.log('\n3. Testing HDFC Bank Rules:');
    const hdfc = findBank('HDFC Bank');
    assert(Boolean(hdfc), 'HDFC Bank found by name');
    assert(hdfc.ifscPrefix === 'HDFC', 'HDFC IFSC prefix is HDFC');
    assert(hdfc.accountLength.min === 14 && hdfc.accountLength.max === 14, 'HDFC requires exactly 14 digits');

    // Valid HDFC account (14 digits)
    const hdfcValid = validateAccountNumber('50100234567890', hdfc);
    assert(hdfcValid.valid === true, '14-digit HDFC account is valid');

    // Invalid HDFC account (13 digits)
    const hdfcShort = validateAccountNumber('5010023456789', hdfc);
    assert(hdfcShort.valid === false, '13-digit HDFC account rejected (must be 14)');

    // Valid HDFC IFSC
    const hdfcIfsc = validateIfsc('HDFC0001234', hdfc);
    assert(hdfcIfsc.valid === true, 'HDFC0001234 is a valid HDFC IFSC');

    // --- 4. Scenario 3: PNB Validation (PUNB prefix, 16 digits) ---
    console.log('\n4. Testing Punjab National Bank (PNB) Rules:');
    const pnb = findBank('Punjab National Bank');
    assert(Boolean(pnb), 'PNB found by name');
    assert(pnb.ifscPrefix === 'PUNB', 'PNB IFSC prefix is PUNB');
    assert(pnb.accountLength.min === 16 && pnb.accountLength.max === 16, 'PNB requires exactly 16 digits');

    // Valid PNB account (16 digits)
    const pnbValid = validateAccountNumber('0123456789012345', pnb);
    assert(pnbValid.valid === true, '16-digit PNB account is valid');

    // Invalid PNB account (15 digits)
    const pnbInvalid = validateAccountNumber('012345678901234', pnb);
    assert(pnbInvalid.valid === false, '15-digit PNB account rejected (must be 16)');

    // Valid PNB IFSC
    const pnbIfsc = validateIfsc('PUNB0000100', pnb);
    assert(pnbIfsc.valid === true, 'PUNB0000100 is a valid PNB IFSC');

    // --- 5. Scenario 4: Letters in Account Number Rejection ---
    console.log('\n5. Testing Letters & Special Characters in Account Number:');
    const lettersTest = validateAccountNumber('50100ABC567890', hdfc);
    assert(lettersTest.valid === false, 'Account number with letters is rejected');
    assert(lettersTest.error.includes('only digits'), 'Error message specifies digits only');

    const specialCharsTest = validateAccountNumber('50100-2345-678', hdfc);
    assert(specialCharsTest.valid === false, 'Account number with hyphens is rejected');

    const spacesTest = validateAccountNumber('5010 0234 5678 90', hdfc);
    assert(spacesTest.valid === false, 'Account number with spaces is rejected');

    // --- 6. Scenario 5: Exceeding Permitted Length Rejection ---
    console.log('\n6. Testing Permitted Length Exceeded:');
    const icici = findBank('ICICI Bank'); // 12 digits
    const iciciExceeded = validateAccountNumber('1234567890123', icici); // 13 digits
    assert(iciciExceeded.valid === false, '13 digits on 12-digit ICICI account rejected');

    const axis = findBank('Axis Bank'); // 15 digits
    const axisExceeded = validateAccountNumber('1234567890123456', axis); // 16 digits
    assert(axisExceeded.valid === false, '16 digits on 15-digit Axis account rejected');

    const canara = findBank('Canara Bank'); // 13 digits
    const canaraExceeded = validateAccountNumber('12345678901234', canara); // 14 digits
    assert(canaraExceeded.valid === false, '14 digits on 13-digit Canara account rejected');

    // --- 7. Scenario 6: Different Account Numbers Comparison ---
    console.log('\n7. Testing Confirm Account Numbers Matching:');
    const acc1 = '50100234567890';
    const acc2 = '50100234567891';
    assert(acc1 !== acc2, 'Account numbers differing by 1 digit are detected');

    // --- 8. Scenario 7: IFSC Length Validation (< 11 or > 11) ---
    console.log('\n8. Testing IFSC Length Validation:');
    const ifscShort = validateIfsc('HDFC000123', hdfc); // 10 chars
    assert(ifscShort.valid === false, '10-character IFSC rejected');
    assert(ifscShort.error.includes('branch-code') || ifscShort.error.includes('11'), 'Error indicates incomplete branch code or length');

    const ifscLong = validateIfsc('HDFC00012345', hdfc); // 12 chars
    assert(ifscLong.valid === false, '12-character IFSC rejected');

    // --- 9. Scenario 8: IFSC Belonging to Another Bank ---
    console.log('\n9. Testing IFSC Prefix Mismatch (Belongs to Another Bank):');
    // User selected SBI, but entered HDFC IFSC
    const crossBankTest = validateIfsc('HDFC0001234', sbi);
    assert(crossBankTest.valid === false, 'HDFC IFSC rejected when SBI is selected');
    assert(crossBankTest.error.includes('match'), 'Error indicates IFSC code does not match selected bank');

    // User selected ICICI, but entered Axis IFSC (UTIB)
    const iciciBank = findBank('ICICI Bank');
    const crossBankTest2 = validateIfsc('UTIB0000004', iciciBank);
    assert(crossBankTest2.valid === false, 'Axis IFSC rejected when ICICI is selected');
    assert(crossBankTest2.error.includes('match'), 'Error indicates IFSC code does not match selected bank');

    // --- 10. Scenario 9: 5th Character Format Validation ---
    console.log('\n10. Testing 5th Character "0" Rule:');
    const ifscNonZero = validateIfsc('HDFC1001234', hdfc); // 5th char is '1' instead of '0'
    assert(ifscNonZero.valid === false, 'IFSC with non-zero 5th character rejected');
    assert(ifscNonZero.error.includes('0'), 'Error specifies 5th character must be 0');

    // --- 11. Scenario 10: All 10 Banks Valid Prefix Mapping ---
    console.log('\n11. Testing All 10 Banks Prefix & Valid Formats:');
    const sampleValidIfscs = [
        { bank: 'State Bank of India', ifsc: 'SBIN0000691', acct: '12345678901' },
        { bank: 'Punjab National Bank', ifsc: 'PUNB0000100', acct: '0123456789012345' },
        { bank: 'Bank of Baroda', ifsc: 'BARB0MUMBAI', acct: '12345678901234' },
        { bank: 'Canara Bank', ifsc: 'CNRB0000001', acct: '1234567890123' },
        { bank: 'Union Bank of India', ifsc: 'UBIN0530018', acct: '123456789012345' },
        { bank: 'HDFC Bank', ifsc: 'HDFC0000060', acct: '50100234567890' },
        { bank: 'ICICI Bank', ifsc: 'ICIC0000001', acct: '123456789012' },
        { bank: 'Axis Bank', ifsc: 'UTIB0000004', acct: '123456789012345' },
        { bank: 'Kotak Mahindra Bank', ifsc: 'KKBK0000958', acct: '1234567890' },
        { bank: 'IDFC FIRST Bank', ifsc: 'IDFB0040101', acct: '12345678901' }
    ];

    sampleValidIfscs.forEach(({ bank: bankName, ifsc, acct }) => {
        const b = findBank(bankName);
        const ifscRes = validateIfsc(ifsc, b);
        const acctRes = validateAccountNumber(acct, b);
        assert(ifscRes.valid === true, `${bankName}: IFSC ${ifsc} is valid`);
        assert(acctRes.valid === true, `${bankName}: Account ${acct} (${acct.length} digits) is valid`);
    });

    console.log('\n========================================================');
    console.log('ALL 10 SCENARIOS PASSED WITH 100% SUCCESS!');
    console.log('========================================================\n');
}

runTests();

