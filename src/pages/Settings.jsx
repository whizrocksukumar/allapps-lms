import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import PageHeader from '../components/PageHeader';

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

// ─── Add Fee Rules Modal ──────────────────────────────────────────────────────
function AddFeeRulesModal({ onClose, onSaved }) {
  const [form, setForm] = useState(DEFAULT_FEE_RULES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateTier = (idx, field, val) => {
    setForm(prev => ({
      ...prev,
      establishment_tiers: prev.establishment_tiers.map((t, i) =>
        i === idx ? { ...t, [field]: parseFloat(val) || 0 } : t
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error: err } = await supabase.from('fee_rules').insert({
      establishment_tiers: form.establishment_tiers,
      management_fee_weekly: parseFloat(form.management_fee_weekly),
      admin_fee_weekly: parseFloat(form.admin_fee_weekly),
      dishonor_fee: parseFloat(form.dishonor_fee),
      late_payment_fee: parseFloat(form.late_payment_fee),
      effective_from: new Date().toISOString(),
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  };

  return (
    <div style={modal.overlay}>
      <div style={{ ...modal.box, maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={modal.title}>Add New Fee Rules</h3>
        <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#706e6b' }}>
          A new record will be inserted — existing records are preserved for audit.
        </p>
        <form onSubmit={handleSubmit}>
          {/* Establishment Tiers */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ ...modal.label, marginBottom: '0.75rem', display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>
              Establishment Fee Tiers
            </label>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e1e4e8' }}>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Min Loan Amount ($)</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Fee ($)</th>
                </tr>
              </thead>
              <tbody>
                {form.establishment_tiers.map((tier, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.4rem 0.75rem' }}>
                      <input type="number" style={modal.input} value={tier.min_amount}
                        onChange={e => updateTier(idx, 'min_amount', e.target.value)} />
                    </td>
                    <td style={{ padding: '0.4rem 0.75rem' }}>
                      <input type="number" step="0.01" style={modal.input} value={tier.fee}
                        onChange={e => updateTier(idx, 'fee', e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Other fees */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {[
              { key: 'management_fee_weekly', label: 'Management Fee (weekly $)' },
              { key: 'admin_fee_weekly',       label: 'Admin Fee (weekly $)' },
              { key: 'dishonor_fee',           label: 'Dishonor Fee ($)' },
              { key: 'late_payment_fee',       label: 'Late Payment Fee ($)' },
            ].map(({ key, label }) => (
              <div key={key} style={modal.group}>
                <label style={modal.label}>{label}</label>
                <input
                  type="number" step="0.01" style={modal.input}
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          {error && <div style={modal.error}>{error}</div>}
          <div style={modal.actions}>
            <button type="button" onClick={onClose} style={modal.cancelBtn}>Cancel</button>
            <button type="submit" style={modal.submitBtn} disabled={loading}>
              {loading ? 'Saving...' : 'Save New Fee Rules'}
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

  // Loan Products
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Fee Rules
  const [feeHistory, setFeeHistory] = useState([]);
  const [feeLoading, setFeeLoading] = useState(true);
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (activeTab === 'fees') fetchFeeHistory(); }, [activeTab]);

  const fetchProducts = async () => {
    setProductsLoading(true);
    setProductsError('');
    const { data, error } = await supabase.from('loan_products').select('*').order('name');
    if (error) setProductsError(error.message);
    setProducts(data || []);
    setProductsLoading(false);
  };

  const toggleStatus = async (product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    await supabase.from('loan_products').update({ status: newStatus }).eq('id', product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
  };

  const fetchFeeHistory = async () => {
    setFeeLoading(true);
    const { data } = await supabase
      .from('fee_rules')
      .select('*')
      .order('created_at', { ascending: false });
    setFeeHistory(data || []);
    setFeeLoading(false);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-NZ', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div style={{ padding: '1.5rem', background: '#f8f9fa', minHeight: '100vh' }}>
      <PageHeader
        title="Settings"
        subtitle="Manage loan products and fee rules."
        actions={
          activeTab === 'products'
            ? <button onClick={() => setShowAddModal(true)} style={btn.primary}>+ Add Product</button>
            : <button onClick={() => setShowAddFeeModal(true)} style={btn.primary}>+ Add New Fee Rules</button>
        }
      />

      {/* Tabs */}
      <div style={tabBar}>
        <button style={activeTab === 'products' ? tabActive : tab} onClick={() => setActiveTab('products')}>
          Loan Products
        </button>
        <button style={activeTab === 'fees' ? tabActive : tab} onClick={() => setActiveTab('fees')}>
          Fee Rules History
        </button>
      </div>

      {/* ── TAB 1: LOAN PRODUCTS ── */}
      {activeTab === 'products' && (
        <div style={card}>
          {productsLoading ? (
            <p style={{ color: '#706e6b', padding: '1rem 0' }}>Loading products...</p>
          ) : (
            <>
              {productsError && (
                <div style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  Error loading loan products: {productsError}
                </div>
              )}
              <table style={tbl.table}>
                <thead>
                  <tr>
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
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                        No loan products yet. Click "+ Add Product" to create one.
                      </td>
                    </tr>
                  ) : (
                    products.map(p => (
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
                          <button onClick={() => toggleStatus(p)} style={p.status === 'active' ? btn.deactivate : btn.activate}>
                            {p.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* ── TAB 2: FEE RULES HISTORY ── */}
      {activeTab === 'fees' && (
        <div style={card}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 600, color: '#181818' }}>Fee Rules History</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#706e6b' }}>
              Each row is a snapshot in time. The most recent record is the current effective fee schedule.
            </p>
          </div>

          {feeLoading ? (
            <p style={{ color: '#706e6b' }}>Loading...</p>
          ) : (
            <table style={tbl.table}>
              <thead>
                <tr>
                  <th style={tbl.th}>Effective From</th>
                  <th style={tbl.th}>Mgmt Fee (wk)</th>
                  <th style={tbl.th}>Admin Fee (wk)</th>
                  <th style={tbl.th}>Dishonor Fee</th>
                  <th style={tbl.th}>Late Fee</th>
                  <th style={tbl.th}>Est. Tiers</th>
                </tr>
              </thead>
              <tbody>
                {feeHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                      No fee rules saved yet. Click "+ Add New Fee Rules" to create the first record.
                    </td>
                  </tr>
                ) : (
                  feeHistory.map((row, idx) => (
                    <tr key={row.id} style={tbl.row}>
                      <td style={tbl.td}>
                        {formatDate(row.effective_from || row.created_at)}
                        {idx === 0 && (
                          <span style={{ marginLeft: '0.5rem', background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '10px', textTransform: 'uppercase' }}>
                            Current
                          </span>
                        )}
                      </td>
                      <td style={tbl.td}>${row.management_fee_weekly ?? '—'}</td>
                      <td style={tbl.td}>${row.admin_fee_weekly ?? '—'}</td>
                      <td style={tbl.td}>${row.dishonor_fee ?? '—'}</td>
                      <td style={tbl.td}>${row.late_payment_fee ?? '—'}</td>
                      <td style={tbl.td}>
                        {(row.establishment_tiers || []).map((t, i) => (
                          <span key={i} style={{ display: 'inline-block', marginRight: '0.4rem', fontSize: '0.75rem', color: '#374151' }}>
                            ≥${t.min_amount}: ${t.fee}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showAddModal && (
        <AddProductModal onClose={() => setShowAddModal(false)} onSaved={fetchProducts} />
      )}
      {showAddFeeModal && (
        <AddFeeRulesModal onClose={() => setShowAddFeeModal(false)} onSaved={fetchFeeHistory} />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const tabBar = { display: 'flex', borderBottom: '2px solid #e1e4e8', marginBottom: '1.5rem', background: '#fff', borderRadius: '8px 8px 0 0', padding: '0 0.5rem' };
const tab = { padding: '0.875rem 1.5rem', background: 'none', border: 'none', borderBottom: '3px solid transparent', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500, color: '#706e6b' };
const tabActive = { ...tab, color: '#0176d3', borderBottom: '3px solid #0176d3' };
const card = { background: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #e1e4e8' };

const tbl = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#fff', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#0176d3' },
  row: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '0.75rem 1rem', color: '#181818', verticalAlign: 'middle' },
};

const badge = {
  active:   { background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' },
  inactive: { background: '#f3f4f6', color: '#6b7280', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' },
};

const btn = {
  primary:    { background: '#0176d3', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
  activate:   { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 },
  deactivate: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 },
};

const modal = {
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  box:       { background: '#fff', borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  title:     { margin: '0 0 1.5rem', fontSize: '1.15rem', fontWeight: 600, color: '#181818' },
  group:     { marginBottom: '1rem' },
  label:     { display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.875rem', color: '#374151' },
  input:     { width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' },
  error:     { color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#fef2f2', borderRadius: '4px', border: '1px solid #fecaca' },
  actions:   { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' },
  cancelBtn: { padding: '0.6rem 1.25rem', background: '#fff', border: '1px solid #adb5bd', borderRadius: '6px', cursor: 'pointer', color: '#181818', fontWeight: 500 },
  submitBtn: { padding: '0.6rem 1.25rem', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 },
};
