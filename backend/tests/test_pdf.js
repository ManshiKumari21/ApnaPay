const generateTransactionPdf = (transactions, user, summary) => {
    const lines = [
        '================================================================================',
        '                        APNAPAY TRANSACTION STATEMENT                           ',
        '================================================================================',
        '',
        `Account Holder: ${user.full_name || 'Customer'}`,
        `Account Email : ${user.email || 'N/A'} | Phone: ${user.phone || 'N/A'}`,
        `Statement Date: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`,
        `Total Credits : INR ${(summary.totalCredit || 0).toFixed(2)} | Total Debits: INR ${(summary.totalDebit || 0).toFixed(2)}`,
        `Net Flow      : INR ${(summary.netAmount || 0).toFixed(2)}`,
        '--------------------------------------------------------------------------------',
        'ID        DATE        TYPE        AMOUNT (INR)  STATUS      REFERENCE',
        '--------------------------------------------------------------------------------',
    ];

    transactions.forEach(t => {
        const idStr = String(t.id).padEnd(9);
        const dateStr = String(t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : 'N/A').padEnd(12);
        const typeStr = String(t.transactionType || 'txn').slice(0, 10).padEnd(12);
        const sign = t.entryType === 'credit' ? '+' : '-';
        const amtStr = (sign + Number(t.amount).toFixed(2)).padEnd(14);
        const statusStr = String(t.status || 'N/A').slice(0, 10).padEnd(12);
        const refStr = String(t.referenceId || 'N/A').slice(0, 16);
        lines.push(`${idStr}${dateStr}${typeStr}${amtStr}${statusStr}${refStr}`);
    });

    lines.push('--------------------------------------------------------------------------------');
    lines.push('                      End of ApnaPay Statement                                 ');

    const escapePdf = (str) => String(str).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    
    let streamContent = 'BT\n/F1 9 Tf\n14 TL\n50 740 Td\n';
    lines.forEach((line, idx) => {
        if (idx === 0) {
            streamContent += `(${escapePdf(line)}) Tj\n`;
        } else {
            streamContent += `T*\n(${escapePdf(line)}) Tj\n`;
        }
    });
    streamContent += 'ET';

    const streamLength = Buffer.byteLength(streamContent, 'utf-8');

    const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
    const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
    const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n';

    const header = '%PDF-1.4\n';
    let offset = Buffer.byteLength(header, 'utf-8');

    const offsets = [];
    [obj1, obj2, obj3, obj4, obj5].forEach(obj => {
        offsets.push(offset);
        offset += Buffer.byteLength(obj, 'utf-8');
    });

    let xref = 'xref\n0 6\n0000000000 65535 f \n';
    offsets.forEach(off => {
        xref += String(off).padStart(10, '0') + ' 00000 n \n';
    });

    const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;

    return Buffer.from(header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer, 'utf-8');
};

const pdf = generateTransactionPdf(
    [{ id: 1, createdAt: new Date(), transactionType: 'payment', entryType: 'debit', amount: 1500, status: 'completed', referenceId: 'REF1234' }],
    { full_name: 'Gopal Parmar', email: 'gopal@example.com', phone: '9876543210' },
    { totalCredit: 5000, totalDebit: 1500, netAmount: 3500 }
);

console.log('PDF Generated Successfully! Byte length:', pdf.length);
console.log('Starts with:', pdf.subarray(0, 8).toString('utf-8'));
console.log('Ends with:', pdf.subarray(pdf.length - 10).toString('utf-8'));

