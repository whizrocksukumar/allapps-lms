// src/pages/RepaymentSchedule.jsx
// Updated: 22-DEC-2025 - Added loan hyperlinks, payments made column, changed # to No.
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { formatDate } from '../utils/transactionHelpers';
import Client360Modal from '../components/Client360Modal';
import Loans360Modal from '../components/Loans360Modal';

export default function RepaymentSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paymentsMap, setPaymentsMap] = useState({});

  useEffect(() => {
    fetchSchedules();
    fetchPaymentsCounts();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('repayment_schedule')
        .select('*, loans(id, loan_number, annual_interest_rate, clients(id, first_name, last_name))')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentsCounts = async () => {
    try {
      // Count all payments (PAY type) per loan
      const { data, error } = await supabase
        .from('transactions')
        .select('loan_id, txn_type')
        .eq('txn_type', 'PAY');

      if (error) throw error;

      // Build map of loan_id -> payment count
      const counts = {};
      (data || []).forEach(payment => {
        counts[payment.loan_id] = (counts[payment.loan_id] || 0) + 1;
      });

      setPaymentsMap(counts);
    } catch (err) {
      console.error('Error fetching payment counts:', err);
    }
  };

  const handleViewLoan = (schedule) => {
    if (schedule.loans) {
      setSelectedLoan(schedule.loans);
      setShowLoanModal(true);
    }
  };

  const filteredSchedules = schedules.filter(r => {
    const matchesSearch = 
      r.loans?.loan_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${r.loans?.clients?.first_name} ${r.loans?.clients?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
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
    controlsContainer: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
    },
    input: {
      flex: 1,
      minWidth: '250px',
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
      minWidth: '150px',
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
      whiteSpace: 'nowrap',
    },
    td: {
      padding: '1rem',
      borderBottom: '1px solid #f0f0f0',
      color: '#181818',
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
    statusBadge: {
      padding: '0.4rem 0.8rem',
      borderRadius: '6px',
      fontSize: '0.8rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      display: 'inline-block',
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

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#fff3cd', color: '#856404' },
      paid: { bg: '#d4edda', color: '#155724' },
      overdue: { bg: '#f8d7da', color: '#721c24' },
      current: { bg: '#d1ecf1', color: '#0c5460' },
    };
    return colors[status?.toLowerCase()] || { bg: '#e2e3e5', color: '#383d41' };
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loadingState}>Loading repayment schedules...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📅 Repayment Schedule</h1>

        <div style={styles.controlsContainer}>
          <input
            type="text"
            placeholder="Search by loan number or client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.input}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="current">Current</option>
          </select>
        </div>

        {filteredSchedules.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No repayment schedules found</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem', color: '#706e6b', fontSize: '0.9rem' }}>
              Showing {filteredSchedules.length} of {schedules.length} instalments
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Instalment No.</th>
                    <th style={styles.th}>Loan No.</th>
                    <th style={styles.th}>Client</th>
                    <th style={styles.th}>Due Date</th>
                    <th style={styles.th}>Principal</th>
                    <th style={styles.th}>Interest</th>
                    <th style={styles.th}>Total Amount</th>
                    <th style={styles.th}>Payments Made</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map(r => {
                    const statusColors = getStatusColor(r.status);
                    const paymentsMade = paymentsMap[r.loans?.id] || 0;

                    return (
                      <tr key={r.id}>
                        <td style={styles.td}>{r.instalment_number}</td>
                        <td style={styles.td}>
                          <button
                            onClick={() => handleViewLoan(r)}
                            style={styles.loanLink}
                          >
                            {r.loans?.loan_number || 'N/A'}
                          </button>
                        </td>
                        <td style={styles.td}>
                          <button
                            onClick={() => {
                              setSelectedClientId(r.loans?.clients?.id);
                              setShowClientModal(true);
                            }}
                            style={styles.clientLink}
                          >
                            {r.loans?.clients?.first_name} {r.loans?.clients?.last_name}
                          </button>
                        </td>
                        <td style={styles.td}>{formatDate(r.due_date)}</td>
                        <td style={styles.td}>${(r.principal_amount || 0).toFixed(2)}</td>
                        <td style={styles.td}>${(r.interest_amount || 0).toFixed(2)}</td>
                        <td style={{ ...styles.td, fontWeight: 'bold' }}>${(r.total_amount || 0).toFixed(2)}</td>
                        <td style={{ ...styles.td, textAlign: 'center', fontWeight: 600 }}>{paymentsMade}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              backgroundColor: statusColors.bg,
                              color: statusColors.color,
                            }}
                          >
                            {r.status}
                          </span>
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