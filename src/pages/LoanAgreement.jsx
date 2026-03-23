import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import PageHeader from '../components/PageHeader';
import { generateLoanAgreement } from '../components/LoanAgreementGenerator';

export default function LoanAgreement() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState(null); // loan id being generated

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('loans')
      .select(`
        id, loan_number, loan_amount, establishment_fee,
        annual_interest_rate, start_date, end_date, status,
        term_months, repayment_frequency, repayment_amount,
        clients (id, first_name, last_name, client_code, email, mobile_phone, address, city)
      `)
      .order('created_at', { ascending: false });

    if (!error) setLoans(data || []);
    setLoading(false);
  };

  const handleGenerate = (loan) => {
    setGenerating(loan.id);
    try {
      const client = Array.isArray(loan.clients) ? loan.clients[0] : loan.clients;
      generateLoanAgreement(loan, client);
    } finally {
      setGenerating(null);
    }
  };

  const filtered = loans.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    const client = Array.isArray(l.clients) ? l.clients[0] : l.clients;
    return (
      l.loan_number?.toLowerCase().includes(q) ||
      client?.first_name?.toLowerCase().includes(q) ||
      client?.last_name?.toLowerCase().includes(q) ||
      client?.client_code?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="Loan Agreement"
        subtitle="Generate and download credit contract PDF for any loan"
      />

      <div style={{ padding: '0 2rem 2rem' }}>
        <input
          type="text"
          placeholder="Search by loan number, client name or code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: '420px', padding: '0.6rem 1rem',
            border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.95rem',
            marginBottom: '1.5rem', boxSizing: 'border-box',
          }}
        />

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>Loading loans...</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr style={theadStyle}>
                <th style={thStyle}>Loan No.</th>
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Rate</th>
                <th style={thStyle}>Term</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Start Date</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No loans found.</td></tr>
              ) : filtered.map(loan => {
                const client = Array.isArray(loan.clients) ? loan.clients[0] : loan.clients;
                const termUnit = loan.repayment_frequency === 'Weekly' ? 'wks'
                  : loan.repayment_frequency === 'Fortnightly' ? 'fn' : 'mths';
                return (
                  <tr key={loan.id} style={trStyle}>
                    <td style={tdStyle}><strong>{loan.loan_number}</strong></td>
                    <td style={tdStyle}>
                      {client?.first_name} {client?.last_name}
                      {client?.client_code && (
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{client.client_code}</div>
                      )}
                    </td>
                    <td style={tdStyle}>${loan.loan_amount?.toFixed(2)}</td>
                    <td style={tdStyle}>{loan.annual_interest_rate}%</td>
                    <td style={tdStyle}>{loan.term_months} {termUnit}</td>
                    <td style={tdStyle}>
                      <span style={statusBadge(loan.status)}>{loan.status}</span>
                    </td>
                    <td style={tdStyle}>{loan.start_date}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleGenerate(loan)}
                        disabled={generating === loan.id}
                        style={generating === loan.id ? btnDisabledStyle : btnStyle}
                      >
                        {generating === loan.id ? 'Generating...' : '⬇ Generate PDF'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function statusBadge(status) {
  const s = status?.toLowerCase() || '';
  let bg = '#eee', color = '#333';
  if (s === 'active') { bg = '#cdfbc8'; color = '#1e7e34'; }
  else if (s === 'pending') { bg = '#fff3cd'; color = '#856404'; }
  else if (s === 'closed' || s === 'written off') { bg = '#f8d7da'; color = '#721c24'; }
  return { background: bg, color, padding: '2px 8px', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' };
}

const tableStyle = { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: '1px solid #e1e4e8' };
const theadStyle = { background: '#0176d3' };
const thStyle = { padding: '0.75rem 1rem', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' };
const trStyle = { borderBottom: '1px solid #f0f0f0' };
const tdStyle = { padding: '0.75rem 1rem', fontSize: '0.9rem', verticalAlign: 'middle' };
const btnStyle = { background: '#0176d3', color: '#fff', border: 'none', borderRadius: '5px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' };
const btnDisabledStyle = { ...btnStyle, background: '#aaa', cursor: 'not-allowed' };
