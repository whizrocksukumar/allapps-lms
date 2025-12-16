// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { getLoansWithClientNames } from '../services/supabaseService';

const LoanDetailsModal = ({ loan, onClose }) => {
  if (!loan) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '12px', maxWidth: '600px', width: '95%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#181818', fontSize: '1.8rem', borderBottom: '2px solid #0176d3', paddingBottom: '1rem' }}>Loan Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b' }}><strong>Loan No:</strong></p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#181818' }}>{loan.loan_number}</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b' }}><strong>Client:</strong></p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#181818' }}>{loan.client_name}</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b' }}><strong>Balance:</strong></p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#181818' }}>${loan.balance?.toFixed(2)}</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b' }}><strong>Interest Rate:</strong></p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#181818' }}>{loan.interest_rate}%</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b' }}><strong>Term:</strong></p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#181818' }}>{loan.term} months</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b' }}><strong>Status:</strong></p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#181818', textTransform: 'capitalize' }}>{loan.status}</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b' }}><strong>Open Date:</strong></p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#181818' }}>{loan.date_open}</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b' }}><strong>Close Date:</strong></p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#181818' }}>{loan.date_closed ? loan.date_closed : 'N/A'}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' }}>Close</button>
      </div>
    </div>
  );
};

const ClientDetailsModal = ({ client, onClose }) => {
  if (!client) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '12px', maxWidth: '600px', width: '95%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#181818', fontSize: '1.8rem', borderBottom: '2px solid #0176d3', paddingBottom: '1rem' }}>Client Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b' }}><strong>Client Name:</strong></p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#181818' }}>{client.client_name}</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b' }}><strong>Client Code:</strong></p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#181818' }}>{client.client_code}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' }}>Close</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cardBorderBlue: { borderTop: '4px solid #0176d3' },
  cardBorderGreen: { borderTop: '4px solid #28a745' },
  cardBorderRed: { borderTop: '4px solid #dc3545' },
  cardTitle: { fontSize: '1.1rem', color: '#706e6b', marginBottom: '0.5rem' },
  cardValue: { fontSize: '2rem', fontWeight: 'bold', color: '#181818' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  th: { backgroundColor: '#0176d3', color: '#ffffff', padding: '1rem', textAlign: 'left' },
  td: { padding: '1rem', borderBottom: '1px solid #dee2e6' },
};

const Dashboard = () => {
  const [loans, setLoans] = useState([]);
  const [metrics, setMetrics] = useState({ totalOutstanding: 0, paymentsToday: 0, overdueLoans: 0 });
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getLoansWithClientNames();
        console.log('Loans data fetched:', response);
        const validLoans = response.data || [];
        setLoans(validLoans);
        const outstanding = validLoans.reduce((sum, l) => sum + (l.balance || 0), 0);
        const overdue = validLoans.filter(l => l.status === 'overdue').length;
        setMetrics({ totalOutstanding: outstanding, paymentsToday: 0, overdueLoans: overdue });
      } catch (error) {
        console.error('Dashboard load failed:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.metricsGrid}>
        <div style={{ ...styles.metricCard, ...styles.cardBorderBlue }}>
          <div style={styles.cardTitle}>Total Outstanding</div>
          <div style={styles.cardValue}>${metrics.totalOutstanding.toFixed(2)}</div>
        </div>
        <div style={{ ...styles.metricCard, ...styles.cardBorderGreen }}>
          <div style={styles.cardTitle}>Payments Today</div>
          <div style={styles.cardValue}>{metrics.paymentsToday}</div>
        </div>
        <div style={{ ...styles.metricCard, ...styles.cardBorderRed }}>
          <div style={styles.cardTitle}>Overdue Loans</div>
          <div style={styles.cardValue}>{metrics.overdueLoans}</div>
        </div>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Loan No.</th>
            <th style={styles.th}>Client</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loans.length === 0 ? (
            <tr><td colSpan="4" style={{ ...styles.td, textAlign: 'center' }}>No loans found</td></tr>
          ) : (
            loans.map(loan => (
              <tr key={loan.id}>
                <td style={styles.td}><a href="#" onClick={(e) => { e.preventDefault(); setSelectedLoan(loan); }} style={{ color: '#0176d3', textDecoration: 'underline', cursor: 'pointer' }}>{loan.loan_number}</a></td>
                <td style={styles.td}><a href="#" onClick={(e) => { e.preventDefault(); setSelectedClient(loan); }} style={{ color: '#0176d3', textDecoration: 'underline', cursor: 'pointer' }}>{loan.client_name || 'N/A'}</a></td>
                <td style={styles.td}>{loan.status}</td>
                <td style={styles.td}><button>View</button></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <LoanDetailsModal loan={selectedLoan} onClose={() => setSelectedLoan(null)} />
      <ClientDetailsModal client={selectedClient} onClose={() => setSelectedClient(null)} />
    </div>
  );
};

export default Dashboard;