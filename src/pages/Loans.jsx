// src/pages/Loans.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';

const styles = {
  container: {
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 'bold',
    color: '#181818',
    margin: 0,
  },
  button: {
    padding: '0.6rem 1.2rem',
    background: '#0176d3',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  th: {
    backgroundColor: '#0176d3',
    color: '#ffffff',
    padding: '0.6rem 0.5rem',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '0.8rem',
  },
  td: {
    padding: '0.5rem',
    borderBottom: '1px solid #dee2e6',
    fontSize: '0.8rem',
  },
  paginationContainer: {
    marginTop: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  paginationButton: {
    padding: '0.5rem 0.75rem',
    background: '#0176d3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
};

const LoanDetailsModal = ({ loan, onClose }) => {
  if (!loan) return null;

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
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '95%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#181818', fontSize: '1.6rem', borderBottom: '2px solid #0176d3', paddingBottom: '1rem' }}>
          Loan Details
        </h2>
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
            <p style={{ margin: '0.5rem 0', color: '#706e6b', fontWeight: '600', fontSize: '0.85rem' }}>Principal:</p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#181818' }}>${loan.principal?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b', fontWeight: '600', fontSize: '0.85rem' }}>Balance:</p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#181818' }}>${loan.balance?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b', fontWeight: '600', fontSize: '0.85rem' }}>Rate:</p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#181818' }}>{loan.interest_rate || '0'}%</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b', fontWeight: '600', fontSize: '0.85rem' }}>Term:</p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#181818' }}>{loan.term || '0'} months</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b', fontWeight: '600', fontSize: '0.85rem' }}>Status:</p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#181818', textTransform: 'capitalize' }}>{loan.status || 'active'}</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#706e6b', fontWeight: '600', fontSize: '0.85rem' }}>Open Date:</p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#181818' }}>{loan.date_open || 'N/A'}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ padding: '0.6rem 1.2rem', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

const Loans = () => {
  const [allLoans, setAllLoans] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      try {
        console.log('=== Loans: Fetching data ===');
        
        // Fetch all loans
        const { data: loansData, error: loansError } = await supabase
          .from('loans')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (loansError) {
          console.error('❌ Loans error:', loansError);
          throw loansError;
        }
        console.log('✅ Loans:', loansData?.length);

        // Fetch all clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, client_code, first_name, last_name');
        
        if (clientsError) {
          console.error('❌ Clients error:', clientsError);
          throw clientsError;
        }
        console.log('✅ Clients:', clientsData?.length);

        // Create client map
        const clientMap = {};
        (clientsData || []).forEach(c => {
          clientMap[c.id] = c;
        });

        // Enrich loans
        const enrichedLoans = (loansData || []).map(loan => ({
          ...loan,
          client_name: clientMap[loan.client_id]
            ? `${clientMap[loan.client_id].first_name} ${clientMap[loan.client_id].last_name}`
            : 'Unknown',
          client_code: clientMap[loan.client_id]?.client_code || '',
        }));

        console.log('✅ Enriched:', enrichedLoans.length);
        setAllLoans(enrichedLoans);

        // Paginate
        const startIdx = (currentPage - 1) * pageSize;
        setLoans(enrichedLoans.slice(startIdx, startIdx + pageSize));
      } catch (error) {
        console.error('❌ Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [currentPage, pageSize]);

  const totalPages = Math.ceil(allLoans.length / pageSize);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Loans</h1>
        <button style={styles.button}>+ New Loan</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#706e6b' }}>Loading loans...</div>
      ) : allLoans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#706e6b' }}>No loans found. Click "New Loan" to create one.</div>
      ) : (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Loan #</th>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Principal</th>
                <th style={styles.th}>Balance</th>
                <th style={styles.th}>Rate</th>
                <th style={styles.th}>Term</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Opened</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td style={styles.td}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedLoan(loan);
                      }}
                      style={{ color: '#0176d3', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {loan.loan_number || 'N/A'}
                    </a>
                  </td>
                  <td style={styles.td}>{loan.client_name}</td>
                  <td style={styles.td}>${loan.principal?.toFixed(2) || '0.00'}</td>
                  <td style={styles.td}>${loan.balance?.toFixed(2) || '0.00'}</td>
                  <td style={styles.td}>{loan.interest_rate || '0'}%</td>
                  <td style={styles.td}>{loan.term || '0'}</td>
                  <td style={styles.td}><span style={{ textTransform: 'capitalize' }}>{loan.status || 'active'}</span></td>
                  <td style={styles.td}>{loan.date_open || 'N/A'}</td>
                  <td style={styles.td}>
                    <button 
                      onClick={() => setSelectedLoan(loan)}
                      style={{ padding: '0.3rem 0.6rem', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.paginationContainer}>
            <button 
              style={{...styles.paginationButton, opacity: currentPage === 1 ? 0.5 : 1}}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              Page {currentPage} of {totalPages} | {allLoans.length} total
            </span>
            <button 
              style={{...styles.paginationButton, opacity: currentPage === totalPages ? 0.5 : 1}}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next →
            </button>
            <select 
              value={pageSize} 
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #0176d3', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              <option value={20}>20/page</option>
              <option value={50}>50/page</option>
              <option value={100}>100/page</option>
            </select>
          </div>
        </>
      )}

      <LoanDetailsModal loan={selectedLoan} onClose={() => setSelectedLoan(null)} />
    </div>
  );
};

export default Loans;