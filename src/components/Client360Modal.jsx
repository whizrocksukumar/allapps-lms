import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const Client360Modal = ({ isOpen, onClose, clientId }) => {
  const [clientData, setClientData] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && clientId) {
      fetchClientData();
      fetchLoans();
    }
  }, [isOpen, clientId]);

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      setClientData(data);
    } catch (error) {
      console.error('Error fetching client data:', error);
    }
  };

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('customer_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount || 0);
  };

  if (!isOpen) return null;

  const styles = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: '0.5rem',
      maxWidth: '90%',
      width: '1000px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      position: 'relative'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1.5rem',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#0176d3',
      color: '#fff'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '600',
      margin: 0
    },
    closeButton: {
      backgroundColor: 'transparent',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#fff'
    },
    body: {
      padding: '1.5rem'
    },
    section: {
      marginBottom: '2rem'
    },
    sectionTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#0176d3',
      marginBottom: '1rem',
      paddingBottom: '0.5rem',
      borderBottom: '2px solid #0176d3'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem',
      marginBottom: '1rem'
    },
    field: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#706e6b',
      marginBottom: '0.25rem'
    },
    value: {
      fontSize: '0.95rem',
      color: '#181818'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '1rem'
    },
    thead: {
      backgroundColor: '#f3f4f6',
      borderBottom: '1px solid #d1d5db'
    },
    th: {
      padding: '0.75rem',
      textAlign: 'left',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#181818'
    },
    td: {
      padding: '0.75rem',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '0.875rem'
    },
    link: {
      color: '#0176d3',
      textDecoration: 'none',
      cursor: 'pointer',
      fontWeight: '500'
    },
    linkHover: {
      textDecoration: 'underline'
    },
    emptyMessage: {
      padding: '1rem',
      textAlign: 'center',
      color: '#706e6b',
      fontSize: '0.9rem'
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div style={styles.header}>
          <h2 style={styles.title}>Client 360 - {clientData?.customer_name || 'Loading...'}</h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {/* BODY */}
        <div style={styles.body}>
          {loading && !clientData ? (
            <div style={styles.emptyMessage}>Loading client data...</div>
          ) : (
            <>
              {/* PERSONAL INFORMATION */}
              {clientData && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Personal Information</h3>
                  <div style={styles.grid}>
                    <div style={styles.field}>
                      <label style={styles.label}>Customer Name</label>
                      <div style={styles.value}>{clientData.customer_name || 'N/A'}</div>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Customer Code</label>
                      <div style={styles.value}>{clientData.customer_code || 'N/A'}</div>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Email</label>
                      <div style={styles.value}>{clientData.email || 'N/A'}</div>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Phone</label>
                      <div style={styles.value}>{clientData.phone || 'N/A'}</div>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Date of Birth</label>
                      <div style={styles.value}>{formatDate(clientData.date_of_birth)}</div>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>ID Type</label>
                      <div style={styles.value}>{clientData.id_type || 'N/A'}</div>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>ID Number</label>
                      <div style={styles.value}>{clientData.id_number || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADDRESS INFORMATION */}
              {clientData && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Address Information</h3>
                  <div style={styles.grid}>
                    <div style={styles.field}>
                      <label style={styles.label}>Street Address</label>
                      <div style={styles.value}>{clientData.street_address || 'N/A'}</div>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Suburb</label>
                      <div style={styles.value}>{clientData.suburb || 'N/A'}</div>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>City</label>
                      <div style={styles.value}>{clientData.city || 'N/A'}</div>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Postal Code</label>
                      <div style={styles.value}>{clientData.postal_code || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* EMPLOYMENT INFORMATION */}
              {clientData && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Employment Information</h3>
                  <div style={styles.grid}>
                    <div style={styles.field}>
                      <label style={styles.label}>Employer Name</label>
                      <div style={styles.value}>{clientData.employer_name || 'N/A'}</div>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Job Title</label>
                      <div style={styles.value}>{clientData.job_title || 'N/A'}</div>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Employment Type</label>
                      <div style={styles.value}>{clientData.employment_type || 'N/A'}</div>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Monthly Income</label>
                      <div style={styles.value}>{formatCurrency(clientData.monthly_income)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* LOANS */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Active Loans</h3>
                {loans && loans.length > 0 ? (
                  <table style={styles.table}>
                    <thead style={styles.thead}>
                      <tr>
                        <th style={styles.th}>Loan Number</th>
                        <th style={styles.th}>Product</th>
                        <th style={styles.th}>Principal</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Date Opened</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map((loan) => (
                        <tr key={loan.id}>
                          <td style={styles.td}>{loan.loan_number || 'N/A'}</td>
                          <td style={styles.td}>{loan.product_name || 'N/A'}</td>
                          <td style={styles.td}>{formatCurrency(loan.principal_amount)}</td>
                          <td style={styles.td}>{loan.status || 'N/A'}</td>
                          <td style={styles.td}>{formatDate(loan.date_opened)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={styles.emptyMessage}>No loans found for this client.</div>
                )}
              </div>

              {/* TRANSACTIONS LINK */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Transaction History</h3>
                <div style={styles.emptyMessage}>
                  View all transactions for this client:{' '}
                  <a 
                    href={`/transactions?client=${clientId}`}
                    style={styles.link}
                    onMouseEnter={(e) => Object.assign(e.target.style, styles.linkHover)}
                    onMouseLeave={(e) => Object.assign(e.target.style, { textDecoration: 'none' })}
                  >
                    Click here →
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Client360Modal;