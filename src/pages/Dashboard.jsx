import React, { useState, useEffect } from 'react';
import { getLoansWithClientNames, getClients, updateLoan, updateClient, getTransactionsForLoan, getLoansForClient, addLoan, addClient, getLoanProducts, createLoanProduct, getClientLoans, getNextLoanNumber } from '../services/supabaseService';

export default function Dashboard() {
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [loanData, clientData] = await Promise.all([
        getLoansWithClientNames(),
        getClients()
      ]);
      setLoans(loanData || []);
      setClients(clientData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <h1>💰 Dashboard</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => setShowAddLoan(true)} style={btnStyle}>➕ Add Loan</button>
        <button onClick={() => setShowAddClient(true)} style={btnStyle}>➕ Add Client</button>
        <button onClick={fetchData} style={btnStyle}>🔄 Refresh</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h2>📊 Loans ({loans.length})</h2>
          {loans.length === 0 ? (
            <p>No loans found</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Loan #</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Balance</th>
                  <th style={thStyle}>Rate</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan, i) => (
                  <tr key={i}>
                    <td style={tdStyle}>{loan.loan_number}</td>
                    <td style={tdStyle}>{loan.client_name}</td>
                    <td style={tdStyle}>${(loan.balance || 0).toFixed(2)}</td>
                    <td style={tdStyle}>{loan.interest_rate}%</td>
                    <td style={tdStyle}>{loan.status}</td>
                    <td style={tdStyle}>
                      <button onClick={() => setSelectedLoan(loan)} style={smallBtnStyle}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2 style={{ marginTop: '3rem' }}>👥 Clients ({clients.length})</h2>
          {clients.length === 0 ? (
            <p>No clients found</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Code</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, i) => (
                  <tr key={i}>
                    <td style={tdStyle}>{client.code}</td>
                    <td style={tdStyle}>{client.full_name}</td>
                    <td style={tdStyle}>{client.email}</td>
                    <td style={tdStyle}>
                      <button onClick={() => setSelectedClient(client)} style={smallBtnStyle}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {selectedLoan && <LoanModal loan={selectedLoan} onClose={() => setSelectedLoan(null)} />}
      {selectedClient && <ClientModal client={selectedClient} onClose={() => setSelectedClient(null)} />}
      {showAddLoan && <AddLoanModal clients={clients} onClose={() => setShowAddLoan(false)} onSuccess={fetchData} />}
      {showAddClient && <AddClientModal onClose={() => setShowAddClient(false)} onSuccess={fetchData} />}
    </div>
  );
}

function AddLoanModal({ clients, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    client_id: '',
    loan_number: '',
    product_id: '',
    principal: '',
    term: 12,
    term_unit: 'months',
    status: 'active'
  });
  
  const [loanProducts, setLoanProducts] = useState([]);
  const [clientLoans, setClientLoans] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', interest_rate: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLoanProducts();
  }, []);

  useEffect(() => {
    if (formData.client_id) {
      fetchClientLoans();
      generateLoanNumber();
    }
  }, [formData.client_id]);

  const fetchLoanProducts = async () => {
    const data = await getLoanProducts();
    setLoanProducts(data);
  };

  const fetchClientLoans = async () => {
    const data = await getClientLoans(formData.client_id);
    setClientLoans(data || []);
  };

  const generateLoanNumber = async () => {
    const loanNum = await getNextLoanNumber();
    setFormData(prev => ({ ...prev, loan_number: loanNum }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.interest_rate) {
      alert('Enter product name and interest rate');
      return;
    }

    const result = await createLoanProduct({
      name: newProduct.name,
      interest_rate: parseFloat(newProduct.interest_rate)
    });

    if (result) {
      alert('✅ Product added!');
      setNewProduct({ name: '', interest_rate: '' });
      setShowAddProduct(false);
      fetchLoanProducts();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_id || !formData.loan_number || !formData.product_id || !formData.principal || !formData.term) {
      alert('Fill all required fields');
      return;
    }

    const selectedProduct = loanProducts.find(p => p.id === formData.product_id);
    
    setLoading(true);
    const result = await addLoan({
      client_id: formData.client_id,
      loan_number: formData.loan_number,
      principal: parseFloat(formData.principal),
      balance: parseFloat(formData.principal),
      interest_rate: selectedProduct?.interest_rate || 0,
      term: formData.term,
      term_unit: formData.term_unit,
      status: formData.status,
      date_open: new Date().toISOString().split('T')[0]
    });

    if (result) {
      alert('✅ Loan added!');
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalContent, maxHeight: '95vh' }} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <h2 style={modalTitle}>Add New Loan</h2>
          <button onClick={onClose} style={closeButton}>✕</button>
        </div>

        <div style={{ padding: '2rem', overflowY: 'auto', maxHeight: '80vh' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#0176d3', marginBottom: '1rem' }}>📋 Select Client</h3>
              <label style={label}>Client *</label>
              <select 
                value={formData.client_id} 
                onChange={(e) => setFormData({...formData, client_id: e.target.value})} 
                style={input} 
                required
              >
                <option value="">Select Client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.full_name}</option>
                ))}
              </select>

              {clientLoans.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  <h4>📋 Existing Loans for this Client</h4>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Loan #</th>
                        <th style={thStyle}>Balance</th>
                        <th style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientLoans.map((l, i) => (
                        <tr key={i}>
                          <td style={tdStyle}>{l.loan_number}</td>
                          <td style={tdStyle}>${(l.balance || 0).toFixed(2)}</td>
                          <td style={tdStyle}>{l.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#0176d3', marginBottom: '1rem' }}>💵 Loan Details</h3>
              <div style={gridTwoCols}>
                <div>
                  <label style={label}>Loan Number *</label>
                  <input 
                    type="text" 
                    value={formData.loan_number} 
                    style={input} 
                    disabled 
                    placeholder="Auto-generated"
                  />
                </div>
                <div>
                  <label style={label}>Principal ($) *</label>
                  <input 
                    type="number" 
                    value={formData.principal} 
                    onChange={(e) => setFormData({...formData, principal: e.target.value})} 
                    style={input} 
                    step="0.01" 
                    required 
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#0176d3', marginBottom: '1rem' }}>📊 Interest Rate</h3>
              <div style={gridTwoCols}>
                <div>
                  <label style={label}>Product/Rate *</label>
                  <select 
                    value={formData.product_id} 
                    onChange={(e) => setFormData({...formData, product_id: e.target.value})} 
                    style={input} 
                    required
                  >
                    <option value="">Select Product</option>
                    {loanProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.interest_rate}%
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={label}>&nbsp;</label>
                  <button 
                    type="button" 
                    onClick={() => setShowAddProduct(true)} 
                    style={{ ...input, backgroundColor: '#0176d3', color: 'white', cursor: 'pointer', padding: '0.75rem' }}
                  >
                    ➕ Add New Rate
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#0176d3', marginBottom: '1rem' }}>⏱️ Loan Term</h3>
              <div style={gridTwoCols}>
                <div>
                  <label style={label}>Duration *</label>
                  <input 
                    type="number" 
                    value={formData.term} 
                    onChange={(e) => setFormData({...formData, term: parseInt(e.target.value)})} 
                    style={input} 
                    required 
                  />
                </div>
                <div>
                  <label style={label}>Unit *</label>
                  <select 
                    value={formData.term_unit} 
                    onChange={(e) => setFormData({...formData, term_unit: e.target.value})} 
                    style={input}
                  >
                    <option value="months">Months</option>
                    <option value="fortnights">Fortnights (14 days)</option>
                    <option value="weeks">Weeks</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={modalFooter}>
              <button type="submit" style={btnStyle} disabled={loading}>
                {loading ? 'Adding...' : '➕ Add Loan'}
              </button>
              <button type="button" onClick={onClose} style={{...btnStyle, backgroundColor: '#666'}}>Cancel</button>
            </div>
          </form>

          {showAddProduct && (
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
              <h3>Create New Interest Rate</h3>
              <form onSubmit={handleAddProduct}>
                <input 
                  placeholder="Product Name (e.g., 'Standard 6-Month')" 
                  value={newProduct.name} 
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} 
                  style={input} 
                  required 
                />
                <input 
                  placeholder="Interest Rate (%)" 
                  type="number" 
                  step="0.01"
                  value={newProduct.interest_rate} 
                  onChange={(e) => setNewProduct({...newProduct, interest_rate: e.target.value})} 
                  style={input} 
                  required 
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" style={btnStyle}>Create Rate</button>
                  <button type="button" onClick={() => setShowAddProduct(false)} style={{...btnStyle, backgroundColor: '#666'}}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoanModal({ loan, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getTransactionsForLoan(loan.id);
      setTransactions(data || []);
      setLoading(false);
    })();
  }, [loan]);

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Loan: {loan.loan_number}</h2>
        <p><strong>Client:</strong> {loan.client_name}</p>
        <p><strong>Principal:</strong> ${(loan.principal || 0).toFixed(2)}</p>
        <p><strong>Balance:</strong> ${(loan.balance || 0).toFixed(2)}</p>
        <p><strong>Interest Rate:</strong> {loan.interest_rate}%</p>
        <p><strong>Status:</strong> {loan.status}</p>
        <h3>Transactions</h3>
        {loading ? <p>Loading...</p> : transactions.length === 0 ? <p>No transactions</p> : (
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>Date</th><th style={thStyle}>Amount</th></tr></thead>
            <tbody>{transactions.map((t, i) => <tr key={i}><td style={tdStyle}>{t.date}</td><td style={tdStyle}>${(t.total || 0).toFixed(2)}</td></tr>)}</tbody>
          </table>
        )}
        <button onClick={onClose} style={btnStyle}>Close</button>
      </div>
    </div>
  );
}

function ClientModal({ client, onClose }) {
  const [clientLoans, setClientLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getLoansForClient(client.id);
      setClientLoans(data || []);
      setLoading(false);
    })();
  }, [client]);

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Client: {client.code}</h2>
        <p><strong>Name:</strong> {client.full_name}</p>
        <p><strong>Email:</strong> {client.email}</p>
        <h3>Loans</h3>
        {loading ? <p>Loading...</p> : clientLoans.length === 0 ? <p>No loans</p> : (
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>Loan #</th><th style={thStyle}>Balance</th></tr></thead>
            <tbody>{clientLoans.map((l, i) => <tr key={i}><td style={tdStyle}>{l.loan_number}</td><td style={tdStyle}>${(l.balance || 0).toFixed(2)}</td></tr>)}</tbody>
          </table>
        )}
        <button onClick={onClose} style={btnStyle}>Close</button>
      </div>
    </div>
  );
}

function AddClientModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({ code: '', full_name: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) { alert('Name and Email required'); return; }
    setLoading(true);
    const result = await addClient(formData);
    if (result) { alert('Client added!'); onSuccess(); onClose(); }
    setLoading(false);
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Add Client</h2>
        <form onSubmit={handleSubmit}>
          <input placeholder="Code" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} style={input} />
          <input placeholder="Full Name *" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} style={input} required />
          <input placeholder="Email *" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={input} required />
          <input placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={input} />
          <textarea placeholder="Address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} style={{...input, minHeight: '80px'}} />
          <button type="submit" style={btnStyle} disabled={loading}>{loading ? 'Adding...' : 'Add Client'}</button>
          <button type="button" onClick={onClose} style={{...btnStyle, backgroundColor: '#666'}}>Cancel</button>
        </form>
      </div>
    </div>
  );
}

const btnStyle = { backgroundColor: '#0176d3', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold' };
const smallBtnStyle = { backgroundColor: '#0176d3', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', marginTop: '1rem', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const thStyle = { padding: '1rem', textAlign: 'left', backgroundColor: '#f3f2f2', fontWeight: 'bold', borderBottom: '2px solid #dddbda' };
const tdStyle = { padding: '1rem', borderBottom: '1px solid #dddbda' };
const input = { width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #dddbda', borderRadius: '4px', fontSize: '1rem', boxSizing: 'border-box' };
const gridTwoCols = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' };
const label = { fontSize: '0.85rem', color: '#706e6b', fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContent = { backgroundColor: 'white', borderRadius: '8px', maxWidth: '600px', width: '95%', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' };
const modalHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '2px solid #0176d3', backgroundColor: '#f8f9fa' };
const modalTitle = { margin: 0, fontSize: '1.5rem', color: '#181818', fontWeight: 'bold' };
const closeButton = { backgroundColor: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#706e6b' };
const modalFooter = { display: 'flex', gap: '1rem', padding: '1.5rem', borderTop: '1px solid #dddbda', justifyContent: 'flex-end' };