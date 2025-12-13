// src/components/NewLoanModal.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseService";

export default function NewLoanModal({ onClose }) {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", rate: "" });
  const [calculatedTerm, setCalculatedTerm] = useState("");

  const [isNewClient, setIsNewClient] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    region: "",
    city: "",
    postal_code: "",
    product_id: "",
    loan_amount: "",
    repayment_frequency: "weekly",
    repayment_amount: "",
  });

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, first_name, last_name");
    setClients(data || []);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("loan_products")
      .select("id, product_name, annual_interest_rate")
      .order("product_name");
    setProducts(data || []);
  };

  const createProduct = async () => {
    const { error } = await supabase.from("loan_products").insert({
      product_name: newProduct.name,
      annual_interest_rate: parseFloat(newProduct.rate),
      status: "active",
    });
    if (!error) {
      setShowProductForm(false);
      setNewProduct({ name: "", rate: "" });
      fetchProducts();
    } else {
      alert("Failed to add product");
    }
  };

  // AUTO-CALCULATE TERM
  useEffect(() => {
    const amount = parseFloat(form.loan_amount) || 0;
    const repayment = parseFloat(form.repayment_amount) || 0;
    const product = products.find(p => p.id === form.product_id);
    const rate = product ? product.annual_interest_rate / 100 : 0;

    if (amount > 0 && repayment > 0) {
      const periods_per_year = form.repayment_frequency === "weekly" ? 52 : form.repayment_frequency === "fortnightly" ? 26 : 12;
      const period_rate = rate / periods_per_year;
      const total_repayable = amount * (1 + period_rate * 12);
      const term_periods = Math.ceil(total_repayable / repayment);
      const term_months = Math.ceil(term_periods / (periods_per_year / 12));
      setCalculatedTerm(`${term_months} months`);
    } else {
      setCalculatedTerm("");
    }
  }, [form.loan_amount, form.repayment_amount, form.repayment_frequency, form.product_id, products]);

  const handleSubmit = async () => {
    let client_id = form.client_id;
    if (isNewClient) {
      const { data: newClient } = await supabase
        .from("clients")
        .insert({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          region: form.region,
          city: form.city,
          postal_code: form.postal_code,
        })
        .select()
        .single();
      client_id = newClient.id;
    }

    const resp = await fetch("/api/create-loan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id,
        product_id: form.product_id,
        loan_amount: parseFloat(form.loan_amount),
        repayment_frequency: form.repayment_frequency,
        repayment_amount: parseFloat(form.repayment_amount),
      }),
    });

    if (resp.ok) onClose();
    else alert("Failed to create loan");
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>New Loan</h2>

        {/* CLIENT */}
        <div style={{ marginBottom: "1rem" }}>
          <label>
            <input type="radio" checked={!isNewClient} onChange={() => setIsNewClient(false)} /> Existing Client
          </label>
          <label style={{ marginLeft: "1rem" }}>
            <input type="radio" checked={isNewClient} onChange={() => setIsNewClient(true)} /> New Client
          </label>
        </div>

        {isNewClient ? (
          <>
            <input placeholder="First Name" onChange={(e) => setForm({ ...form, first_name: e.target.value })} style={inputStyle} />
            <input placeholder="Last Name" onChange={(e) => setForm({ ...form, last_name: e.target.value })} style={inputStyle} />
            <input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            <input placeholder="Phone" onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
            <input placeholder="Address" onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle} />
            <input placeholder="Region" onChange={(e) => setForm({ ...form, region: e.target.value })} style={inputStyle} />
            <input placeholder="City" onChange={(e) => setForm({ ...form, city: e.target.value })} style={inputStyle} />
            <input placeholder="Postal Code" onChange={(e) => setForm({ ...form, postal_code: e.target.value })} style={inputStyle} />
          </>
        ) : (
          <select onChange={(e) => setForm({ ...form, client_id: e.target.value })} style={inputStyle}>
            <option value="">Select Client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
        )}

        {/* PRODUCT - RATE ONLY */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <select
            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="">Select Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.product_name} – {p.annual_interest_rate}%
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowProductForm(true)}
            style={{
              background: "#0176d3",
              color: "#fff",
              border: "none",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.25rem",
              fontSize: "0.875rem",
            }}
          >
            + Add Product
          </button>
        </div>

        {/* LOAN DETAILS */}
        <input
          type="number"
          placeholder="Loan Amount"
          onChange={(e) => setForm({ ...form, loan_amount: e.target.value })}
          style={inputStyle}
        />
        <select
          onChange={(e) => setForm({ ...form, repayment_frequency: e.target.value })}
          style={inputStyle}
        >
          <option value="weekly">Weekly</option>
          <option value="fortnightly">Fortnightly</option>
          <option value="monthly">Monthly</option>
        </select>
        <input
          type="number"
          placeholder="Repayment Amount"
          onChange={(e) => setForm({ ...form, repayment_amount: e.target.value })}
          style={inputStyle}
        />

        {/* AUTO-CALCULATED TERM */}
        <div style={{ margin: "0.5rem 0", padding: "0.5rem", background: "#f0f9ff", borderRadius: "0.25rem", fontWeight: "600" }}>
          Estimated Term: {calculatedTerm || "Enter amount & repayment"}
        </div>

        <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
          <button onClick={handleSubmit} style={primaryBtn}>Create Loan</button>
          <button onClick={onClose} style={secondaryBtn}>Cancel</button>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showProductForm && (
        <div style={modalOverlay} onClick={() => setShowProductForm(false)}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Add Loan Product</h3>
            <input
              placeholder="Name (e.g. ST – 6.00%)"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              style={inputStyle}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Annual Interest Rate %"
              value={newProduct.rate}
              onChange={(e) => setNewProduct({ ...newProduct, rate: e.target.value })}
              style={inputStyle}
            />
            <div style={{ marginTop: "1rem", textAlign: "right" }}>
              <button onClick={createProduct} style={primaryBtn}>Save</button>
              <button onClick={() => setShowProductForm(false)} style={secondaryBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------- */
const inputStyle = { width: "100%", padding: "0.5rem", margin: "0.5rem 0", border: "1px solid #ccc", borderRadius: "0.25rem" };
const primaryBtn = { background: "#0176d3", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.25rem", marginRight: "0.5rem" };
const secondaryBtn = { background: "#706e6b", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.25rem" };
const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 };
const modalContent = { background: "#fff", borderRadius: "0.5rem", width: "90%", maxWidth: "400px", padding: "1.5rem" };