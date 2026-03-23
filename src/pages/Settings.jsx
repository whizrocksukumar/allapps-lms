import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import PageHeader from '../components/PageHeader';

// ─── Hardcoded defaults (mirrors NewLoanModal) ───────────────────────────────
const DEFAULT_FEE_RULES = {
  establishment_tiers: [
    { min_amount: 10000, fee: 495 },
    { min_amount: 5000,  fee: 395 },
    { min_amount: 1000,  fee: 225 },
    { min_amount: 0,     fee: 45  },
  ],
  management_fee_weekly: 25,
  admin_fee_weekly: 2,
  dishonor_fee: 35,
  late_payment_fee: 25,
};

// ─── Add Product Modal ────────────────────────────────────────────────────────
function AddProductModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', interest_rate: '', min_amount: '', max_amount: '', term_months: '', status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.interest_rate) { setError('Name and Interest Rate are required.'); return; }
    setLoading(true);
    const { error: err } = await supabase.from('loan_products').insert({
      name: form.name,
      interest_rate: parseFloat(form.interest_rate),
      min_amount: form.min_amount ? parseFloat(form.min_amount) : null,
      max_amount: form.max_amount ? parseFloat(form.max_amount) : null,
      term_months: form.term_months ? parseInt(form.term_months) : null,
      status: form.status,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => setForm(p => ({ ...p, [field]: e.target.value })),
  });

  return (
    <div style={modal.overlay}>
      <div style={modal.box}>
        <h3 style={modal.title}>Add Loan Product</h3>
        <form onSubmit={handleSubmit}>
          <div style={modal.group}>
            <label style={modal.label}>Product Name *</label>
            <input style={modal.input} placeholder="e.g. Standard Personal Loan" {...f('name')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={modal.group}>
              <label style={modal.label}>Interest Rate (%) *</label>
              <input style={modal.input} type="number" step="0.01" placeholder="5.50" {...f('interest_rate')} />
            </div>
            <div style={modal.group}>
              <label style={modal.label}>Term (months)</label>
              <input style={modal.input} type="number" placeholder="12" {...f('term_months')} />
            </div>
            <div style={modal.group}>
              <label style={modal.label}>Min Amount ($)</label>
              <input style={modal.input} type="number" placeholder="1000" {...f('min_amount')} />
            </div>
            <div style={modal.group}>
              <label style={modal.label}>Max Amount ($)</label>
              <input style={modal.input} type="number" placeholder="20000" {...f('max_amount')} />
            </div>
          </div>
          <div style={modal.group}>
            <label style={modal.label}>Status</label>
            <select style={modal.input} {...f('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {error && <div style={modal.error}>{error}</div>}
          <div style={modal.actions}>
            <button type="button" onClick={onClose} style={modal.cancelBtn}>Cancel</button>
            <button type="submit" style={modal.submitBtn} disabled={loading}>
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
  const [activeTab, setActiveTab] = useState('products');

  // Loan Products state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fee Rules state
  const [feeRules, setFeeRules] = useState(DEFAULT_FEE_RULES);
  const [feeRuleId, setFeeRuleId] = useState(null); // null = no DB row yet
  const [feeLoading, setFeeLoading] = useState(true);
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeSaved, setFeeSaved] = useState(false);

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (activeTab === 'fees') fetchFeeRules(); }, [activeTab]);

  // ── Loan Products ──────────────────────────────────────────────────────────
  const fetchProducts = async () => {
    setProductsLoading(true);
    const { data } = await supabase.from('loan_products').select('*').order('name');
    setProducts(data || []);
    setProductsLoading(false);
  };

  const toggleStatus = async (product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    await supabase.from('loan_products').update({ status: newStatus }).eq('id', product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
  };

  // ── Fee Rules ──────────────────────────────────────────────────────────────
  const fetchFeeRules = async () => {
    setFeeLoading(true);
    try {
      const { data, error } = await supabase.from('fee_rules').select('*').limit(1).single();
      if (!error && data) {
        setFeeRuleId(data.id);
        setFeeRules({
          establishment_tiers: data.establishment_tiers || DEFAULT_FEE_RULES.establishment_tiers,
          management_fee_weekly: data.management_fee_weekly ?? DEFAULT_FEE_RULES.management_fee_weekly,
          admin_fee_weekly: data.admin_fee_weekly ?? DEFAULT_FEE_RULES.admin_fee_weekly,
          dishonor_fee: data.dishonor_fee ?? DEFAULT_FEE_RULES.dishonor_fee,
          late_payment_fee: data.late_payment_fee ?? DEFAULT_FEE_RULES.late_payment_fee,
        });
      }
    } catch {
      // table may not exist — fall back to defaults silently
    }
    setFeeLoading(false);
  };

  const saveFeeRules = async () => {
    setFeeSaving(true);
    const payload = {
      establishment_tiers: feeRules.establishment_tiers,
      management_fee_weekly: parseFloat(feeRules.management_fee_weekly),
      admin_fee_weekly: parseFloat(feeRules.admin_fee_weekly),
      dishonor_fee: parseFloat(feeRules.dishonor_fee),
      late_payment_fee: parseFloat(feeRules.late_payment_fee),
    };
    if (feeRuleId) {
      await supabase.from('fee_rules').update(payload).eq('id', feeRuleId);
    } else {
      const { data } = await supabase.from('fee_rules').insert(payload).select().single();
      if (data) setFeeRuleId(data.id);
    }
    setFeeSaving(false);
    setFeeSaved(true);
    setTimeout(() => setFeeSaved(false), 2500);
  };

  const updateTier = (idx, field, val) => {
    setFeeRules(prev => {
      const tiers = prev.establishment_tiers.map((t, i) =>
        i === idx ? { ...t, [field]: parseFloat(val) || 0 } : t
      );
      return { ...prev, establishment_tiers: tiers };
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '1.5rem', background: '#f8f9fa', minHeight: '100vh' }}>
      <PageHeader
        title="Settings"
        subtitle="Manage loan products and fee rules."
        actions={
          activeTab === 'products'
            ? <button onClick={() => setShowAddModal(true)} style={btn.primary}>+ Add Product</button>
            : null
        }
      />

      {/* Tabs */}
      <div style={tabBar}>
        <button style={activeTab === 'products' ? tabActive : tab} onClick={() => setActiveTab('products')}>
          Loan Products
        </button>
        <button style={activeTab === 'fees' ? tabActive : tab} onClick={() => setActiveTab('fees')}>
          Fee Rules
        </button>
      </div>

      {/* ── TAB 1: LOAN PRODUCTS ── */}
      {activeTab === 'products' && (
        <div style={card}>
          {productsLoading ? (
            <p style={loading}>Loading products...</p>
          ) : products.length === 0 ? (
            <p style={empty}>No loan products yet. Click "+ Add Product" to create one.</p>
          ) : (
            <table style={tbl.table}>
              <thead>
                <tr style={tbl.head}>
                  <th style={tbl.th}>Name</th>
                  <th style={tbl.th}>Interest Rate</th>
                  <th style={tbl.th}>Min Amount</th>
                  <th style={tbl.th}>Max Amount</th>
                  <th style={tbl.th}>Term (mo)</th>
                  <th style={tbl.th}>Status</th>
                  <th style={tbl.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={tbl.row}>
                    <td style={tbl.td}><strong>{p.name}</strong></td>
                    <td style={tbl.td}>{p.interest_rate}%</td>
                    <td style={tbl.td}>{p.min_amount != null ? `$${p.min_amount.toLocaleString()}` : '—'}</td>
                    <td style={tbl.td}>{p.max_amount != null ? `$${p.max_amount.toLocaleString()}` : '—'}</td>
                    <td style={tbl.td}>{p.term_months ?? '—'}</td>
                    <td style={tbl.td}>
                      <span style={p.status === 'active' ? badge.active : badge.inactive}>
                        {p.status}
                      </span>
                    </td>
                    <td style={tbl.td}>
                      <button
                        onClick={() => toggleStatus(p)}
                        style={p.status === 'active' ? btn.deactivate : btn.activate}
                      >
                        {p.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB 2: FEE RULES ── */}
      {activeTab === 'fees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {feeLoading ? <p style={loading}>Loading fee rules...</p> : (
            <>
              {/* Establishment Fee Tiers */}
              <div style={card}>
                <h3 style={sectionHead}>Establishment Fee Tiers</h3>
                <p style={hint}>Applied automatically based on loan amount when creating a new loan.</p>
                <table style={tbl.table}>
                  <thead>
                    <tr style={tbl.head}>
                      <th style={tbl.th}>Min Loan Amount ($)</th>
                      <th style={tbl.th}>Establishment Fee ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeRules.establishment_tiers.map((tier, idx) => (
                      <tr key={idx} style={tbl.row}>
                        <td style={tbl.td}>
                          <input
                            type="number"
                            style={feeInput}
                            value={tier.min_amount}
                            onChange={e => updateTier(idx, 'min_amount', e.target.value)}
                          />
                        </td>
                        <td style={tbl.td}>
                          <input
                            type="number"
                            step="0.01"
                            style={feeInput}
                            value={tier.fee}
                            onChange={e => updateTier(idx, 'fee', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recurring Fees */}
              <div style={card}>
                <h3 style={sectionHead}>Recurring Weekly Fees</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  <FeeField
                    label="Management Fee (weekly)"
                    value={feeRules.management_fee_weekly}
                    onChange={v => setFeeRules(p => ({ ...p, management_fee_weekly: v }))}
                  />
                  <FeeField
                    label="Admin Fee (weekly)"
                    value={feeRules.admin_fee_weekly}
                    onChange={v => setFeeRules(p => ({ ...p, admin_fee_weekly: v }))}
                  />
                </div>
              </div>

              {/* One-off Fees */}
              <div style={card}>
                <h3 style={sectionHead}>One-off Fees</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  <FeeField
                    label="Dishonor Fee"
                    value={feeRules.dishonor_fee}
                    onChange={v => setFeeRules(p => ({ ...p, dishonor_fee: v }))}
                  />
                  <FeeField
                    label="Late Payment Fee"
                    value={feeRules.late_payment_fee}
                    onChange={v => setFeeRules(p => ({ ...p, late_payment_fee: v }))}
                  />
                </div>
              </div>

              {/* Save */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={saveFeeRules} style={btn.primary} disabled={feeSaving}>
                  {feeSaving ? 'Saving...' : 'Save Fee Rules'}
                </button>
                {feeSaved && <span style={{ color: '#2e7d32', fontSize: '0.9rem', fontWeight: 500 }}>✓ Saved successfully</span>}
              </div>
            </>
          )}
        </div>
      )}

      {showAddModal && (
        <AddProductModal onClose={() => setShowAddModal(false)} onSaved={fetchProducts} />
      )}
    </div>
  );
}

function FeeField({ label, value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.4rem' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ color: '#706e6b', fontWeight: 500 }}>$</span>
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={feeInput}
        />
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const tabBar = { display: 'flex', borderBottom: '2px solid #e1e4e8', marginBottom: '1.5rem', background: '#fff', borderRadius: '8px 8px 0 0', padding: '0 0.5rem' };
const tab = { padding: '0.875rem 1.5rem', background: 'none', border: 'none', borderBottom: '3px solid transparent', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500, color: '#706e6b' };
const tabActive = { ...tab, color: '#0176d3', borderBottom: '3px solid #0176d3' };
const card = { background: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #e1e4e8' };
const sectionHead = { margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 600, color: '#181818' };
const hint = { margin: '0 0 1rem', fontSize: '0.85rem', color: '#706e6b' };
const loading = { color: '#706e6b', padding: '1rem 0' };
const empty = { color: '#9ca3af', fontStyle: 'italic', padding: '2rem', textAlign: 'center' };
const feeInput = { padding: '0.45rem 0.65rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.9rem', width: '130px' };

const tbl = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  head: { background: '#f8f9fa', borderBottom: '2px solid #e1e4e8' },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' },
  row: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '0.75rem 1rem', color: '#181818', verticalAlign: 'middle' },
};

const badge = {
  active: { background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' },
  inactive: { background: '#f3f4f6', color: '#6b7280', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' },
};

const btn = {
  primary: { background: '#0176d3', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
  activate: { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 },
  deactivate: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 },
};

const modal = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  box: { background: '#fff', borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  title: { margin: '0 0 1.5rem', fontSize: '1.15rem', fontWeight: 600, color: '#181818' },
  group: { marginBottom: '1rem' },
  label: { display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.875rem', color: '#374151' },
  input: { width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' },
  error: { color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#fef2f2', borderRadius: '4px', border: '1px solid #fecaca' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' },
  cancelBtn: { padding: '0.6rem 1.25rem', background: '#fff', border: '1px solid #adb5bd', borderRadius: '6px', cursor: 'pointer', color: '#181818', fontWeight: 500 },
  submitBtn: { padding: '0.6rem 1.25rem', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 },
};
