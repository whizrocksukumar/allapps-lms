// src/pages/Loans.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import Client360Modal from '../components/Client360Modal';
import Loans360Modal from '../components/Loans360Modal';
import NewLoanModal from '../components/NewLoanModal';

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [showClient360, setShowClient360] = useState(false);
  const [showLoan360, setShowLoan360] = useState(false);
  const [showNewLoan, setShowNewLoan] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const { data } = await supabase
        .from('loans')
        .select(`
          id, loan_number, loan_amount, current_balance, status, start_date, term_periods,
          repayment_frequency, client_id(first_name, last_name, client_code),
          loan_product_id(interest_rate)
        `)
        .order('created_at', { ascending: false });
      setLoans(data || []);
    } catch (error) {
      console.error('Loans fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openClient = (clientId) => {
    setSelectedClientId(clientId);
    setShowClient360(true);
  };

  const openLoan = (loan) => {
    setSelectedLoan(loan);
    setShowLoan360(true);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading loans...</div>;

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Loans</h1>
        <button 
          onClick={() => setShowNewLoan(true)}
          style={{ background: '#0176d3', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.25rem' }}
        >
          + New Loan
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ background: '#0176d3', color: '#fff' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Loan #</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Client</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Principal</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Balance</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Rate</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Term</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Opened</th>
          </tr>
        </thead>
        <tbody>
          {loans.map(loan => (
            <tr key={loan.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.75rem' }}>
                <button 
                  onClick={() => openLoan(loan)}
                  style={{ color: '#0176d3', background :'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  {loan.loan_number}
                </button>
              </td>
              <td style={{ padding: '0.75rem' }}>
                <button 
                  onClick={() => openClient(loan.client_id.id)}
                  style={{ color: '#0176d3', background :'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  {loan.client_id.first_name} {loan.client_id.last_name}
                </button>
              </td>
              <td style={{ padding: '0.75rem' }}>${loan.loan_amount?.toFixed(2)}</td>
              <td style={{ padding: '0.75rem' }}>${loan.current_balance?.toFixed(2)}</td>
              <td style={{ padding: '0.75rem' }}>{loan.loan_product_id.interest_rate}%</td>
              <td style={{ padding: '0.75rem' }}>
                {loan.term_periods} {loan.repayment_frequency === 'weekly' ? 'weeks' : loan.repayment_frequency === 'fortnightly' ? 'fortnights' : 'months'}
              </td>
              <td style={{ padding: '0.75rem' }}>{loan.status}</td>
              <td style={{ padding: '0.75rem' }}>{loan.start_date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showClient360 && <Client360Modal isOpen={showClient360} onClose={() => setShowClient360(false)} clientId={selectedClientId} />}
      {showLoan360 && <Loans360Modal loan={selectedLoan} onClose={() => setShowLoan360(false)} />}
      {showNewLoan && <NewLoanModal onClose={() => { setShowNewLoan(false); fetchLoans(); }} />}
    </div>
  );
}