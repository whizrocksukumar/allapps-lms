// src/components/NewLoanModal.jsx - PRODUCTION VERSION
// Updated: 21-DEC-2025 - Removed loan_products, added direct interest rate selection
import React, { useState, useEffect } from "react";
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
    annual_interest_rate: 5.50, // Default rate
    establishment_fee: '',
    other_fees: '',
    start_date: new Date().toISOString().split('T')[0],
    repayment_frequency: 'Weekly',
    repayment_amount: '',
    term_months: '',
    existing_loan_id: '',
  });

  const [clients, setClients] = useState([]);
  const [existingLoans, setExistingLoans] = useState([]);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rateMode, setRateMode] = useState('standard'); // 'standard' or 'custom'
  const [recommendedTerm, setRecommendedTerm] = useState(null);

  // INITIALIZATION
  useEffect(() => {
    if (initialLoan && initialMode === 'consolidation') {
      const clientId = initialLoan.client_id?.id || initialLoan.client_id;
      if (clientId) {
        setFormData(prev => ({
          ...prev,
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
    const { data, error } = await supabase.from("clients").select("id, first_name, last_name").order('first_name');
    if (error) console.error("Error fetching clients:", error);
    setClients(data || []);
  };

  useEffect(() => {
    if (formData.client_id) {
      checkActiveLoans(formData.client_id);
    } else {
      setExistingLoans([]);
    }
  }, [formData.client_id]);

  const checkActiveLoans = async (clientId) => {
    const { data } = await supabase
      .from('loans')
      .select('id, loan_number, loan_balances(current_outstanding_balance), status')
      .eq('client_id', clientId)
      .eq('status', 'active');
    
    // Transform data to include balance
    const loansWithBalance = (data || []).map(loan => ({
      ...loan,
      current_outstanding_balance: loan.loan_balances?.[0]?.current_outstanding_balance || 0
    }));
    
    setExistingLoans(loansWithBalance);
  };

  // AUTO-CALCULATE ESTABLISHMENT FEE
  useEffect(() => {
    let amount = 0;
    if (formData.loanType === 'new') {
      amount = parseFloat(formData.loan_amount) || 0;
    } else if (formData.existing_loan_id) {
      const loan = existingLoans.find(l => l.id === formData.existing_loan_id);
      if (loan) amount = loan.current_outstanding_balance || 0;
    }

    if (amount > 0) {
      let fee = 45;
      for (const tier of ESTABLISHMENT_FEE_TIERS) {
        if (amount >= tier.min) { fee = tier.fee; break; }
      }
      setFormData(prev => ({ ...prev, establishment_fee: fee.toFixed(2) }));
    }
  }, [formData.loan_amount, formData.loanType, formData.existing_loan_id, existingLoans]);

  // PRE-FILL CONSOLIDATION AMOUNT
  useEffect(() => {
    if (formData.loanType === 'consolidation' && formData.existing_loan_id) {
      const loan = existingLoans.find(l => l.id === formData.existing_loan_id);
      if (loan) {
        setFormData(prev => ({ ...prev, loan_amount: (loan.current_outstanding_balance || 0).toFixed(2) }));
      }
    }
  }, [formData.existing_loan_id, formData.loanType, existingLoans]);

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

    // Calculate frequency multiplier
    let paymentPerMonth = 0;
    let weeklyFeePerMonth = 0;

    if (formData.repayment_frequency === 'Weekly') {
      paymentPerMonth = repaymentAmount * 4.33;
      weeklyFeePerMonth = WEEKLY_FEES * 4.33;
    } else if (formData.repayment_frequency === 'Fortnightly') {
      paymentPerMonth = repaymentAmount * 2.17;
      weeklyFeePerMonth = WEEKLY_FEES * 2.17;
    } else { // Monthly
      paymentPerMonth = repaymentAmount;
      weeklyFeePerMonth = WEEKLY_FEES * 4.33;
    }

    // Estimate term using amortization formula
    const netPayment = paymentPerMonth - weeklyFeePerMonth;
    if (netPayment <= totalLoan * monthlyRate) {
      setRecommendedTerm(null); // Payment insufficient
      return;
    }

    const months = Math.log(netPayment / (netPayment - totalLoan * monthlyRate)) / Math.log(1 + monthlyRate);
    setRecommendedTerm(Math.ceil(months));
  }, [formData.annual_interest_rate, formData.loan_amount, formData.establishment_fee, formData.other_fees, formData.repayment_amount, formData.repayment_frequency]);

  const handleSubmit = async () => {
    // VALIDATION
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
          is_consolidation: formData.loanType === 'consolidation',
          existing_loan_id: formData.existing_loan_id || null,
          source: formData.loanType === 'consolidation' ? 'consolidation' : 'new_application'
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

    // Check business rule: one active loan per client
    if (formData.loanType === 'new' && existingLoans.length > 0) {
      return 'active_exists'; // Client has active loan
    }
    if (formData.loanType === 'consolidation' && existingLoans.length === 0) {
      return 'no_active'; // No active loans to consolidate
    }

    return null;
  };

  const conflict = validateForm();
  const totalLoanAmount = (parseFloat(formData.loan_amount) || 0) + (parseFloat(formData.establishment_fee) || 0) + (parseFloat(formData.other_fees) || 0);

  const handleRateChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setRateMode('custom');
      setFormData({ ...formData, annual_interest_rate: '' });
    } else {
      setRateMode('standard');
      setFormData({ ...formData, annual_interest_rate: parseFloat(value) });
    }
  };

  return (
    <div style={styles.overlay} onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
            {formData.loanType === 'consolidation' ? 'Consolidate Loan' : 'Create New Loan'}
          </h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.form}>
          
          {/* STEP 1: LOAN TYPE */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Step 1: Loan Type</h4>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label style={styles.radio}>
                <input type="radio" name="loanType" value="new" checked={formData.loanType === 'new'} onChange={() => setFormData({ ...formData, loanType: 'new' })} />
                <span>New Loan</span>
              </label>
              <label style={styles.radio}>
                <input type="radio" name="loanType" value="consolidation" checked={formData.loanType === 'consolidation'} onChange={() => setFormData({ ...formData, loanType: 'consolidation' })} />
                <span>Consolidation</span>
              </label>
            </div>
          </div>

          {/* STEP 2: LOAN DETAILS */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Step 2: Loan Details</h4>

            {/* Client */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Client *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select style={styles.input} value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })}>
                  <option value="">Select Client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
                <button onClick={() => setShowNewClientForm(true)} style={styles.btnSecondary}>+ New</button>
              </div>
              {conflict === 'active_exists' && <div style={styles.error}>Client has active loan. Switch to Consolidation or close existing loan.</div>}
              {conflict === 'no_active' && <div style={styles.error}>No active loans to consolidate. Switch to New Loan.</div>}
            </div>

            {/* Interest Rate Selection */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Interest Rate *</label>
              
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
                <label style={styles.radio}>
                  <input
                    type="radio"
                    checked={rateMode === 'standard'}
                    onChange={() => {
                      setRateMode('standard');
                      setFormData({ ...formData, annual_interest_rate: 5.50 });
                    }}
                  />
                  <span>Standard Rate</span>
                </label>
                <label style={styles.radio}>
                  <input
                    type="radio"
                    checked={rateMode === 'custom'}
                    onChange={() => {
                      setRateMode('custom');
                      setFormData({ ...formData, annual_interest_rate: '' });
                    }}
                  />
                  <span>Custom Rate</span>
                </label>
              </div>

              {rateMode === 'standard' ? (
                <select
                  style={styles.input}
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
              ) : (
                <input
                  type="number"
                  step="0.01"
                  style={styles.input}
                  value={formData.annual_interest_rate}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    annual_interest_rate: e.target.value 
                  })}
                  placeholder="Enter custom rate (e.g., 8.75)"
                  min="0"
                  max="100"
                />
              )}
            </div>

            {/* Consolidation select */}
            {formData.loanType === 'consolidation' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Existing Loan *</label>
                <select style={styles.input} value={formData.existing_loan_id} onChange={e => setFormData({ ...formData, existing_loan_id: e.target.value })}>
                  <option value="">Select Active Loan...</option>
                  {existingLoans.map(l => <option key={l.id} value={l.id}>{l.loan_number} (${l.current_outstanding_balance?.toFixed(2) || '0.00'})</option>)}
                </select>
              </div>
            )}

            {/* Funds section */}
            <div style={styles.subsection}>
              <h5 style={styles.subsectionTitle}>Funds</h5>
              <div style={styles.row}>
                <div style={styles.col}>
                  <label style={styles.label}>Loan Amount *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.loan_amount} 
                    onChange={e => setFormData({ ...formData, loan_amount: e.target.value })} 
                    style={styles.input}
                    placeholder="0.00"
                  />
                </div>
                <div style={styles.col}>
                  <label style={styles.label}>Establishment Fee (auto-calculated)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.establishment_fee} 
                    onChange={e => setFormData({ ...formData, establishment_fee: e.target.value })} 
                    style={{ ...styles.input, backgroundColor: '#f5f5f5' }}
                    readOnly
                  />
                </div>
              </div>

              {/* Other Fees */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Other Fees</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={formData.other_fees} 
                  onChange={e => setFormData({ ...formData, other_fees: e.target.value })} 
                  style={styles.input} 
                />
              </div>

              {/* Total Loan Amount */}
              <div style={styles.totalBox}>
                <span style={styles.totalLabel}>Total Loan Amount:</span>
                <span style={styles.totalValue}>${totalLoanAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* STEP 3: PAYMENT */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Step 3: Payment</h4>

            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Frequency *</label>
                <select style={styles.input} value={formData.repayment_frequency} onChange={e => setFormData({ ...formData, repayment_frequency: e.target.value })}>
                  <option value="Weekly">Weekly</option>
                  <option value="Fortnightly">Fortnightly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div style={styles.col}>
                <label style={styles.label}>Repayment Amount *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="e.g., 500" 
                  value={formData.repayment_amount} 
                  onChange={e => setFormData({ ...formData, repayment_amount: e.target.value })} 
                  style={styles.input} 
                />
              </div>
            </div>

            {/* Recommended Term */}
            {recommendedTerm && (
              <div style={styles.recommendedBox}>
                <span>💡 Recommended Term: <strong>{recommendedTerm} months</strong></span>
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Term (Months) *</label>
              <input 
                type="number" 
                value={formData.term_months} 
                onChange={e => setFormData({ ...formData, term_months: e.target.value })} 
                style={styles.input}
                placeholder="e.g., 12"
              />
              {recommendedTerm && <span style={styles.hint}>Recommended: {recommendedTerm} months</span>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Start Date *</label>
              <input 
                type="date" 
                value={formData.start_date} 
                onChange={e => setFormData({ ...formData, start_date: e.target.value })} 
                style={styles.input} 
              />
            </div>
          </div>

          {/* FOOTER */}
          <div style={styles.footer}>
            <button onClick={onClose} style={styles.btnCancel}>Cancel</button>
            <button onClick={handleSubmit} style={styles.btnSubmit} disabled={loading || !!conflict}>
              {loading ? 'Creating...' : 'Create Loan'}
            </button>
          </div>
        </div>

        {showNewClientForm && <NewClientModal onClose={() => setShowNewClientForm(false)} reloadClients={fetchClients} />}
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 },
  modal: { background: "#fff", borderRadius: "8px", width: "95%", maxWidth: "600px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" },
  header: { padding: "1.5rem", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" },
  closeBtn: { background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#666" },
  form: { padding: "1.5rem", overflowY: "auto" },
  section: { marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #f0f0f0" },
  sectionTitle: { margin: "0 0 1rem 0", color: "#444", fontSize: "1rem", fontWeight: 600 },
  subsection: { marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f5f5f5" },
  subsectionTitle: { margin: "0 0 0.75rem 0", color: "#666", fontSize: "0.9rem", fontWeight: 600 },
  formGroup: { marginBottom: "1rem" },
  label: { display: "block", fontSize: "0.8rem", color: "#666", marginBottom: "0.25rem", fontWeight: 500 },
  input: { width: "100%", padding: "0.6rem", border: "1px solid #ddd", borderRadius: "4px", fontSize: "0.9rem", fontFamily: "inherit", boxSizing: "border-box" },
  row: { display: "flex", gap: "1rem", marginBottom: "1rem" },
  col: { flex: 1 },
  radio: { display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", whiteSpace: "nowrap" },
  btnSecondary: { background: "#fff", color: "#0176d3", border: "1px solid #0176d3", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap", fontSize: "0.85rem", height: "38px", boxSizing: "border-box" },
  error: { background: "#fdeded", color: "#5f2120", padding: "0.75rem", borderRadius: "4px", marginTop: "0.5rem", fontSize: "0.85rem", border: "1px solid #f5c6cb" },
  totalBox: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0f8ff", padding: "1rem", borderRadius: "6px", border: "1px solid #b3d9ff", marginTop: "1rem" },
  totalLabel: { fontWeight: 600, color: "#333" },
  totalValue: { fontSize: "1.25rem", fontWeight: "bold", color: "#0176d3" },
  recommendedBox: { background: "#e8f5e9", padding: "0.75rem", borderRadius: "6px", border: "1px solid #c8e6c9", color: "#2e7d32", marginBottom: "1rem" },
  hint: { display: "block", fontSize: "0.75rem", color: "#666", marginTop: "0.25rem" },
  footer: { display: "flex", gap: "1rem", justifyContent: "flex-end", padding: "1.5rem", borderTop: "1px solid #eee" },
  btnCancel: { background: "#f3f3f3", color: "#333", border: "1px solid #ccc", padding: "0.6rem 1.2rem", borderRadius: "4px", cursor: "pointer", fontWeight: 500 },
  btnSubmit: { background: "#0176d3", color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: "4px", cursor: "pointer", fontWeight: 600 }
};