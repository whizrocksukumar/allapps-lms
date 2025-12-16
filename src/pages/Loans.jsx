import React, { useState, useEffect } from 'react';
import { useLoans } from '../hooks/useLoans';
import { supabase } from "../services/supabaseService";
import PageHeader from '../components/PageHeader';
import Client360Modal from '../components/Client360Modal';
import Loans360Modal from '../components/Loans360Modal';
import NewLoanModal from '../components/NewLoanModal';
import './Loans.css';

export default function Loans() {
  const { loans, loading, error, refetch } = useLoans();
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [products, setProducts] = useState([]);

  // Modals
  const [showClient360, setShowClient360] = useState(false);
  const [showLoan360, setShowLoan360] = useState(false);
  const [showNewLoan, setShowNewLoan] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Form state for new loan
  const [formData, setFormData] = useState({
    client_id: '',
    product_id: '',
    loan_amount: '',
    establishment_fee: '',
    start_date: new Date().toISOString().split('T')[0],
    term: 'Monthly'
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterLoans();
  }, [loans, search, statusFilter]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_products')
        .select('id, product_name, annual_interest_rate')
        .eq('status', 'active')
        .order('product_name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const filterLoans = () => {
    let result = [...loans];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        (l.loan_number && l.loan_number.toLowerCase().includes(q)) ||
        (l.client_id?.first_name && l.client_id.first_name.toLowerCase().includes(q)) ||
        (l.client_id?.last_name && l.client_id.last_name.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(l => l.status === statusFilter);
    }

    setFilteredLoans(result);
  };

  const openClient = (clientId) => {
    setSelectedClientId(clientId);
    setShowClient360(true);
  };

  const openLoan = (loan) => {
    setSelectedLoan(loan);
    setShowLoan360(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateLoan = async () => {
    if (!formData.client_id || !formData.product_id || !formData.loan_amount || !formData.start_date || !formData.term) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await supabase.functions.invoke('create-loan', {
        body: {
          client_id: formData.client_id,
          product_id: formData.product_id,
          loan_amount: parseFloat(formData.loan_amount),
          establishment_fee: parseFloat(formData.establishment_fee) || 0,
          start_date: formData.start_date,
          term: formData.term,
          status: 'active'
        }
      });

      if (response.error) throw response.error;

      setShowNewLoan(false);
      setFormData({
        client_id: '',
        product_id: '',
        loan_amount: '',
        establishment_fee: '',
        start_date: new Date().toISOString().split('T')[0],
        term: 'Monthly'
      });
      refetch();
    } catch (err) {
      console.error('Error creating loan:', err);
      alert('Failed to create loan: ' + err.message);
    }
  };

  return (
    <div className="loans-page">
      <PageHeader
        title="Loans"
        subtitle="Manage loan accounts"
        actions={
          <button
            className="btn-primary"
            onClick={() => setShowNewLoan(true)}
          >
            + New Loan
          </button>
        }
      />

      {/* Controls */}
      <div className="loans-controls">
        <div className="loans-search">
          <input
            type="text"
            placeholder="Search loans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="loans-filters">
          <div className="status-filter-group">
            <span className="status-label">Status:</span>
            {['All', 'active', 'pending', 'closed', 'written off'].map(s => (
              <button
                key={s}
                className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="loans-table">
          <thead>
            <tr>
              <th>Loan #</th>
              <th>Client</th>
              <th>Principal</th>
              <th>Balance</th>
              <th>Rate</th>
              <th>Term</th>
              <th>Status</th>
              <th>Opened</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="loading-state">Loading...</td></tr>
            ) : filteredLoans.length === 0 ? (
              <tr><td colSpan="8" className="empty-state">No loans found.</td></tr>
            ) : (
              filteredLoans.map(loan => (
                <tr key={loan.id}>
                  <td>
                    <button
                      className="loan-link"
                      onClick={() => openLoan(loan)}
                    >
                      {loan.loan_number}
                    </button>
                  </td>
                  <td>
                    <button
                      className="client-link"
                      onClick={() => openClient(loan.client_id?.id)}
                    >
                      {loan.client_id?.first_name} {loan.client_id?.last_name}
                    </button>
                  </td>
                  <td>${loan.loan_amount?.toFixed(2)}</td>
                  <td>${loan.current_outstanding_balance?.toFixed(2) || '0.00'}</td>
                  <td>{loan.annual_interest_rate}%</td>
                  <td>{loan.instalments_due} {loan.term === 'Weekly' ? 'wks' : loan.term === 'Fortnightly' ? 'fn' : 'mths'}</td>
                  <td>
                    <span className={`status-badge ${loan.status?.toLowerCase().replace(' ', '-') || ''}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td>{loan.start_date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Loan Modal */}
      {showNewLoan && (
        <div className="modal-overlay" onClick={() => setShowNewLoan(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Loan</h2>
              <button className="modal-close" onClick={() => setShowNewLoan(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Client Select */}
              <div className="form-group">
                <label>Client *</label>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleFormChange}
                  className="form-input"
                >
                  <option value="">Select a client</option>
                  {/* Clients will be populated from your data */}
                </select>
              </div>

              {/* Product Select */}
              <div className="form-group">
                <label>Product *</label>
                <select
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleFormChange}
                  className="form-input"
                >
                  <option value="">Select a product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} - {p.annual_interest_rate}%
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan Amount */}
              <div className="form-group">
                <label>Loan Amount *</label>
                <input
                  type="number"
                  name="loan_amount"
                  value={formData.loan_amount}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  className="form-input"
                />
              </div>

              {/* Establishment Fee */}
              <div className="form-group">
                <label>Establishment Fee</label>
                <input
                  type="number"
                  name="establishment_fee"
                  value={formData.establishment_fee}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  className="form-input"
                />
              </div>

              {/* Start Date */}
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleFormChange}
                  className="form-input"
                />
              </div>

              {/* Term Dropdown */}
              <div className="form-group">
                <label>Repayment Frequency *</label>
                <select
                  name="term"
                  value={formData.term}
                  onChange={handleFormChange}
                  className="form-input"
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Fortnightly">Fortnightly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowNewLoan(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreateLoan}>
                Create Loan
              </button>
            </div>
          </div>
        </div>
      )}

      {showClient360 && <Client360Modal isOpen={showClient360} onClose={() => setShowClient360(false)} clientId={selectedClientId} />}
      {showLoan360 && <Loans360Modal loan={selectedLoan} onClose={() => setShowLoan360(false)} />}
    </div>
  );
}