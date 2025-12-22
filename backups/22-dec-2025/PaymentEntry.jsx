// src/pages/PaymentEntry.jsx
import React, { useState, useEffect } from 'react';
import { getClients, getLoansByClient, addRepayment } from '../services/supabaseService';

export default function PaymentEntry() {
  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedLoan, setSelectedLoan] = useState('');
  const [loanDetails, setLoanDetails] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    reference: '',
    notes: '',
  });
  const [allocation, setAllocation] = useState(null);
  const [message, setMessage] = useState('');

  // Load all clients
  useEffect(() => {
    async function loadClients() {
      const data = await getClients();
      // Service returns array directly or empty array on error
      if (Array.isArray(data)) {
        setClients(data);
      } else {
        console.error("Failed to load clients: Expected array");
        setClients([]);
      }
    }
    loadClients();
  }, []);

  // Load loans when client selected
  useEffect(() => {
    if (selectedClient) {
      async function loadLoans() {
        const result = await getLoansByClient(selectedClient);
        if (result.success) {
          setLoans(result.data);
          // Auto-select 'Active' loan if only one exists or default to first active
          const activeLoan = result.data.find(l => l.status === 'Active' || l.status === 'active');
          if (activeLoan) {
            setSelectedLoan(activeLoan.id);
          }
        } else {
          console.error(result.message);
        }
      }
      loadLoans();
    } else {
      setLoans([]);
    }
    setSelectedLoan('');
    setLoanDetails(null);
    setAllocation(null);
  }, [selectedClient]);

  // Load loan details
  useEffect(() => {
    if (selectedLoan) {
      async function loadDetails() {
        // Fetch static loan details properties
        const { data: loanData, error: loanError } = await supabase
          .from('loans')
          .select('start_date, loan_number, annual_interest_rate')
          .eq('id', selectedLoan)
          .single();

        // Fetch dynamic balance properties
        const { data: balanceData, error: balanceError } = await supabase
          .from('loan_balances')
          .select('current_outstanding_balance, outstanding_principal, outstanding_interest, unpaid_fees')
          .eq('loan_id', selectedLoan)
          .maybeSingle();

        if (loanData) {
          const bal = balanceData || {
            current_outstanding_balance: 0,
            outstanding_principal: 0,
            outstanding_interest: 0,
            unpaid_fees: 0
          };

          setLoanDetails({
            ...bal,
            start_date: loanData.start_date,
            loan_number: loanData.loan_number,
            interest_rate: loanData.annual_interest_rate
          });
        }
      }
      loadDetails();
    } else {
      setLoanDetails(null);
    }
    setAllocation(null);
  }, [selectedLoan]);

  // Calculate allocation preview
  useEffect(() => {
    if (loanDetails && form.amount) {
      const payment = parseFloat(form.amount);
      if (payment > 0) {
        let remaining = payment;
        const fees = Math.min(remaining, loanDetails.unpaid_fees || 0);
        remaining -= fees;
        const interest = Math.min(remaining, loanDetails.outstanding_interest || 0);
        remaining -= interest;
        const principal = Math.min(remaining, loanDetails.outstanding_principal || 0);

        // New balance calculation
        const current = loanDetails.current_outstanding_balance || 0;
        const newBalance = Math.max(0, current - payment);

        setAllocation({ fees, interest, principal, newBalance });
      } else {
        setAllocation(null);
      }
    } else {
      setAllocation(null);
    }
  }, [form.amount, loanDetails]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoan || !form.amount) {
      setMessage('Please select a client, loan, and enter amount.');
      return;
    }

    const response = await addRepayment({
      loan_id: selectedLoan,
      client_id: selectedClient, // <-- Passed client_id here
      date: form.date,
      amount: parseFloat(form.amount),
      reference: form.reference,
      notes: form.notes,
    });

    if (response.success) {
      setMessage('Payment recorded and allocated successfully.');
      setForm({ ...form, amount: '', reference: '', notes: '' });
      setAllocation(null);
      // Refresh loan details
      const { data } = await supabase
        .from('loans')
        .select('current_balance, principal_outstanding, interest_accrued, fees_outstanding')
        .eq('id', selectedLoan)
        .single();
      setLoanDetails(data);
    } else {
      setMessage(`Error: ${response.message}`);
    }
  };

  return (
    <div style={pageStyle}>
      <h2 style={{ color: '#0176d3', marginBottom: '1.5rem' }}>Payment Entry</h2>
      <div style={layoutStyle}>
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>Date</label>
          <input type="date" name="date" value={form.date} onChange={handleChange} style={inputStyle} />

          <label style={labelStyle}>Client</label>
          <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} style={inputStyle}>
            <option value="">Select Client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>

          <label style={labelStyle}>Loan</label>
          <select
            value={selectedLoan}
            onChange={(e) => setSelectedLoan(e.target.value)}
            style={inputStyle}
            disabled={!selectedClient}
          >
            <option value="">Select Loan</option>
            {loans.map((l) => (
              <option key={l.id} value={l.id}>
                {l.loan_number} - ${l.current_balance?.toFixed(2)} ({l.status})
              </option>
            ))}
          </select>

          <label style={labelStyle}>Payment Amount</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            style={inputStyle}
            placeholder="0.00"
            step="0.01"
          />

          <label style={labelStyle}>Reference</label>
          <input type="text" name="reference" value={form.reference} onChange={handleChange} style={inputStyle} />

          <label style={labelStyle}>Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} style={{ ...inputStyle, height: '80px' }} />

          {allocation && (
            <div style={previewStyle}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Allocation Preview</h3>
              <p>Fees: ${allocation.fees.toFixed(2)}</p>
              <p>Interest: ${allocation.interest.toFixed(2)}</p>
              <p>Principal: ${allocation.principal.toFixed(2)}</p>
              <p style={{ fontWeight: 'bold', color: '#0176d3' }}>
                New Balance: ${allocation.newBalance.toFixed(2)}
              </p>
            </div>
          )}

          <button type="submit" style={submitBtnStyle}>
            Record Payment
          </button>

          {message && (
            <div style={{
              ...messageBoxStyle,
              color: message.includes('Error') ? '#721c24' : '#155724',
              backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
              borderColor: message.includes('Error') ? '#f5c6cb' : '#c3e6cb'
            }}>
              {message}
            </div>
          )}
        </form>

        <div style={sidebarStyle}>
          {loanDetails ? (
            <>
              <h3 style={{ color: '#181818', marginBottom: '1rem' }}>Loan Details</h3>
              <p><strong>{loanDetails.loan_number}</strong></p>
              <p>Start Date: {loanDetails.start_date}</p>
              <p>Interest Rate: {loanDetails.interest_rate}%</p>
              <hr style={{ margin: '1rem 0', border: '0', borderTop: '1px solid #ddd' }} />
              <p>Total Outstanding: ${loanDetails.current_outstanding_balance?.toFixed(2)}</p>
              <p>Principal: ${loanDetails.outstanding_principal?.toFixed(2)}</p>
              <p>Interest: ${loanDetails.outstanding_interest?.toFixed(2)}</p>
              <p>Fees: ${loanDetails.unpaid_fees?.toFixed(2)}</p>
            </>
          ) : (
            <p style={{ color: '#706e6b', fontStyle: 'italic' }}>Select a loan to view balance.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// STYLES (Inline CSS - per standards)
const pageStyle = { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' };
const layoutStyle = { display: 'flex', gap: '2rem', flexWrap: 'wrap' };
const formStyle = { flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '0.75rem' };
const sidebarStyle = {
  width: '300px',
  background: '#f0f9ff',
  padding: '1.5rem',
  borderRadius: '0.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  fontSize: '0.95rem',
};
const labelStyle = { fontWeight: '600', color: '#181818', marginTop: '0.5rem' };
const inputStyle = {
  padding: '0.5rem',
  border: '1px solid #706e6b',
  borderRadius: '0.25rem',
  background: '#fff',
  fontSize: '1rem',
};
const previewStyle = {
  marginTop: '1rem',
  padding: '1rem',
  background: '#e3f2fd',
  borderRadius: '0.25rem',
  fontSize: '0.9rem',
};
const submitBtnStyle = {
  marginTop: '1.5rem',
  background: '#0176d3',
  color: '#fff',
  border: 'none',
  padding: '0.75rem',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '1rem',
};
const messageBoxStyle = {
  marginTop: '1.5rem',
  padding: '1rem',
  borderRadius: '0.25rem',
  textAlign: 'center',
  fontWeight: '600',
  border: '1px solid',
};