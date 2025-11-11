import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const LoanDetailsModal = ({ isOpen, loanId, onClose }) => {
  const [loan, setLoan] = useState(null);
  const [client, setClient] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && loanId) {
      fetchLoanDetails();
    }
  }, [isOpen, loanId]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select(`
          id,
          loan_number,
          loan_amount,
          establishment_fee,
          start_date,
          status,
          current_balance,
          principal_outstanding,
          interest_accrued,
          rate_id,
          client_id,
          created_at,
          clients (
            id,
            client_code,
            first_name,
            last_name,
            email,
            phone
          ),
          loan_products (
            interest_rate
          )
        `)
        .eq('id', loanId)
        .single();

      if (loanError) throw loanError;
      setLoan(loanData);
      setClient(loanData.clients);

      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_reconciliation')
        .select('*')
        .eq('loan_id', loanId)
        .order('payment_date', { ascending: false })
        .limit(10);

      if (paymentError) throw paymentError;
      setPayments(paymentData || []);
    } catch (err) {
      console.error('Error fetching loan details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
      maxWidth: '900px',
      width: '90%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1.5rem',
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#0176d3',
      color: '#ffffff',
    },
    title: {
      margin: 0,
      fontSize: '1.5rem',
      fontWeight: '600',
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      color: '#ffffff',
      cursor: 'pointer',
    },
    content: {
      padding: '1.5rem',
    },
    section: {
      marginBottom: '2rem',
    },
    sectionTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#181818',
      marginBottom: '1rem',
      paddingBottom: '0.5rem',
      borderBottom: '2px solid #0176d3',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
    },
    field: {
      display: 'flex',
      flexDirection: 'column',
    },
    label: {
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#706e6b',
      textTransform: 'uppercase',
      marginBottom: '0.25rem',
    },
    value: {
      fontSize: '1rem',
      color: '#181818',
      fontWeight: '500',
    },
    status: {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '0.25rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#ffffff',
    },
    statusActive: {
      backgroundColor: '#4caf50',
    },
    statusInactive: {
      backgroundColor: '#f44336',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '1rem',
    },
    th: {
      textAlign: 'left',
      padding: '0.75rem',
      backgroundColor: '#f5f5f5',
      borderBottom: '2px solid #0176d3',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#181818',
    },
    td: {
      padding: '0.75rem',
      borderBottom: '1px solid #e0e0e0',
      fontSize: '0.875rem',
      color: '#333333',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '300px',
    },
    loadingText: {
      fontSize: '1rem',
      color: '#706e6b',
    },
    errorContainer: {
      backgroundColor: '#ffebee',
      border: '1px solid #f44336',
      borderRadius: '0.25rem',
      padding: '1rem',
      marginBottom: '1rem',
    },
    errorText: {
      color: '#c62828',
      fontSize: '0.875rem',
    },
  };

  const statusStyle = loan?.status === 'active'
    ? { ...styles.status, ...styles.statusActive }
    : { ...styles.status, ...styles.statusInactive };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0.00';
    return `$${parseFloat(value).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Loan Details</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={styles.content}>
          {error && (
            <div style={styles.errorContainer}>
              <p style={styles.errorText}>{error}</p>
            </div>
          )}

          {loading ? (
            <div style={styles.loadingContainer}>
              <p style={styles.loadingText}>Loading loan details...</p>
            </div>
          ) : loan ? (
            <>
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Client Information</h3>
                <div style={styles.grid}>
                  <div style={styles.field}>
                    <span style={styles.label}>Client Code</span>
                    <span style={styles.value}>{client?.client_code || '-'}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.label}>Name</span>
                    <span style={styles.value}>
                      {client?.first_name} {client?.last_name}
                    </span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.label}>Email</span>
                    <span style={styles.value}>{client?.email || '-'}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.label}>Phone</span>
                    <span style={styles.value}>{client?.phone || '-'}</span>
                  </div>
                </div>
              </div>

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Loan Information</h3>
                <div style={styles.grid}>
                  <div style={styles.field}>
                    <span style={styles.label}>Loan Number</span>
                    <span style={styles.value}>{loan.loan_number || '-'}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.label}>Status</span>
                    <span style={statusStyle}>{loan.status?.toUpperCase()}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.label}>Start Date</span>
                    <span style={styles.value}>{formatDate(loan.start_date)}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.label}>Interest Rate</span>
                    <span style={styles.value}>
                      {loan.loan_products?.interest_rate || '-'}%
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Amount Breakdown</h3>
                <div style={styles.grid}>
                  <div style={styles.field}>
                    <span style={styles.label}>Original Loan Amount</span>
                    <span style={styles.value}>{formatCurrency(loan.loan_amount)}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.label}>Establishment Fee</span>
                    <span style={styles.value}>{formatCurrency(loan.establishment_fee)}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.label}>Principal Outstanding</span>
                    <span style={styles.value}>{formatCurrency(loan.principal_outstanding)}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.label}>Interest Accrued</span>
                    <span style={styles.value}>{formatCurrency(loan.interest_accrued)}</span>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.label}>Current Balance</span>
                    <span style={{ ...styles.value, color: '#0176d3', fontWeight: '700' }}>
                      {formatCurrency(loan.current_balance)}
                    </span>
                  </div>
                </div>
              </div>

              {payments.length > 0 && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Recent Payments (Last 10)</h3>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Payment Date</th>
                        <th style={styles.th}>Amount</th>
                        <th style={styles.th}>Fees</th>
                        <th style={styles.th}>Interest</th>
                        <th style={styles.th}>Principal</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td style={styles.td}>{formatDate(payment.payment_date)}</td>
                          <td style={styles.td}>{formatCurrency(payment.total_amount)}</td>
                          <td style={styles.td}>{formatCurrency(payment.fees_amount)}</td>
                          <td style={styles.td}>{formatCurrency(payment.interest_amount)}</td>
                          <td style={styles.td}>{formatCurrency(payment.principal_amount)}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.status,
                              backgroundColor: payment.status === 'completed' ? '#4caf50' : '#ff9800',
                            }}>
                              {payment.status?.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {payments.length === 0 && (
                <div style={styles.section}>
                  <p style={{ color: '#706e6b', fontSize: '0.875rem' }}>No payment history available.</p>
                </div>
              )}
            </>
          ) : (
            <p style={styles.loadingText}>No loan data found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanDetailsModal;