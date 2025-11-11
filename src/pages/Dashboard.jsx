// src/pages/Dashboard.jsx - COMPLETE & CORRECTED VERSION
// Includes: Client360Modal with loans + transactions, dd-mm-yyyy date format

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';

// Helper function to format dates as dd-mm-yyyy
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const Client360Modal = ({ client, onClose }) => {
  const [clientLoans, setClientLoans] = React.useState([]);
  const [clientTransactions, setClientTransactions] = React.useState([]);
  const [loadingLoans, setLoadingLoans] = React.useState(true);

  React.useEffect(() => {
    const fetchClientData = async () => {
      if (!client?.id) return;

      try {
        // Fetch all loans for this client
        const { data: loansData, error: loansError } = await supabase
          .from('loans')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false });

        if (!loansError && loansData) {
          setClientLoans(loansData);

          // Fetch transactions for all this client's loans
          const loanIds = loansData.map(l => l.id);
          if (loanIds.length > 0) {
            const { data: txnData } = await supabase
              .from('transactions')
              .select('*')
              .in('loan_id', loanIds)
              .order('txn_date', { ascending: false })
              .limit(10);

            if (txnData) {
              setClientTransactions(txnData);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setLoadingLoans(false);
      }
    };

    fetchClientData();
  }, [client]);

  if (!client) return null;

  // Helper function to parse allocation breakdown JSON
  const parseAllocation = (allocationStr) => {
    try {
      return JSON.parse(allocationStr);
    } catch {
      return { interest: 0, principal: 0, fees: 0 };
    }
  };

  const totalOutstanding = clientLoans.reduce((sum, loan) => {
    return sum + (parseFloat(loan.balance) || 0);
  }, 0);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          maxWidth: '900px',
          width: '95%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #0176d3', paddingBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: '#181818', fontSize: '1.6rem' }}>Client 360 - {client.first_name} {client.last_name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* PERSONAL & ADDRESS DETAILS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Personal Details */}
          <div style={{ border: '1px solid #dee2e6', padding: '1rem', borderRadius: '6px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0176d3', fontSize: '0.95rem', fontWeight: '600' }}>Personal Details</h3>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
              <p style={{ margin: '0.3rem 0' }}><strong>Code:</strong> {client.client_code || 'N/A'}</p>
              <p style={{ margin: '0.3rem 0' }}><strong>Name:</strong> {client.first_name} {client.last_name}</p>
              <p style={{ margin: '0.3rem 0' }}><strong>Email:</strong> {client.email || 'N/A'}</p>
              <p style={{ margin: '0.3rem 0' }}><strong>Phone:</strong> {client.phone || 'N/A'}</p>
              <p style={{ margin: '0.3rem 0' }}><strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{client.status || 'active'}</span></p>
            </div>
          </div>

          {/* Address */}
          <div style={{ border: '1px solid #dee2e6', padding: '1rem', borderRadius: '6px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0176d3', fontSize: '0.95rem', fontWeight: '600' }}>Address</h3>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
              <p style={{ margin: '0.3rem 0' }}>{client.address || 'N/A'}</p>
              <p style={{ margin: '0.3rem 0' }}>{client.city || ''} {client.postcode || ''}</p>
              <p style={{ margin: '0.3rem 0' }}>{client.country || 'N/A'}</p>
            </div>
          </div>

          {/* Employment Info */}
          <div style={{ border: '1px solid #dee2e6', padding: '1rem', borderRadius: '6px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0176d3', fontSize: '0.95rem', fontWeight: '600' }}>Employment</h3>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
              <p style={{ margin: '0.3rem 0' }}><strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{client.employment_status || 'N/A'}</span></p>
              <p style={{ margin: '0.3rem 0' }}><strong>Monthly Income:</strong> ${parseFloat(client.monthly_income || 0).toFixed(2)}</p>
            </div>
          </div>

          {/* ID Details */}
          <div style={{ border: '1px solid #dee2e6', padding: '1rem', borderRadius: '6px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0176d3', fontSize: '0.95rem', fontWeight: '600' }}>Identification</h3>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
              <p style={{ margin: '0.3rem 0' }}><strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{client.id_type || 'N/A'}</span></p>
              <p style={{ margin: '0.3rem 0' }}><strong>Number:</strong> {client.id_number || 'N/A'}</p>
              <p style={{ margin: '0.3rem 0' }}><strong>DOB:</strong> {formatDate(client.date_of_birth)}</p>
            </div>
          </div>
        </div>

        {/* LOANS SUMMARY */}
        <div style={{ marginBottom: '2rem', borderTop: '2px solid #dee2e6', paddingTop: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#181818', fontSize: '1.1rem', fontWeight: '600' }}>
            Loans ({clientLoans.length})
            {totalOutstanding > 0 && <span style={{ color: '#dc3545', marginLeft: '0.5rem' }}>Outstanding: ${totalOutstanding.toFixed(2)}</span>}
          </h3>

          {loadingLoans ? (
            <p style={{ color: '#706e6b' }}>Loading loans...</p>
          ) : clientLoans.length === 0 ? (
            <p style={{ color: '#706e6b' }}>No loans found for this client</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                  <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '600' }}>Loan #</th>
                  <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '600' }}>Balance</th>
                  <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '600' }}>Opened</th>
                </tr>
              </thead>
              <tbody>
                {clientLoans.map((loan) => (
                  <tr key={loan.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '0.6rem' }}>{loan.loan_number || 'N/A'}</td>
                    <td style={{ padding: '0.6rem' }}>${parseFloat(loan.balance || 0).toFixed(2)}</td>
                    <td style={{ padding: '0.6rem', textTransform: 'capitalize' }}>{loan.status || 'active'}</td>
                    <td style={{ padding: '0.6rem' }}>{formatDate(loan.date_open)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* RECENT TRANSACTIONS */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#181818', fontSize: '1.1rem', fontWeight: '600' }}>
            Recent Transactions ({clientTransactions.length})
          </h3>

          {clientTransactions.length === 0 ? (
            <p style={{ color: '#706e6b' }}>No transactions found</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                  <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '600' }}>Fees</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '600' }}>Interest</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '600' }}>Principal</th>
                  <th style={{ padding: '0.6rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {clientTransactions.map((txn) => {
                  const allocation = parseAllocation(txn.allocation_breakdown);
                  return (
                    <tr key={txn.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '0.6rem' }}>{formatDate(txn.txn_date)}</td>
                      <td style={{ padding: '0.6rem', textTransform: 'capitalize' }}>{txn.txn_type || 'N/A'}</td>
                      <td style={{ padding: '0.6rem', textAlign: 'right' }}>${parseFloat(txn.amount || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.6rem', textAlign: 'right' }}>${parseFloat(allocation.fees || allocation.establishment_fee || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.6rem', textAlign: 'right' }}>${parseFloat(allocation.interest || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.6rem', textAlign: 'right' }}>${parseFloat(allocation.principal || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.6rem' }}>{txn.processing_status || 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <button onClick={onClose} style={{ padding: '0.6rem 1.2rem', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>Close</button>
      </div>
    </div>
  );
};

const LoanDetailsModal = ({ loan, onClose }) => {
  if (!loan) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500 }} onClick={onClose}>
      <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '600px', width: '95%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#181818', fontSize: '1.6rem', borderBottom: '2px solid #0176d3', paddingBottom: '1rem' }}>Loan Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b', fontWeight: '600', fontSize: '0.85rem' }}>Loan Number:</p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#181818' }}>{loan.loan_number || 'N/A'}</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b', fontWeight: '600', fontSize: '0.85rem' }}>Client:</p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#181818' }}>{loan.client_name || 'Unknown'}</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b', fontWeight: '600', fontSize: '0.85rem' }}>Balance:</p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#181818' }}>${loan.balance?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b', fontWeight: '600', fontSize: '0.85rem' }}>Status:</p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#181818', textTransform: 'capitalize' }}>{loan.status || 'active'}</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b', fontWeight: '600', fontSize: '0.85rem' }}>Opened:</p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#181818' }}>{formatDate(loan.date_open)}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ padding: '0.6rem 1.2rem', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>Close</button>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '1.5rem', backgroundColor: '#f8f9fa', minHeight: '100vh' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  metricCard: { backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' },
  cardBorderBlue: { borderTop: '4px solid #0176d3' },
  cardTitle: { fontSize: '0.85rem', color: '#706e6b', margin: 0 },
  cardValue: { fontSize: '1.8rem', fontWeight: 'bold', color: '#181818', margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  th: { backgroundColor: '#0176d3', color: '#ffffff', padding: '0.6rem 0.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600' },
  td: { padding: '0.5rem', borderBottom: '1px solid #dee2e6', fontSize: '0.8rem' },
};

const Dashboard = () => {
  const [loans, setLoans] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [clientsMap, setClientsMap] = useState({});
  const [metrics, setMetrics] = useState({ totalOutstanding: 0, paymentsToday: 0, overdueLoans: 0 });
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all loans
        const { data: loansData } = await supabase.from('loans').select('*').order('created_at', { ascending: false });
        
        // Fetch all clients
        const { data: clientsData } = await supabase.from('clients').select('*');

        // Create client map
        const cMap = {};
        (clientsData || []).forEach(c => { cMap[c.id] = c; });
        setClientsMap(cMap);

        // Enrich loans
        const enrichedLoans = (loansData || []).map(loan => ({
          ...loan,
          client_name: cMap[loan.client_id] ? `${cMap[loan.client_id].first_name} ${cMap[loan.client_id].last_name}` : 'Unknown',
        }));

        setAllLoans(enrichedLoans);

        // Metrics
        const outstanding = enrichedLoans.reduce((sum, l) => sum + (parseFloat(l.balance) || 0), 0);
        const overdue = enrichedLoans.filter(l => l.status === 'overdue').length;
        setMetrics({ totalOutstanding: outstanding, paymentsToday: 0, overdueLoans: overdue });

        // Paginate
        const startIdx = (currentPage - 1) * pageSize;
        setLoans(enrichedLoans.slice(startIdx, startIdx + pageSize));
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, pageSize]);

  const totalPages = Math.ceil(allLoans.length / pageSize);

  return (
    <div style={styles.container}>
      <div style={styles.metricsGrid}>
        <div style={{ ...styles.metricCard, ...styles.cardBorderBlue }}>
          <p style={styles.cardTitle}>Total Outstanding</p>
          <p style={styles.cardValue}>${metrics.totalOutstanding.toFixed(2)}</p>
        </div>
        <div style={{ ...styles.metricCard, ...styles.cardBorderBlue }}>
          <p style={styles.cardTitle}>Payments Today</p>
          <p style={styles.cardValue}>{metrics.paymentsToday}</p>
        </div>
        <div style={{ ...styles.metricCard, ...styles.cardBorderBlue }}>
          <p style={styles.cardTitle}>Overdue Loans</p>
          <p style={styles.cardValue}>{metrics.overdueLoans}</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#706e6b' }}>Loading loans...</div>
      ) : allLoans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#706e6b' }}>No loans found</div>
      ) : (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Loan No.</th>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Balance</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Opened</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.id}>
                  <td style={styles.td}><a href="#" onClick={(e) => { e.preventDefault(); setSelectedLoan(loan); }} style={{ color: '#0176d3', textDecoration: 'underline', cursor: 'pointer' }}>{loan.loan_number || 'N/A'}</a></td>
                  <td style={styles.td}><a href="#" onClick={(e) => { e.preventDefault(); setSelectedClient(clientsMap[loan.client_id]); }} style={{ color: '#0176d3', textDecoration: 'underline', cursor: 'pointer' }}>{loan.client_name}</a></td>
                  <td style={styles.td}>${loan.balance?.toFixed(2) || '0.00'}</td>
                  <td style={styles.td}>{loan.status || 'active'}</td>
                  <td style={styles.td}>{formatDate(loan.date_open)}</td>
                  <td style={styles.td}><button onClick={() => setSelectedLoan(loan)} style={{ padding: '0.3rem 0.6rem', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem' }}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button style={{ padding: '0.5rem 0.75rem', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.5 : 1 }} disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>← Previous</button>
            <span style={{ fontSize: '0.85rem' }}>Page {currentPage} of {totalPages}</span>
            <button style={{ padding: '0.5rem 0.75rem', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', opacity: currentPage === totalPages ? 0.5 : 1 }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next →</button>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #0176d3', cursor: 'pointer', fontSize: '0.8rem' }}>
              <option value={20}>20/page</option>
              <option value={50}>50/page</option>
              <option value={100}>100/page</option>
            </select>
          </div>
        </>
      )}

      <LoanDetailsModal loan={selectedLoan} onClose={() => setSelectedLoan(null)} />
      <Client360Modal client={selectedClient} onClose={() => setSelectedClient(null)} />
    </div>
  );
};

export default Dashboard;