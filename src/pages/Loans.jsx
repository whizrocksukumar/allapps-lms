// src/pages/Loans.jsx
import React, { useState, useEffect } from 'react';
import { getClients, addLoan, generateLoanSchedule, getLoansWithClientNames } from '../services/supabaseService';

const styles = {
  container: {
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  searchInput: {
    padding: '0.75rem',
    width: '300px',
    border: '1px solid #706e6b',
    borderRadius: '4px',
  },
  addButton: {
    backgroundColor: '#0176d3',
    color: '#ffffff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  loanList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1rem',
  },
  loanCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
  },
  loanHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  loanNumber: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#0176d3',
  },
  status: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  open: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  closed: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#ffffff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    width: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    zIndex: 1000,
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #706e6b',
    borderRadius: '4px',
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #706e6b',
    borderRadius: '4px',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: '#ffffff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    color: '#ffffff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

const loanProducts = [
  { id: 1, name: 'Short Term', rate: 5.50, term: 3 },
  { id: 2, name: 'Short Term', rate: 7.20, term: 6 },
  { id: 3, name: 'Long Term', rate: 9.50, term: 12 },
  { id: 4, name: 'Long Term', rate: 12.00, term: 24 },
];

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    product_id: '',
    principal: '',
    establishment_fee: '45',
  });

  useEffect(() => {
    const fetchData = async () => {
      const [clientData, loanData] = await Promise.all([
        getClients(),
        getLoansWithClientNames()
      ]);
      setClients(clientData || []);
      setLoans(loanData || []);
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateLoan = async () => {
    const result = await addLoan(formData);
    if (result.success) {
      await generateLoanSchedule(result.data.id);
      const updatedLoans = await getLoansWithClientNames();
      setLoans(updatedLoans || []);
      setIsModalOpen(false);
      setFormData({ client_id: '', product_id: '', principal: '', establishment_fee: '45' });
    }
  };

  const filteredLoans = loans.filter(loan =>
    loan.loan_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <input
          type="text"
          placeholder="Search loans..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button style={styles.addButton} onClick={() => setIsModalOpen(true)}>
          Create New Loan
        </button>
      </div>

      <div style={styles.loanList}>
        {filteredLoans.map(loan => (
          <div key={loan.id} style={styles.loanCard}>
            <div style={styles.loanHeader}>
              <div style={styles.loanNumber}>{loan.loan_number}</div>
              <div style={{ ...styles.status, ...(loan.status === 'open' ? styles.open : styles.closed) }}>
                {loan.status.toUpperCase()}
              </div>
            </div>
            <div><strong>Client:</strong> {loan.client_name}</div>
            <div><strong>Principal:</strong> ${parseFloat(loan.principal).toFixed(2)}</div>
            <div><strong>Balance:</strong> ${loan.balance?.toFixed(2) || '0.00'}</div>
            <div><strong>Rate:</strong> {loan.interest_rate}%</div>
            <div><strong>Term:</strong> {loan.term} months</div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={styles.modal}>
          <h2>Create New Loan</h2>
          <select
            name="client_id"
            style={styles.select}
            value={formData.client_id}
            onChange={handleInputChange}
          >
            <option value="">Select Client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.code} - {client.name}
              </option>
            ))}
          </select>
          <select
            name="product_id"
            style={styles.select}
            value={formData.product_id}
            onChange={handleInputChange}
          >
            <option value="">Select Product</option>
            {loanProducts.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} - {p.rate}% - {p.term} months
              </option>
            ))}
          </select>
          <input
            name="principal"
            placeholder="Principal Amount"
            type="number"
            style={styles.input}
            value={formData.principal}
            onChange={handleInputChange}
          />
          <input
            name="establishment_fee"
            placeholder="Establishment Fee"
            type="number"
            style={styles.input}
            value={formData.establishment_fee}
            onChange={handleInputChange}
          />
          <div style={styles.buttonGroup}>
            <button style={styles.saveButton} onClick={handleCreateLoan}>Create Loan</button>
            <button style={styles.cancelButton} onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;