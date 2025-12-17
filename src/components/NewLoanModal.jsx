// src/components/NewLoanModal.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseService";
import NewClientModal from "./NewClientModal";
import NewProductModal from "./NewProductModal";

// FEE TIERS
const ESTABLISHMENT_FEE_TIERS = [
  { min: 5000, fee: 495 },
  { min: 500, fee: 250 },
  { min: 100, fee: 150 },
  { min: 0, fee: 45 }
];

export default function NewLoanModal({ onClose, reloadLoans, initialLoan = null, initialMode = 'new' }) {
  // STATE
  const [formData, setFormData] = useState({
    loanType: 'new',
    client_id: '',
    product_id: '',
    loan_amount: '',
    establishment_fee: '',
    start_date: new Date().toISOString().split('T')[0],
    repayment_frequency: 'Monthly',
    term_months: '12',
    existing_loan_id: '',
    // Custom Fee State
    custom_fee_amount: '',
    custom_fee_description: ''
  });

  // DATA
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [existingLoans, setExistingLoans] = useState([]);
  const [activeLoanCount, setActiveLoanCount] = useState(0);

  // UI
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // HANDLING INITIALIZATION (Edit/Consolidate Mode)
  useEffect(() => {
    if (initialLoan && initialMode === 'consolidation') {
      const clientId = initialLoan.client_id?.id || initialLoan.client_id;
      if (clientId) {
        // Calculate approx term months from instalments + frequency
        let estMonths = '12';
        if (initialLoan.term && initialLoan.instalments_due) {
          const freq = initialLoan.term; // "Weekly", "Fortnightly", "Monthly"
          const count = initialLoan.instalments_due;
          if (freq === 'Monthly') estMonths = count;
          if (freq === 'Fortnightly') estMonths = Math.ceil(count / 2.17);
          if (freq === 'Weekly') estMonths = Math.ceil(count / 4.33);
        }

        setFormData(prev => ({
          ...prev,
          client_id: clientId,
          existing_loan_id: initialLoan.id,
          product_id: initialLoan.product_id || '',
          repayment_frequency: initialLoan.term || 'Monthly',
          term_months: estMonths
        }));
      }
    }
  }, [initialLoan, initialMode]);

  // INITIAL FETCH
  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, first_name, last_name").order('first_name');
    setClients(data || []);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("loan_products").select("*").eq('status', 'active');
    setProducts(data || []);
  };

  // WATCH CLIENT -> CHECK ACTIVE LOANS
  useEffect(() => {
    if (formData.client_id) {
      checkActiveLoans(formData.client_id);
    } else {
      setExistingLoans([]);
      setActiveLoanCount(0);
    }
  }, [formData.client_id]);

  const checkActiveLoans = async (clientId) => {
    const { data } = await supabase
      .from('loans')
      .select('id, loan_number, current_outstanding_balance, status')
      .eq('client_id', clientId)
      .eq('status', 'active');

    const loans = data || [];
    setExistingLoans(loans);
    setActiveLoanCount(loans.length);
  };

  // CHECK CONFLICTS
  const hasConflict = () => {
    if (!formData.client_id) return false;
    if (formData.loanType === 'new' && activeLoanCount > 0) return "active_exists";
    if (formData.loanType === 'consolidation' && activeLoanCount === 0) return "no_active";
    return false;
  };
  const conflict = hasConflict();

  // WATCH AMOUNT -> CALC FEE
  useEffect(() => {
    let amount = 0;
    if (formData.loanType === 'new') {
      amount = parseFloat(formData.loan_amount);
    } else if (formData.existing_loan_id) {
      const l = existingLoans.find(loan => loan.id === formData.existing_loan_id);
      if (l) amount = l.current_outstanding_balance;
    }

    if (amount) {
      const val = parseFloat(amount);
      let fee = 45;
      for (const tier of ESTABLISHMENT_FEE_TIERS) {
        if (val >= tier.min) { fee = tier.fee; break; }
      }
      setFormData(prev => ({ ...prev, establishment_fee: fee.toFixed(2) }));
    }
  }, [formData.loan_amount, formData.loanType, formData.existing_loan_id, existingLoans]);

  // PRE-FILL CONSOL AMOUNT
  useEffect(() => {
    if (formData.loanType === 'consolidation' && formData.existing_loan_id) {
      const l = existingLoans.find(loan => loan.id === formData.existing_loan_id);
      if (l) {
        setFormData(prev => ({ ...prev, loan_amount: (l.current_outstanding_balance || 0).toFixed(2) }));
      }
    }
  }, [formData.existing_loan_id, formData.loanType, existingLoans]);

  const handleSubmit = async () => {
    if (!formData.client_id || !formData.product_id) return alert("Please fill all required fields.");
    if (conflict) return alert("Please resolve the Loan Type conflict.");

    setLoading(true);
    try {
      const payload = {
        client_id: formData.client_id,
        product_id: formData.product_id,
        loan_amount: parseFloat(formData.loan_amount),
        establishment_fee: parseFloat(formData.establishment_fee) || 0,
        start_date: formData.start_date,
        repayment_frequency: formData.repayment_frequency,
        term_months: parseInt(formData.term_months),
        is_consolidation: formData.loanType === 'consolidation',
        source: formData.loanType === 'consolidation' ? 'consolidation' : 'new'
      };

      // If Consolidating, close old loan via SQL (client-side)
      if (formData.loanType === 'consolidation') {
        await supabase.from('loans').update({ status: 'closed' }).eq('id', formData.existing_loan_id);
      }

      // Create Loan (Edge Function)
      const response = await supabase.functions.invoke('create-loan', { body: payload });
      if (response.error) throw response.error;

      // Get Created Loan ID
      // Assuming create-loan returns the 'loan' object or ID. 
      // If it just returns success message, we might need to query for the latest loan or update create-loan to return ID.
      // Based on Phase 1 'create-loan', it returns { loan: newLoan, ... }.
      const newLoan = response.data?.loan;

      // Handling "Other Fees" (Custom Fee)
      if (formData.custom_fee_amount && newLoan?.id) {
        const customFeePayload = {
          loan_id: newLoan.id,
          client_id: formData.client_id,
          fee_type: 'custom',
          amount: parseFloat(formData.custom_fee_amount),
          description: formData.custom_fee_description || 'Custom Fee Application',
          status: 'pending',
          applied_date: new Date().toISOString().split('T')[0]
        };

        const { error: feeError } = await supabase.from('fee_applications').insert([customFeePayload]);
        if (feeError) console.error("Failed to add custom fee:", feeError);
      }

      alert("Loan created successfully!");
      reloadLoans?.();
      onClose();
    } catch (e) {
      alert("Error: " + (e.message || JSON.stringify(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, color: '#0176d3' }}>New Loan Application</h2>
          <button onClick={onClose} style={closeXStyle}>×</button>
        </div>

        <div style={formStyle}>
          {/* STEP 1: LOAN TYPE (Fixed Layout) */}
          <div style={sectionStyle}>
            <h4 style={sectionHeader}>Step 1: Loan Type</h4>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <label style={radioLabel}>
                <input
                  type="radio"
                  name="loanType"
                  value="new"
                  checked={formData.loanType === 'new'}
                  onChange={() => setFormData({ ...formData, loanType: 'new' })}
                />
                <span style={radioText}>New Loan</span>
              </label>
              <label style={radioLabel}>
                <input
                  type="radio"
                  name="loanType"
                  value="consolidation"
                  checked={formData.loanType === 'consolidation'}
                  onChange={() => setFormData({ ...formData, loanType: 'consolidation' })}
                />
                <span style={radioText}>Consolidation</span>
              </label>
            </div>
          </div>

          {/* STEP 2: LOAN DETAILS */}
          <div style={sectionStyle}>
            <h4 style={sectionHeader}>Step 2: Loan Details</h4>

            {/* Client Select */}
            <div style={formGroup}>
              <label style={labelStyle}>Client <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  style={inputStyle}
                  value={formData.client_id}
                  onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                >
                  <option value="">Select Client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
                <button onClick={() => setShowNewClientForm(true)} style={secondaryBtn}>+ New</button>
              </div>
              {conflict === 'active_exists' && (
                <div style={errorBanner}>Error: Client has an active loan. Cannot create 'New Loan'. switch to 'Consolidation' or close existing loan.</div>
              )}
              {conflict === 'no_active' && (
                <div style={errorBanner}>Error: Client has no active loans to consolidate. switch to 'New Loan'.</div>
              )}
            </div>

            {/* Product Select (Rate display & Add Product) */}
            <div style={formGroup}>
              <label style={labelStyle}>Product <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  style={inputStyle}
                  value={formData.product_id}
                  onChange={e => setFormData({ ...formData, product_id: e.target.value })}
                >
                  <option value="">Select Product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} ({p.annual_interest_rate}%)
                    </option>
                  ))}
                </select>
                <button onClick={() => setShowNewProductForm(true)} style={secondaryBtn}>+ New</button>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Start Date <span style={{ color: 'red' }}>*</span></label>
                <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Frequency <span style={{ color: 'red' }}>*</span></label>
                <select
                  style={inputStyle}
                  value={formData.repayment_frequency}
                  onChange={e => setFormData({ ...formData, repayment_frequency: e.target.value })}
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Fortnightly">Fortnightly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              {/* Term Label Fix */}
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Term <span style={{ color: 'red' }}>*</span></label>
                <input type="number" value={formData.term_months} onChange={e => setFormData({ ...formData, term_months: e.target.value })} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* STEP 3: FUNDS */}
          <div style={sectionStyle}>
            <h4 style={sectionHeader}>Step 3: {formData.loanType === 'new' ? 'Funds' : 'Consolidation'}</h4>

            {formData.loanType === 'consolidation' && (
              <div style={formGroup}>
                <label style={labelStyle}>Existing Loan <span style={{ color: 'red' }}>*</span></label>
                <select
                  style={inputStyle}
                  value={formData.existing_loan_id}
                  onChange={e => setFormData({ ...formData, existing_loan_id: e.target.value })}
                >
                  <option value="">Select Active Loan...</option>
                  {existingLoans.map(l => <option key={l.id} value={l.id}>{l.loan_number} (${l.current_outstanding_balance})</option>)}
                </select>
              </div>
            )}

            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Loan Amount <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.loan_amount}
                  onChange={e => setFormData({ ...formData, loan_amount: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Establishment Fee</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.establishment_fee}
                  onChange={e => setFormData({ ...formData, establishment_fee: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* STEP 4: OTHER FEES (Custom) */}
          <div style={sectionStyle}>
            <h4 style={sectionHeader}>Step 4: Other Fees (Optional)</h4>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Description</label>
                <input
                  placeholder="Reason for fee..."
                  value={formData.custom_fee_description}
                  onChange={e => setFormData({ ...formData, custom_fee_description: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ width: '120px' }}>
                <label style={labelStyle}>Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.custom_fee_amount}
                  onChange={e => setFormData({ ...formData, custom_fee_amount: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={footerStyle}>
            <button onClick={onClose} style={cancelBtn}>Cancel</button>
            <button onClick={handleSubmit} style={submitBtn} disabled={loading || !!conflict}>Create Loan</button>
          </div>
        </div>

        {showNewClientForm && (
          <NewClientModal onClose={() => setShowNewClientForm(false)} reloadClients={fetchClients} />
        )}
        {showNewProductForm && (
          <NewProductModal onClose={() => setShowNewProductForm(false)} reloadProducts={fetchProducts} />
        )}
      </div>
    </div>
  );
}

// STYLES
const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 };
const modalContent = { background: "#fff", borderRadius: "8px", width: "95%", maxWidth: "700px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };
const headerStyle = { padding: "1.5rem", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" };
const formStyle = { padding: "1.5rem", overflowY: "auto" };
const sectionStyle = { marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #f0f0f0" };
const sectionHeader = { marginTop: 0, marginBottom: "1rem", color: "#444", fontSize: "1rem", fontWeight: 600 };
const footerStyle = { display: "flex", gap: "1rem", justifyContent: "flex-end", borderTop: "1px solid #eee", paddingTop: "1rem" };
const closeXStyle = { background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#666" };
const rowStyle = { display: "flex", gap: "1rem", marginBottom: "0.75rem" };
const formGroup = { marginBottom: '1rem' };
const inputStyle = { width: "100%", padding: "0.6rem", border: "1px solid #ddd", borderRadius: "4px", fontSize: "0.9rem", fontFamily: 'inherit', boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: "0.8rem", color: "#666", marginBottom: "0.25rem" };
const submitBtn = { background: "#0176d3", color: "#fff", border: "none", padding: "0.75rem 1.5rem", borderRadius: "4px", cursor: "pointer", fontWeight: 600 };
const cancelBtn = { background: "#f3f3f3", color: "#333", border: "1px solid #ccc", padding: "0.75rem 1.5rem", borderRadius: "4px", cursor: "pointer", fontWeight: 500 };
const secondaryBtn = { background: "#fff", color: "#0176d3", border: "1px solid #0176d3", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", fontWeight: 500, whiteSpace: 'nowrap', fontSize: '0.9rem', height: '38px', boxSizing: 'border-box' };
const radioLabel = { display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', whiteSpace: 'nowrap' };
const radioText = { fontSize: '1rem', fontWeight: 500 };
const errorBanner = { background: '#fdeded', color: '#5f2120', padding: '0.75rem', borderRadius: '4px', marginTop: '0.5rem', fontSize: '0.9rem', border: '1px solid #f5c6cb' };