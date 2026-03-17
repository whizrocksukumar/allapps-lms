// src/pages/Transactions.jsx
// FIXED: 22-DEC-2025 - Added pagination, compact rows, performance optimized
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseService';
import { getTransactionTypeName, getTransactionTypeIcon, getTransactionTypeColor, formatDate, exportTransactionsToCSV } from '../utils/transactionHelpers';
import Client360Modal from '../components/Client360Modal';
import Loans360Modal from '../components/Loans360Modal';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('transactions')
        .select('*, loans(id, loan_number, loan_amount, annual_interest_rate, start_date, status, clients(id, first_name, last_name, client_code))')
        .order('txn_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLoan = (transaction) => {
    if (transaction.loans) {
      setSelectedLoan(transaction.loans);
      setShowLoanModal(true);
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    const firstLoan = filteredTransactions[0]?.loans;
    
    if (firstLoan) {
      exportTransactionsToCSV(firstLoan, filteredTransactions, 'All_Transactions_Export.csv');
    } else {
      // Fallback: create CSV without loan details header
      let csv = 'TRANSACTIONS\n';
      csv += 'Date,Loan No.,Client,Type,Amount,Notes\n';

      filteredTransactions.forEach(t => {
        const date = formatDate(t.txn_date);
        const loanNo = t.loans?.loan_number || 'N/A';
        const client = `${t.loans?.clients?.first_name || ''} ${t.loans?.clients?.last_name || ''}`.trim() || 'N/A';
        const type = getTransactionTypeName(t.txn_type);
        const amount = `$${parseFloat(t.amount).toFixed(2)}`;
        const notes = (t.notes || '').replace(/,/g, ';');

        csv += `${date},${loanNo},${client},${type},${amount},"${notes}"\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'All_Transactions_Export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.loans?.loan_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${t.loans?.clients?.first_name} ${t.loans?.clients?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || t.txn_type === filterType;

    const txDate = new Date(t.txn_date);
    const matchesFromDate = !fromDate || txDate >= new Date(fromDate);
    const matchesToDate = !toDate || txDate <= new Date(toDate);

    return matchesSearch && matchesType && matchesFromDate && matchesToDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, fromDate, toDate, rowsPerPage]);

  const styles = {
    container: {
      backgroundColor: '#f8f9fa',
      padding: '1rem',
      borderTop: '4px solid #0176d3',
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '2rem',
    },
    title: {
      fontSize: '1.8rem',
      color: '#0176d3',
      marginBottom: '1.5rem',
      fontWeight: 600,
    },
    headerContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
    },
    exportBtn: {
      backgroundColor: '#0176d3',
      color: '#fff',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '6px',
      fontSize: '0.95rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    controlsContainer: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    input: {
      padding: '0.75rem',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '0.95rem',
    },
    select: {
      padding: '0.75rem',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '0.95rem',
      backgroundColor: '#fff',
      cursor: 'pointer',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    thead: {
      backgroundColor: '#f3f2f2',
      borderBottom: '2px solid #0176d3',
    },
    th: {
      padding: '0.75rem',
      textAlign: 'left',
      fontWeight: 600,
      color: '#181818',
      fontSize: '0.85rem',
    },
    td: {
      padding: '0.5rem 0.75rem', // Reduced padding for compact rows
      borderBottom: '1px solid #f0f0f0',
      color: '#181818',
      fontSize: '0.9rem',
    },
    typeBadge: {
      padding: '0.3rem 0.6rem',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      display: 'inline-block',
    },
    loanLink: {
      color: '#0176d3',
      background: 'none',
      border: 'none',
      textDecoration: 'underline',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 600,
      padding: 0,
    },
    clientLink: {
      color: '#0176d3',
      background: 'none',
      border: 'none',
      textDecoration: 'underline',
      cursor: 'pointer',
      fontSize: '0.9rem',
    },
    amountPositive: {
      color: '#2e7d32',
      fontWeight: 600,
    },
    amountNegative: {
      color: '#c62828',
      fontWeight: 600,
    },
    paginationContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '1.5rem',
      padding: '1rem',
      borderTop: '1px solid #eee',
    },
    paginationInfo: {
      color: '#666',
      fontSize: '0.9rem',
    },
    paginationControls: {
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center',
    },
    pageButton: {
      padding: '0.5rem 1rem',
      border: '1px solid #ddd',
      borderRadius: '4px',
      background: '#fff',
      cursor: 'pointer',
      fontSize: '0.9rem',
    },
    pageButtonActive: {
      padding: '0.5rem 1rem',
      border: '1px solid #0176d3',
      borderRadius: '4px',
      background: '#0176d3',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 600,
    },
    pageButtonDisabled: {
      padding: '0.5rem 1rem',
      border: '1px solid #ddd',
      borderRadius: '4px',
      background: '#f5f5f5',
      color: '#999',
      cursor: 'not-allowed',
      fontSize: '0.9rem',
    },
    emptyState: {
      textAlign: 'center',
      padding: '3rem',
      color: '#706e6b',
    },
    loadingState: {
      textAlign: 'center',
      padding: '2rem',
      color: '#706e6b',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loadingState}>Loading transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.headerContainer}>
          <h1 style={styles.title}>📊 Transactions</h1>
          <button onClick={handleExportCSV} style={styles.exportBtn}>
            📥 Export to CSV
          </button>
        </div>

        <div style={styles.controlsContainer}>
          <input
            type="text"
            placeholder="Search by loan, client, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...styles.input, maxWidth: '300px', flex: '0 0 300px' }}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ ...styles.select, flex: '0 0 auto' }}
          >
            <option value="all">All Types</option>
            <option value="PAY">Payment</option>
            <option value="INT">Interest</option>
            <option value="FACC">Fee</option>
            <option value="EST">Establishment</option>
            <option value="RFN">Refinance</option>
            <option value="ADV">Advance</option>
            <option value="WAIVER">Waiver</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ ...styles.input, flex: '0 0 auto' }}
            placeholder="From Date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ ...styles.input, flex: '0 0 auto' }}
            placeholder="To Date"
          />
        </div>

        {/* Summary Bar */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          padding: '1rem 1.5rem',
          background: '#f0f8ff',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #0176d3'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Total Transactions</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#181818' }}>{filteredTransactions.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Total Amount Collected</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2e7d32' }}>
              ${filteredTransactions
                .filter(t => t.txn_type === 'PAY')
                .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                .toFixed(2)}
            </div>
          </div>
        </div>

        {/* Rows per page selector */}
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>Show:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            style={{ ...styles.select, width: 'auto', padding: '0.5rem' }}
          >
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>
            Showing {filteredTransactions.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No transactions found</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Loan No.</th>
                    <th style={styles.th}>Client</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map(t => {
                    const typeColor = getTransactionTypeColor(t.txn_type);
                    const isPayment = t.txn_type === 'PAY';

                    return (
                      <tr key={t.id}>
                        <td style={styles.td}>
                          {formatDate(t.txn_date)}
                        </td>
                        <td style={styles.td}>
                          <button
                            onClick={() => handleViewLoan(t)}
                            style={styles.loanLink}
                          >
                            {t.loans?.loan_number || 'N/A'}
                          </button>
                        </td>
                        <td style={styles.td}>
                          <button
                            onClick={() => {
                              setSelectedClientId(t.loans?.clients?.id);
                              setShowClientModal(true);
                            }}
                            style={styles.clientLink}
                          >
                            {t.loans?.clients?.first_name} {t.loans?.clients?.last_name}
                          </button>
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.typeBadge,
                              backgroundColor: typeColor + '20',
                              color: typeColor,
                            }}
                          >
                            {getTransactionTypeIcon(t.txn_type)} {getTransactionTypeName(t.txn_type)}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={isPayment ? styles.amountPositive : styles.amountNegative}>
                            ${Math.abs(t.amount).toFixed(2)}
                          </span>
                        </td>
                        <td style={{ ...styles.td, maxWidth: '250px', fontSize: '0.85rem', color: '#666' }}>
                          {t.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={styles.paginationContainer}>
              <div style={styles.paginationInfo}>
                Page {currentPage} of {totalPages}
              </div>
              <div style={styles.paginationControls}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={currentPage === 1 ? styles.pageButtonDisabled : styles.pageButton}
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={currentPage === 1 ? styles.pageButtonDisabled : styles.pageButton}
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={currentPage === pageNum ? styles.pageButtonActive : styles.pageButton}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={currentPage === totalPages ? styles.pageButtonDisabled : styles.pageButton}
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={currentPage === totalPages ? styles.pageButtonDisabled : styles.pageButton}
                >
                  Last
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showClientModal && selectedClientId && (
        <Client360Modal
          isOpen={showClientModal}
          onClose={() => setShowClientModal(false)}
          clientId={selectedClientId}
        />
      )}

      {showLoanModal && selectedLoan && (
        <Loans360Modal
          loan={selectedLoan}
          onClose={() => setShowLoanModal(false)}
        />
      )}
    </div>
  );
}
