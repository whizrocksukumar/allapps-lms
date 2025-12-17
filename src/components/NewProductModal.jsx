// src/components/NewProductModal.jsx
import React, { useState } from "react";
import { supabase } from "../services/supabaseService";

export default function NewProductModal({ onClose, reloadProducts }) {
    const [form, setForm] = useState({
        product_name: "",
        annual_interest_rate: "",
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.product_name || !form.annual_interest_rate) {
            return alert("Please fill all fields");
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('loan_products').insert([{
                product_name: form.product_name,
                annual_interest_rate: parseFloat(form.annual_interest_rate),
                status: 'active'
            }]);

            if (error) throw error;

            alert("Product added!");
            if (reloadProducts) reloadProducts();
            onClose();
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={headerStyle}>
                    <h3 style={{ margin: 0, color: '#0176d3' }}>New Loan Product</h3>
                    <button onClick={onClose} style={closeXStyle}>×</button>
                </div>
                <form onSubmit={handleSubmit} style={bodyStyle}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Product Name</label>
                        <input
                            style={inputStyle}
                            value={form.product_name}
                            onChange={e => setForm({ ...form, product_name: e.target.value })}
                            placeholder="e.g. Personal Loan"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Annual Interest Rate (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            style={inputStyle}
                            value={form.annual_interest_rate}
                            onChange={e => setForm({ ...form, annual_interest_rate: e.target.value })}
                            placeholder="e.g. 12.5"
                            required
                        />
                    </div>
                    <div style={footerStyle}>
                        <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
                        <button type="submit" disabled={loading} style={submitBtn}>
                            {loading ? 'Adding...' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 };
const modalContent = { background: "#fff", borderRadius: "8px", width: "90%", maxWidth: "400px", padding: '0', boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };
const headerStyle = { padding: "1rem", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" };
const bodyStyle = { padding: "1.5rem" };
const footerStyle = { display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" };
const labelStyle = { display: "block", fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" };
const inputStyle = { width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px", boxSizing: 'border-box' };
const submitBtn = { background: "#0176d3", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" };
const cancelBtn = { background: "#f3f3f3", color: "#333", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" };
const closeXStyle = { background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#666" };
