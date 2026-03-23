// src/components/LoanAgreementGenerator.jsx
// Generates a PDF Credit Contract using jsPDF (A4, 20mm margins)
import { jsPDF } from 'jspdf';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const USABLE_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = PAGE_H - 12;

// ── helpers ────────────────────────────────────────────────────────────────────

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NZ', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtMoney(val) {
  const n = parseFloat(val) || 0;
  return `$${n.toFixed(2)}`;
}

function addFirstPaymentDate(startDate, frequency) {
  const d = new Date(startDate);
  if (frequency === 'Weekly') d.setDate(d.getDate() + 7);
  else if (frequency === 'Fortnightly') d.setDate(d.getDate() + 14);
  else d.setMonth(d.getMonth() + 1);
  return fmtDate(d.toISOString());
}

function periodLabel(frequency) {
  if (frequency === 'Weekly') return 'weekly';
  if (frequency === 'Fortnightly') return 'fortnightly';
  return 'monthly';
}

// ── PDF builder ────────────────────────────────────────────────────────────────

export function generateLoanAgreement(loan, client) {
  const doc = new jsPDF('p', 'mm', 'a4');

  let y = MARGIN;

  // ── state helpers ────────────────────────────────────────────────────────────

  function checkPageBreak(needed = 8) {
    if (y + needed > FOOTER_Y - 8) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function addFooter() {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('Initials  .............', MARGIN, FOOTER_Y);
      doc.text(`Page ${i} of ${total}`, PAGE_W - MARGIN, FOOTER_Y, { align: 'right' });
      doc.setTextColor(0);
    }
  }

  function heading(text, size = 11) {
    checkPageBreak(10);
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.text(text, MARGIN, y);
    y += size * 0.45 + 2;
  }

  function sectionBar(text) {
    checkPageBreak(10);
    doc.setFillColor(1, 118, 211); // #0176d3
    doc.rect(MARGIN, y, USABLE_W, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255);
    doc.text(text.toUpperCase(), MARGIN + 2, y + 5);
    doc.setTextColor(0);
    y += 10;
  }

  function row(label, value, labelW = 75) {
    checkPageBreak(7);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(label, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value ?? ''), MARGIN + labelW, y);
    y += 6;
  }

  function body(text, indent = 0) {
    checkPageBreak(6);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, USABLE_W - indent);
    lines.forEach(line => {
      checkPageBreak(5);
      doc.text(line, MARGIN + indent, y);
      y += 5;
    });
  }

  function gap(mm = 4) { y += mm; }

  function hRule() {
    checkPageBreak(4);
    doc.setDrawColor(200);
    doc.line(MARGIN, y, MARGIN + USABLE_W, y);
    y += 4;
    doc.setDrawColor(0);
  }

  // ── derived values ────────────────────────────────────────────────────────────

  const loanAmount      = parseFloat(loan.loan_amount) || 0;
  const estFee          = parseFloat(loan.establishment_fee) || 0;
  const repayAmt        = parseFloat(loan.repayment_amount) || 0;
  const term            = parseInt(loan.term_months) || 0;
  const annualRate      = parseFloat(loan.annual_interest_rate) || 0;
  const dailyRate       = annualRate / 100 / 365;
  const totalPayments   = repayAmt * term;
  const totalInterest   = Math.max(0, totalPayments - loanAmount - estFee);
  const initialBalance  = loanAmount + estFee;
  const frequency       = loan.repayment_frequency || 'Weekly';

  const clientName  = `${client?.first_name || ''} ${client?.last_name || ''}`.trim();
  const clientAddr  = [client?.address, client?.city].filter(Boolean).join(', ') || '';

  // ── PAGE 1 ────────────────────────────────────────────────────────────────────

  // Logo / lender name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(1, 118, 211);
  doc.text('AAL Finance', MARGIN, y);
  doc.setTextColor(0);
  y += 8;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('CREDIT CONTRACT AND DISCLOSURE STATEMENT', MARGIN, y);
  y += 10;

  hRule();

  // Two-column address block
  const colR = MARGIN + USABLE_W / 2 + 10;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Lender', MARGIN, y);
  doc.text('Borrower', colR, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  const lenderLines = ['AAL Finance', 'PO Box 31515', 'Lower Hutt 5040', '045866637'];
  const borrowerLines = [clientName, ...(clientAddr ? [clientAddr] : [])];

  const maxLines = Math.max(lenderLines.length, borrowerLines.length);
  for (let i = 0; i < maxLines; i++) {
    doc.text(lenderLines[i] || '', MARGIN, y);
    doc.text(borrowerLines[i] || '', colR, y);
    y += 5;
  }

  gap(4);
  hRule();

  // Account summary row
  row('Account Number:', loan.loan_number);
  row('Effective Date:', fmtDate(loan.start_date));
  row('Account Name:', clientName);
  row('Account Type:', 'Consumer Credit Loan');

  gap(4);

  // ── CREDIT DETAILS ────────────────────────────────────────────────────────────

  sectionBar('Credit Details');

  row('Initial Unpaid Balance:', fmtMoney(initialBalance));
  row('Loan Advance:', fmtMoney(loanAmount));
  row('Establishment Fee:', fmtMoney(estFee));

  gap(2);

  // ── PAYMENTS ─────────────────────────────────────────────────────────────────

  sectionBar('Payment Details');

  row('Number of Payments:', `${term} payments (${periodLabel(frequency)})`);
  row('First Payment Date:', addFirstPaymentDate(loan.start_date, frequency));
  row('Repayment Amount:', fmtMoney(repayAmt));
  row('Total of All Payments:', fmtMoney(totalPayments));

  gap(2);

  // ── INTEREST ─────────────────────────────────────────────────────────────────

  sectionBar('Interest');

  row('Annual Interest Rate:', `${annualRate}% per annum (fixed)`);
  row('Daily Interest Rate:', dailyRate.toFixed(12));
  row('Total Interest Charges:', fmtMoney(totalInterest));
  gap(2);
  body('Interest is calculated daily on the outstanding principal balance and charged in accordance with the standard daily interest method.');

  gap(2);

  // ── CREDIT FEES ──────────────────────────────────────────────────────────────

  sectionBar('Credit Fees');

  row('Account Fee:', '$2.00 charged weekly (administration fee)');
  row('Management Fee:', '$25.00 charged weekly');

  gap(2);

  // ── CONTINUING DISCLOSURE ────────────────────────────────────────────────────

  sectionBar('Continuing Disclosure');

  body('You have the right to receive a statement of your account at any time upon request. Statements will be provided at least once per year or as required by the Credit Contracts and Consumer Finance Act 2003 (CCCFA).');

  gap(2);

  // ── DEFAULT FEES ─────────────────────────────────────────────────────────────

  sectionBar('Default');

  body('If you miss a payment or are otherwise in default under this contract, you may be charged a default fee of $5.00 per week for every week that you are in default. Interest will continue to accrue on any outstanding amount.');
  gap(1);
  body('We may also take steps to recover the outstanding balance including referral to a debt collection agency, which may incur additional costs that you will be liable for.');

  gap(2);

  // ── RIGHT TO CANCEL ──────────────────────────────────────────────────────────

  sectionBar('Right to Cancel');

  body('You have the right to cancel this contract within 3 working days of receiving a copy of this contract, or within 5 working days if the contract was sent to you by electronic means. To cancel, you must return any goods or money received and notify us in writing.');

  gap(2);

  // ── DISPUTE RESOLUTION ───────────────────────────────────────────────────────

  sectionBar('Dispute Resolution');

  body('If you have a complaint, please contact us in the first instance. If we cannot resolve your complaint, you may refer the matter to the Financial Services Complaints Limited (FSCL):');
  gap(1);
  body('Financial Services Complaints Limited (FSCL)', 4);
  body('PO Box 5967, Lambton Quay, Wellington 6145', 4);
  body('Phone: 0800 347 257  |  Email: complaints@fscl.org.nz', 4);
  body('Website: www.fscl.org.nz', 4);

  gap(2);

  // ── FSP REGISTRATION ─────────────────────────────────────────────────────────

  sectionBar('FSP Registration');

  body('AAL Finance is registered on the Financial Service Providers Register. FSP Registration Number: FSP302446.');
  body('Registered under the Financial Service Providers (Registration and Dispute Resolution) Act 2008.');

  gap(2);

  // ── TERMS AND CONDITIONS ─────────────────────────────────────────────────────

  sectionBar('Terms and Conditions (Summary)');

  const terms = [
    '1. Repayments must be made on the due dates specified in this contract.',
    '2. You must notify us immediately if your contact details change.',
    '3. You must not assign your rights under this contract without our prior written consent.',
    '4. We may vary the terms of this contract in accordance with the CCCFA.',
    '5. All fees and charges are inclusive of GST where applicable.',
    '6. Security may be required at our discretion.',
    '7. Early repayment is permitted without penalty.',
    '8. This contract is governed by the laws of New Zealand.',
  ];
  terms.forEach(t => { body(t); gap(1); });

  gap(4);

  // ── SIGNATURE BLOCKS ─────────────────────────────────────────────────────────

  sectionBar('Signatures');

  gap(2);

  checkPageBreak(50);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Borrower signature
  doc.text('Borrower Signature:', MARGIN, y);
  doc.line(MARGIN + 45, y, MARGIN + 120, y);
  y += 8;
  doc.text('Full Name:', MARGIN, y);
  doc.line(MARGIN + 45, y, MARGIN + 120, y);
  y += 8;
  doc.text('Date:', MARGIN, y);
  doc.line(MARGIN + 45, y, MARGIN + 85, y);
  y += 14;

  // Lender signature
  doc.text('Authorised by AAL Finance:', MARGIN, y);
  doc.line(MARGIN + 55, y, MARGIN + 120, y);
  y += 8;
  doc.text('Name:', MARGIN, y);
  doc.line(MARGIN + 45, y, MARGIN + 120, y);
  y += 8;
  doc.text('Date:', MARGIN, y);
  doc.line(MARGIN + 45, y, MARGIN + 85, y);
  y += 8;

  gap(4);
  body(`Generated: ${new Date().toLocaleDateString('en-NZ', { day: '2-digit', month: 'long', year: 'numeric' })}`);

  // ── footers on all pages ─────────────────────────────────────────────────────

  addFooter();

  // ── save ─────────────────────────────────────────────────────────────────────

  const today = new Date().toISOString().split('T')[0];
  doc.save(`Loan_Agreement_${loan.loan_number}_${today}.pdf`);
}
