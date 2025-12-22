// src/pages/PaymentEntry.jsx
import React, { useState, useEffect } from 'react';
import { getClients, getLoansByClient, addRepayment } from '../services/supabaseService';

export default function PaymentEntry() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);

  const [clientQuery, setClientQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');

  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState('');

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    reference: '',
    notes: '',
  });

  const [message, setMessage] = useState('');

  /* ---------------- Load Clients ---------------- */
  useEffect(() => {
    async function loadClients() {
      const data = await getClients();
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => {
          const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
          const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setClients(sorted);
        setFilteredClients(sorted);
      }
    }
    loadClients();
  }, []);

  /* ---------------- Filter Clients ---------------- */
  useEffect(() => {
    if (!clientQuery) {
      setFilteredClients(clients);
    } else {
      const q = clientQuery.toLowerCase();
      setFilteredClients(
        clients.filter(c =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
        )
      );
    }
  }, [clientQuery, clients]);

  /* ---------------- Load Loans ---------------- */
  useEffect(() => {
    if (selectedClient) {
      async function loadLoans() {
        const result = await getLoansByClient(selectedClient);
        if (result.success) {
          setLoans(result.data);
          const activeLoan = result.data.find(
            l => l.status === 'Active' || l.status === 'active'
          );
          if (activeLoan) setSelectedLoan(activeLoan.id);
        }
      }
      loadLoans();
    } else {
      setLoans([]);
    }
    setSelectedLoan('');
  }, [selectedClient]);

  /* ---------------- Handlers ---------------- */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClient || !selectedLoan || !form.amount) {
      setMessage('Please select client, loan and enter amount.');
      return;
    }

    const response = await addRepayment({
      client_id: selectedClient,
      loan_id: selectedLoan,
      date: form.date,
      amount: parseFloat(form.amount),
      reference: form.reference,
      notes: form.notes,
    });

    if (response.success) {
      setMessage('Payment recorded successfully.');

      setForm({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        reference: '',
        notes: '',
      });
      setSelectedClient('');
      setSelectedLoan('');
      setClientQuery('');
      setShowClientDropdown(false);
      setLoans([]);
    } else {
      setMessage(`Error: ${response.message}`);
    }
  };

  return (
    <div style={pageStyle}>
      <h2 style={{ color: '#0176d3', marginBottom: '1.5rem' }}>
        Payment Entry
      </h2>

      <form onSubmit={handleSubmit} style={formCardStyle}>
        <label style={labelStyle}>Date</label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={labelStyle}>Select Client</label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={clientQuery}
            placeholder="Select client"
            style={inputStyle}
            onChange={(e) => {
              setClientQuery(e.target.value);
              setShowClientDropdown(true);
              setSelectedClient('');
            }}
            onFocus={() => setShowClientDropdown(true)}
          />

          <span style={dropdownArrowStyle}>▾</span>

          {showClientDropdown && (
            <div style={clientDropdownStyle}>
              {filteredClients.length === 0 && (
                <div style={dropdownItemMuted}>No matches</div>
              )}

              {filteredClients.slice(0, 100).map(c => (
                <div
                  key={c.id}
                  style={dropdownItemStyle}
                  onClick={() => {
                    setSelectedClient(c.id);
                    setClientQuery(`${c.first_name} ${c.last_name}`);
                    setShowClientDropdown(false);
                  }}
                >
                  {c.first_name} {c.last_name}
                </div>
              ))}
            </div>
          )}
        </div>

        <label style={labelStyle}>Loan</label>
        <select
          value={selectedLoan}
          onChange={(e) => setSelectedLoan(e.target.value)}
          style={inputStyle}
          disabled={!selectedClient}
        >
          <option value="">Select Loan</option>
          {loans.map(l => (
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
          step="0.01"
        />

        <label style={labelStyle}>Reference</label>
        <input
          type="text"
          name="reference"
          value={form.reference}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={labelStyle}>Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          style={{ ...inputStyle, height: '80px' }}
        />

        <button type="submit" style={submitBtnStyle}>
          Save & Add Next Payment
        </button>

        {message && <div style={messageBoxStyle}>{message}</div>}
      </form>
    </div>
  );
}

/* ---------------- Styles ---------------- */

const pageStyle = {
  padding: '1.5rem',
  maxWidth: '900px',
  margin: '0 auto',
};

const formCardStyle = {
  width: '75%',
  background: '#fff',
  padding: '2rem',
  borderRadius: '8px',
  boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const labelStyle = { fontWeight: 600 };

const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '1rem',
};

const dropdownArrowStyle = {
  position: 'absolute',
  right: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  color: '#666',
};

const clientDropdownStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: '#fff',
  border: '1px solid #ccc',
  borderRadius: '4px',
  marginTop: '4px',
  maxHeight: '240px',
  overflowY: 'auto',
  zIndex: 20,
  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
};

const dropdownItemStyle = {
  padding: '8px 10px',
  cursor: 'pointer',
};

const dropdownItemMuted = {
  padding: '8px 10px',
  color: '#999',
};

const submitBtnStyle = {
  marginTop: '1.5rem',
  padding: '0.75rem',
  background: '#0176d3',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontWeight: 600,
  cursor: 'pointer',
};

const messageBoxStyle = {
  marginTop: '1rem',
  padding: '0.75rem',
  background: '#d4edda',
  borderRadius: '4px',
  textAlign: 'center',
};
