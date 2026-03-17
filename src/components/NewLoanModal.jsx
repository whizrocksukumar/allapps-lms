// src/components/NewLoanModal.jsx - MINIMAL CHANGES ONLY
// Updated: 22-DEC-2025 - Added ONLY 7 requested features
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabaseService";
import NewClientModal from "./NewClientModal";

// Real interest rates used in production
const STANDARD_RATES = [
  { label: '5.50%', value: 5.50 },
  { label: '6.00%', value: 6.00 },
  { label: '7.20%', value: 7.20 },
  { label: '9.50%', value: 9.50 },
  { label: '12.00%', value: 12.00 },
];

const ESTABLISHMENT_FEE_TIERS = [
  { min: 10000, fee: 495 },
  { min: 5000, fee: 395 },
  { min: 1000, fee: 225 },
  { min: 0, fee: 45 }
];

const WEEKLY_FEES = 27; // $25 management + $2 admin

export default function NewLoanModal({ onClose, reloadLoans, initialLoan = null, initialMode = 'new' }) {
  const [formData, setFormData] = useState({
    loanType: 'new',
    client_id: '',
    loan_amount: '',
    annual_interest_rate: 5.50,
    establishment_fee: '',
    other_fees: '',
    start_date: new Date().toISOString().split('T')[0],
    repayment_frequency: 'Weekly',
    repayment_amount: '',
    term_months: '',
    existing_loan_id: '',
  });

  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [existingLoans, setExistingLoans] = useState([]);
  const [activeLoan, setActiveLoan] = useState(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rateMode, setRateMode] = useState('standard');
  const [recommendedTerm, setRecommendedTerm] = useState(null);
  const searchInputRef = useRef(null);

  // INITIALIZATION
  useEffect(() => {
    if (initialLoan && initialMode === 'refinance') {
      const clientId = initialLoan.client_id?.id || initialLoan.client_id;
      if (clientId) {
        setFormData(prev => ({
          ...prev,
          loanType: 'refinance',
          client_id: clientId,
          existing_loan_id: initialLoan.id,
          annual_interest_rate: initialLoan.annual_interest_rate || 5.50,
          repayment_frequency: initialLoan.repayment_frequency || 'Weekly',
        }));
      }
    }
  }, [initialLoan, initialMode]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, first_name, last_name, client_code")
      .order('first_name');
    if (error) {
      console.error("Error fetching clients:", error);
    } else {
      setClients(data || []);
      setFilteredClients((data || []).slice(0, 10));
    }
  };

  // FUZZY SEARCH for clients
  const handleClientSearch = (value) => {
    setSearchTerm(value);
    setShowClientDropdown(true);
    
    if (!value.trim()) {
      setFilteredClients(clients.slice(0, 10));
      return;
    }

    const searchLower = value.toLowerCase();
    const filtered = clients.filter(c => {
      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
      const code = (c.client_code || '').toLowerCase();
      return fullName.includes(searchLower) || code.includes(searchLower);
    }).slice(0, 10);

    setFilteredClients(filtered);
  };

  const selectClient = (client) => {
    setFormData({ ...formData, client_id: client.id });
    setSearchTerm(`${client.first_name} ${client.last_name} (${client.client_code})`);
    setShowClientDropdown(false);
  };

  useEffect(() => {
    if (formData.client_id) {
      checkActiveLoans(formData.client_id);
    } else {
      setExistingLoans([]);
      setActiveLoan(null);
    }
  }, [formData.client_id]);

  const checkActiveLoans = async (clientId) => {
    const { data } = await supabase
      .from('loans')
      .select('id, loan_number, loan_amount, loan_balances(current_outstanding_balance), status')
      .eq('client_id', clientId)
      .eq('status', 'active');
    
    const loansWithBalance = (data || []).map(loan => ({
      ...loan,
      current_outstanding_balance: loan.loan_balances?.[0]?.current_outstanding_balance || 0
    }));
    
    setExistingLoans(loansWithBalance);
    
    if (loansWithBalance.length > 0) {
      setActiveLoan(loansWithBalance[0]);
      if (formData.loanType === 'refinance') {
        setFormData(prev => ({ ...prev, existing_loan_id: loansWithBalance[0].id }));
      }
    } else {
      setActiveLoan(null);
    }
  };

  // AUTO-CALCULATE ESTABLISHMENT FEE
  useEffect(() => {
    let amount = 0;
    if (formData.loanType === 'new') {
      amount = parseFloat(formData.loan_amount) || 0;
    } else if (formData.loanType === 'refinance' && activeLoan) {
      amount = activeLoan.current_outstanding_balance || 0;
    }

    if (amount > 0) {
      let fee = 45;
      for (const tier of ESTABLISHMENT_FEE_TIERS) {
        if (amount >= tier.min) { fee = tier.fee; break; }
      }
      setFormData(prev => ({ ...prev, establishment_fee: fee.toFixed(2) }));
    }
  }, [formData.loan_amount, formData.loanType, activeLoan]);

  // PRE-FILL REFINANCE AMOUNT
  useEffect(() => {
    if (formData.loanType === 'refinance' && activeLoan) {
      setFormData(prev => ({ 
        ...prev, 
        loan_amount: (activeLoan.current_outstanding_balance || 0).toFixed(2),
        existing_loan_id: activeLoan.id
      }));
    }
  }, [formData.loanType, activeLoan]);

  // CALCULATE RECOMMENDED TERM
  useEffect(() => {
    if (!formData.annual_interest_rate || !formData.repayment_amount) {
      setRecommendedTerm(null);
      return;
    }

    const totalLoan = (parseFloat(formData.loan_amount) || 0) + (parseFloat(formData.establishment_fee) || 0) + (parseFloat(formData.other_fees) || 0);
    const annualRate = formData.annual_interest_rate / 100;
    const monthlyRate = annualRate / 12;
    const repaymentAmount = parseFloat(formData.repayment_amount) || 0;

    if (repaymentAmount <= 0 || totalLoan <= 0) {
      setRecommendedTerm(null);
      return;
    }

    let paymentPerMonth = 0;
    let weeklyFeePerMonth = 0;

    if (formData.repayment_frequency === 'Weekly') {
      paymentPerMonth = repaymentAmount * 4.33;
      weeklyFeePerMonth = WEEKLY_FEES * 4.33;
    } else if (formData.repayment_frequency === 'Fortnightly') {
      paymentPerMonth = repaymentAmount * 2.17;
      weeklyFeePerMonth = WEEKLY_FEES * 2.17;
    } else {
      paymentPerMonth = repaymentAmount;
      weeklyFeePerMonth = WEEKLY_FEES * 4.33;
    }

    const netPayment = paymentPerMonth - weeklyFeePerMonth;
    if (netPayment <= totalLoan * monthlyRate) {
      setRecommendedTerm(null);
      return;
    }

    const months = Math.log(netPayment / (netPayment - totalLoan * monthlyRate)) / Math.log(1 + monthlyRate);
    setRecommendedTerm(Math.ceil(months));
  }, [formData.annual_interest_rate, formData.loan_amount, formData.establishment_fee, formData.other_fees, formData.repayment_amount, formData.repayment_frequency]);

  const handleSubmit = async () => {
    const conflict = validateForm();
    if (conflict) {
      alert(conflict);
      return;
    }

    setLoading(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-loan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          client_id: formData.client_id,
          loan_amount: parseFloat(formData.loan_amount),
          annual_interest_rate: parseFloat(formData.annual_interest_rate),
          establishment_fee: parseFloat(formData.establishment_fee) || 0,
          start_date: formData.start_date,
          repayment_frequency: formData.repayment_frequency,
          term_months: parseInt(formData.term_months),
          is_consolidation: formData.loanType === 'refinance',
          existing_loan_id: formData.existing_loan_id || null,
          source: formData.loanType === 'refinance' ? 'consolidation' : 'new_application'
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to create loan');
      }

      alert('Loan created successfully!');
      reloadLoans();
      onClose();
    } catch (error) {
      console.error('Error creating loan:', error);
      alert('Error creating loan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.client_id) return 'Please select a client';
    if (!formData.loan_amount || parseFloat(formData.loan_amount) <= 0) return 'Please enter a valid loan amount';
    if (!formData.annual_interest_rate || parseFloat(formData.annual_interest_rate) <= 0) return 'Please select or enter an interest rate';
    if (!formData.term_months || parseInt(formData.term_months) <= 0) return 'Please enter a valid term';
    if (!formData.start_date) return 'Please select a start date';

    if (formData.loanType === 'new' && existingLoans.length > 0) {
      return 'This client has an active loan. Please select "Refinance" option to refinance the existing loan.';
    }
    if (formData.loanType === 'refinance' && existingLoans.length === 0) {
      return 'This client has no active loans. Please select "New Loan" option instead.';
    }

    return null;
  };

  const totalLoanAmount = (parseFloat(formData.loan_amount) || 0) + (parseFloat(formData.establishment_fee) || 0) + (parseFloat(formData.other_fees) || 0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={styles.overlay} onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        
        <div style={styles.header}>
          <h2 style={styles.title}>
            {formData.loanType === 'refinance' ? 'Refinance Loan' : 'New Loan'}
          </h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.form}>
          
          {/* STEP 1: LOAN TYPE */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Step 1: Loan Type</h4>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label style={styles.radio}>
                <input 
                  type="radio" 
                  name="loanType" 
                  value="new" 
                  checked={formData.loanType === 'new'} 
                  onChange={() => setFormData({ ...formData, loanType: 'new', existing_loan_id: '' })} 
                />
                <span>New Loan</span>
              </label>
              <label style={styles.radio}>
                <input 
                  type="radio" 
                  name="loanType" 
                  value="refinance" 
                  checked={formData.loanType === 'refinance'} 
                  onChange={() => setFormData({ ...formData, loanType: 'refinance' })} 
                />
                <span>Refinance</span>
              </label>
            </div>
          </div>

          {/* STEP 2: LOAN DETAILS */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Step 2: Loan Details</h4>

            {/* Client - FUZZY SEARCH */}
            <div style={styles.formGroup} ref={searchInputRef}>
              <label style={styles.label}>Client *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="Start typing client name or code..."
                    value={searchTerm}
                    onChange={(e) => handleClientSearch(e.target.value)}
                    onFocus={() => setShowClientDropdown(true)}
                  />
                  
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div style={styles.dropdown}>
                      {filteredClients.map(client => (
                        <div
                          key={client.id}
                          style={styles.dropdownItem}
                          onClick={() => selectClient(client)}
                        >
                          {client.first_name} {client.last_name} <span style={{ color: '#666', fontSize: '0.85rem' }}>({client.client_code})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => setShowNewClientForm(true)} style={styles.btnSecondary}>+ New</button>
              </div>
              
              {formData.client_id && formData.loanType === 'new' && existingLoans.length > 0 && (
                <div style={styles.error}>⚠️ This client has an active loan. Please select "Refinance" option to refinance the existing loan.</div>
              )}
              {formData.client_id && formData.loanType === 'refinance' && existingLoans.length === 0 && (
                <div style={styles.error}>⚠️ This client has no active loans. Please select "New Loan" option instead.</div>
              )}
            </div>

            {/* Interest Rate % */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Interest Rate % *</label>
              
              {rateMode === 'standard' ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    style={{ ...styles.input, flex: 1 }}
                    value={formData.annual_interest_rate}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      annual_interest_rate: parseFloat(e.target.value) 
                    })}
                  >
                    {STANDARD_RATES.map(rate => (
                      <option key={rate.value} value={rate.value}>
                        {rate.label}
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    onClick={() => {
                      setRateMode('custom');
                      setFormData({ ...formData, annual_interest_rate: '' });
                    }}
                    style={styles.btnSecondary}
                  >
                    Custom Rate
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    style={{ ...styles.input, flex: 1 }}
                    placeholder="Enter custom rate (e.g., 8.75)"
                    value={formData.annual_interest_rate}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      annual_interest_rate: e.target.value 
                    })}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      setRateMode('standard');
                      setFormData({ ...formData, annual_interest_rate: 5.50 });
                    }}
                    style={styles.btnSecondary}
                  >
                    Standard Rates
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Start Date *</label>
                <input type="date" style={styles.input} value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Frequency *</label>
                <select style={styles.input} value={formData.repayment_frequency} onChange={e => setFormData({ ...formData, repayment_frequency: e.target.value })}>
                  <option value="Monthly">Monthly</option>
                  <option value="Fortnightly">Fortnightly</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>
            </div>

            {formData.loanType === 'new' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Loan Amount *</label>
                <input type="number" step="0.01" style={styles.input} value={formData.loan_amount} onChange={e => setFormData({ ...formData, loan_amount: e.target.value })} placeholder="4000" />
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Establishment Fee</label>
              <input type="number" step="0.01" style={styles.input} value={formData.establishment_fee} onChange={e => setFormData({ ...formData, establishment_fee: e.target.value })} placeholder="Auto-calculated" />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Repayment Amount *</label>
              <input type="number" step="0.01" style={styles.input} value={formData.repayment_amount} onChange={e => setFormData({ ...formData, repayment_amount: e.target.value })} placeholder="500" />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Term *</label>
              <input type="number" style={styles.input} value={formData.term_months} onChange={e => setFormData({ ...formData, term_months: e.target.value })} placeholder="12" />
              {recommendedTerm && <div style={styles.hint}>💡 Recommended based on repayment: {recommendedTerm} periods</div>}
            </div>
          </div>

          {/* STEP 3: FUNDS FROM REFINANCE */}
          {formData.loanType === 'refinance' && (
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Step 3: Funds from Refinance</h4>
              
              {activeLoan ? (
                <div style={styles.infoBox}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Loan Number:</span>
                    <span style={styles.infoValue}>{activeLoan.loan_number}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Outstanding Amount:</span>
                    <span style={{ ...styles.infoValue, color: '#0176d3', fontWeight: 'bold', fontSize: '1.1rem' }}>
                      ${(activeLoan.current_outstanding_balance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={styles.error}>No active loan found for this client.</div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Loan Amount</label>
                <input 
                  type="number" 
                  style={styles.input} 
                  value={formData.loan_amount} 
                  onChange={e => setFormData({ ...formData, loan_amount: e.target.value })} 
                  placeholder="Auto-filled from outstanding balance"
                />
              </div>
            </div>
          )}

          <div style={styles.summary}>
            <div style={styles.summaryRow}>
              <span>Loan Amount:</span>
              <span>${(parseFloat(formData.loan_amount) || 0).toFixed(2)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Establishment Fee:</span>
              <span>${(parseFloat(formData.establishment_fee) || 0).toFixed(2)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Other Fees:</span>
              <span>${(parseFloat(formData.other_fees) || 0).toFixed(2)}</span>
            </div>
            <div style={{ ...styles.summaryRow, fontWeight: 'bold', fontSize: '1.1rem', borderTop: '2px solid #0176d3', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
              <span>Total Loan Amount:</span>
              <span style={{ color: '#0176d3' }}>${totalLoanAmount.toFixed(2)}</span>
            </div>
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>Cancel</button>
            <button 
              type="button" 
              onClick={handleSubmit} 
              style={loading ? styles.btnPrimaryDisabled : styles.btnPrimary}
              disabled={loading}
            >
              {loading ? 'Creating...' : `Create ${formData.loanType === 'refinance' ? 'Refinance' : 'Loan'}`}
            </button>
          </div>
        </div>
      </div>

      {showNewClientForm && (
        <NewClientModal
          onClose={() => setShowNewClientForm(false)}
          onClientCreated={(newClient) => {
            setShowNewClientForm(false);
            fetchClients();
            setFormData({ ...formData, client_id: newClient.id });
            setSearchTerm(`${newClient.first_name} ${newClient.last_name} (${newClient.client_code})`);
          }}
        />
      )}
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' },
  modal: { background: '#fff', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  header: { padding: '1.5rem 2rem', borderBottom: '1px solid #e1e4e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' },
  title: { margin: 0, fontSize: '1.2rem', fontWeight: 600, whiteSpace: 'nowrap' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#666', lineHeight: 1, padding: '0 0.5rem' },
  form: { padding: '2rem', overflowY: 'auto', flex: 1 },
  section: { marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e1e4e8' },
  sectionTitle: { margin: '0 0 1rem 0', color: '#0176d3', fontSize: '1.05rem', fontWeight: 600 },
  formGroup: { marginBottom: '1rem' },
  label: { display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#333', fontSize: '0.95rem' },
  input: { width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' },
  radio: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderTop: 'none', borderRadius: '0 0 6px 6px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 1001 },
  dropdownItem: { padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f3f2f2', transition: 'background 0.2s' },
  infoBox: { background: '#f0f8ff', border: '1px solid #b3d9ff', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' },
  infoRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
  infoLabel: { color: '#666', fontWeight: 500 },
  infoValue: { color: '#333', fontWeight: 600 },
  error: { color: '#c62828', fontSize: '0.9rem', marginTop: '0.5rem', padding: '0.5rem', background: '#ffebee', borderRadius: '4px', border: '1px solid #ef9a9a' },
  hint: { color: '#0176d3', fontSize: '0.9rem', marginTop: '0.5rem', fontStyle: 'italic' },
  summary: { background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1rem' },
  actions: { display: 'flex', gap: '1rem', justifyContent: 'flex-end' },
  btnPrimary: { background: '#0176d3', color: '#fff', padding: '0.75rem 2rem', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
  btnPrimaryDisabled: { background: '#ccc', color: '#666', padding: '0.75rem 2rem', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 600, cursor: 'not-allowed' },
  btnSecondary: { background: '#fff', color: '#0176d3', padding: '0.75rem 1.5rem', border: '2px solid #0176d3', borderRadius: '6px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnCancel: { background: '#fff', color: '#666', padding: '0.75rem 2rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer' }
};