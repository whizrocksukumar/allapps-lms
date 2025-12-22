// src/pages/Transactions.jsx
// Updated: 22-DEC-2025 - Added CSV export, friendly type names, loan hyperlinks
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

    // For export, if we have a single loan filter, include loan details
    // Otherwise, create a generic export
    const firstLoan = filteredTransactions[0]?.loans;
    
    if (firstLoan) {
      exportTransactionsToCSV(firstLoan, filteredTransactions, 'All_Transactions_Export.csv');
    } else {
      // Fallback: create CSV without loan details header
      let csv = 'TRANSACTIONS\n';
      csv += 'Date,Loan No.,Client,Type,Amount,Reference,Notes\n';
      
      filteredTransactions.forEach(t => {
        const date = formatDate(t.txn_date);
        const loanNo = t.loans?.loan_number || 'N/A';
        const client = `${t.loans?.clients?.first_name || ''} ${t.loans?.clients?.last_name || ''}`.trim() || 'N/A';
        const type = getTransactionTypeName(t.txn_type);
        const amount = `$${parseFloat(t.amount).toFixed(2)}`;
        const reference = t.reference_number || '';
        const notes = (t.notes || '').replace(/,/g, ';');
        
        csv += `${date},${loanNo},${client},${type},${amount},${reference},"${notes}"\n`;
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

  const styles = {
    container: {
      backgroundColor: '#f8f9fa',
      padding: '2rem',
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
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem',
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
      padding: '1rem',
      textAlign: 'left',
      fontWeight: 600,
      color: '#181818',
    },
    td: {
      padding: '1rem',
      borderBottom: '1px solid #f0f0f0',
      color: '#181818',
    },
    typeBadge: {
      padding: '0.4rem 0.8rem',
      borderRadius: '6px',
      fontSize: '0.8rem',
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
      fontSize: '0.95rem',
      fontWeight: 600,
      padding: 0,
    },
    clientLink: {
      color: '#0176d3',
      background: 'none',
      border: 'none',
      textDecoration: 'underline',
      cursor: 'pointer',
      fontSize: '0.95rem',
    },
    amountPositive: {
      color: '#2e7d32',
      fontWeight: 600,
    },
    amountNegative: {
      color: '#c62828',
      fontWeight: 600,
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
            style={styles.input}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={styles.select}
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
            style={styles.input}
            placeholder="From Date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={styles.input}
            placeholder="To Date"
          />
        </div>

        {filteredTransactions.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No transactions found</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem', color: '#706e6b', fontSize: '0.9rem' }}>
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Loan No.</th>
                    <th style={styles.th}>Client</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Reference</th>
                    <th style={styles.th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(t => {
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
                        <td style={styles.td}>
                          {t.reference_number || '-'}
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