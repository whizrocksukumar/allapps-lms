import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseService';
import Client360Modal from '../components/Client360Modal';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
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
        .select('*, loans(id, loan_number, clients(id, first_name, last_name))')
        .order('transaction_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.loans?.loan_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${t.loans?.clients?.first_name} ${t.loans?.clients?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || t.transaction_type === filterType;

    const txDate = new Date(t.transaction_date);
    const matchesFromDate = !fromDate || txDate >= new Date(fromDate);
    const matchesToDate = !toDate || txDate <= new Date(toDate);

    return matchesSearch && matchesType && matchesFromDate && matchesToDate;
  });

  const getTransactionTypeColor = (type) => {
    const colors = {
      payment: '#2e7d32',
      fee: '#e65100',
      interest: '#1565c0',
      waiver: '#6a1b9a',
      adjustment: '#c62828',
      principal: '#00695c',
    };
    return colors[type] || '#181818';
  };

  const getTransactionTypeIcon = (type) => {
    const icons = {
      payment: '💳',
      fee: '🧾',
      interest: '📈',
      waiver: '💼',
      adjustment: '🔄',
      principal: '💰',
    };
    return icons[type] || '📝';
  };

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
        <h1 style={styles.title}>📊 Transactions</h1>

        <div style={styles.controlsContainer}>
          <input
            type="text"
            placeholder="Search by loan, client, or description..."
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
            <option value="payment">Payment</option>
            <option value="fee">Fee</option>
            <option value="interest">Interest</option>
            <option value="waiver">Waiver</option>
            <option value="adjustment">Adjustment</option>
            <option value="principal">Principal</option>
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
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Loan #</th>
                  <th style={styles.th}>Client</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Reference</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(t => (
                  <tr key={t.id}>
                    <td style={styles.td}>
                      {new Date(t.transaction_date).toLocaleDateString('en-NZ')}
                    </td>
                    <td style={styles.td}>
                      <strong>{t.loans?.loan_number || 'N/A'}</strong>
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
                          backgroundColor: getTransactionTypeColor(t.transaction_type) + '20',
                          color: getTransactionTypeColor(t.transaction_type),
                        }}
                      >
                        {getTransactionTypeIcon(t.transaction_type)} {t.transaction_type}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {t.description}
                    </td>
                    <td style={styles.td}>
                      <span style={t.amount > 0 ? styles.amountPositive : styles.amountNegative}>
                        ${Math.abs(t.amount).toFixed(2)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {t.reference_number || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}