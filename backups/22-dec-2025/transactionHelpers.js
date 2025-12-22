// src/utils/transactionHelpers.js
// Transaction type mapping and formatting utilities

/**
 * Map transaction type codes to friendly display names
 */
export const getTransactionTypeName = (typeCode) => {
  const typeMap = {
    // Payment types
    'PAY': 'Payment',
    'PAYMENT': 'Payment',
    
    // Fee types
    'FACC': 'Fee',
    'FEE': 'Fee',
    'FREF': 'Fee Refund',
    'FEE_REFUND': 'Fee Refund',
    'LATE_FEE': 'Late Fee',
    'DISHONOR_FEE': 'Dishonor Fee',
    
    // Interest types
    'INT': 'Interest',
    'INTEREST': 'Interest',
    'INTEREST_CHARGE': 'Interest Charge',
    
    // Loan setup
    'ADV': 'Advance',
    'ADVANCE': 'Advance',
    'EST': 'Establishment',
    'ESTABLISHMENT': 'Establishment Fee',
    
    // Loan changes
    'RFN': 'Refinance',
    'REFINANCE': 'Refinance',
    'LOAN_CREATE': 'Loan Created',
    
    // Adjustments
    'WAIVER': 'Waiver',
    'ADJUSTMENT': 'Adjustment',
    'ADJ': 'Adjustment',
    
    // Principal
    'PRINCIPAL': 'Principal',
    'PRIN': 'Principal Payment',
  };

  return typeMap[typeCode?.toUpperCase()] || typeCode || 'Other';
};

/**
 * Get transaction type icon
 */
export const getTransactionTypeIcon = (typeCode) => {
  const iconMap = {
    'PAY': '💳',
    'PAYMENT': '💳',
    'FACC': '🧾',
    'FEE': '🧾',
    'FREF': '💚',
    'INT': '📈',
    'INTEREST': '📈',
    'ADV': '💰',
    'ADVANCE': '💰',
    'EST': '📋',
    'ESTABLISHMENT': '📋',
    'RFN': '🔄',
    'REFINANCE': '🔄',
    'WAIVER': '💼',
    'ADJUSTMENT': '⚙️',
    'PRINCIPAL': '💵',
    'LOAN_CREATE': '🆕',
  };

  return iconMap[typeCode?.toUpperCase()] || '📝';
};

/**
 * Get transaction type color for badges/styling
 */
export const getTransactionTypeColor = (typeCode) => {
  const colorMap = {
    'PAY': '#2e7d32',      // Green - money in
    'PAYMENT': '#2e7d32',
    'FACC': '#e65100',     // Orange - fees
    'FEE': '#e65100',
    'FREF': '#4caf50',     // Light green - refund
    'INT': '#1565c0',      // Blue - interest
    'INTEREST': '#1565c0',
    'ADV': '#00695c',      // Teal - advance
    'ADVANCE': '#00695c',
    'EST': '#f57c00',      // Amber - establishment
    'ESTABLISHMENT': '#f57c00',
    'RFN': '#7b1fa2',      // Purple - refinance
    'REFINANCE': '#7b1fa2',
    'WAIVER': '#6a1b9a',   // Deep purple
    'ADJUSTMENT': '#c62828', // Red
    'PRINCIPAL': '#00695c',
    'LOAN_CREATE': '#0176d3',
  };

  return colorMap[typeCode?.toUpperCase()] || '#181818';
};

/**
 * Format transaction for display (with icon + friendly name)
 */
export const formatTransactionType = (typeCode, includeIcon = true) => {
  const icon = includeIcon ? getTransactionTypeIcon(typeCode) + ' ' : '';
  const name = getTransactionTypeName(typeCode);
  return `${icon}${name}`;
};

/**
 * Format currency for NZ locale
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(amount || 0);
};

/**
 * Format date for NZ locale
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-NZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Export transactions to CSV with loan details header
 */
export const exportTransactionsToCSV = (loan, transactions, filename) => {
  const client = loan?.clients || {};
  
  // Build CSV content
  let csv = '';
  
  // Header section with loan details
  csv += 'LOAN DETAILS\n';
  csv += `Loan Number,${loan.loan_number}\n`;
  csv += `Customer,${client.first_name || ''} ${client.last_name || ''}\n`;
  csv += `Customer Code,${client.client_code || ''}\n`;
  csv += `Rate,${loan.annual_interest_rate}%\n`;
  csv += `Principal,$${loan.loan_amount?.toFixed(2) || '0.00'}\n`;
  csv += `Start Date,${formatDate(loan.start_date)}\n`;
  csv += `Status,${loan.status?.toUpperCase()}\n`;
  csv += '\n'; // Blank line separator
  
  // Transaction data
  csv += 'TRANSACTIONS\n';
  csv += 'Date,Reference,Transaction,Debit,Credit,Balance,Notes\n';
  
  transactions.forEach(t => {
    const date = formatDate(t.txn_date || t.transaction_date);
    const reference = t.reference_number || t.reference || '';
    const type = getTransactionTypeName(t.txn_type || t.transaction_type);
    const isCredit = (t.txn_type || t.transaction_type) === 'PAY';
    const debit = !isCredit ? `$${parseFloat(t.amount).toFixed(2)}` : '';
    const credit = isCredit ? `$${parseFloat(t.amount).toFixed(2)}` : '';
    const balance = t.balance_after_transaction ? `$${parseFloat(t.balance_after_transaction).toFixed(2)}` : '';
    const notes = (t.notes || t.description || '').replace(/,/g, ';'); // Replace commas to avoid CSV issues
    
    csv += `${date},${reference},${type},${debit},${credit},${balance},"${notes}"\n`;
  });
  
  // Download the file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export repayment schedule to CSV
 */
export const exportScheduleToCSV = (loan, schedule, filename) => {
  const client = loan?.clients || {};
  
  let csv = '';
  
  // Header
  csv += 'LOAN DETAILS\n';
  csv += `Loan Number,${loan.loan_number}\n`;
  csv += `Customer,${client.first_name || ''} ${client.last_name || ''}\n`;
  csv += `Customer Code,${client.client_code || ''}\n`;
  csv += `Rate,${loan.annual_interest_rate}%\n`;
  csv += `Term,${loan.term} ${loan.repayment_frequency}\n`;
  csv += '\n';
  
  // Schedule data
  csv += 'REPAYMENT SCHEDULE\n';
  csv += 'Instalment No.,Due Date,Principal,Interest,Total Amount,Status\n';
  
  schedule.forEach(i => {
    csv += `${i.instalment_number},${formatDate(i.due_date)},`;
    csv += `$${(i.principal_amount || 0).toFixed(2)},`;
    csv += `$${(i.interest_amount || 0).toFixed(2)},`;
    csv += `$${(i.total_amount || 0).toFixed(2)},`;
    csv += `${i.status}\n`;
  });
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};