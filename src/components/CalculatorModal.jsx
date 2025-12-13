// src/components/CalculatorModal.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseService";

export default function CalculatorModal({ onClose }) {
  const [form, setForm] = useState({
    loan_amount: "",
    product_id: "",
    repayment_frequency: "weekly",
    repayment_amount: "",
    start_date: new Date().toISOString().split("T")[0],
  });
  const [products, setProducts] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    supabase
      .from("loan_products")
      .select("id, product_name, annual_interest_rate")
      .then(({ data }) => setProducts(data || []));
  }, []);

  useEffect(() => {
    calculate();
  }, [form, products]);

  const calculate = () => {
    const amount = parseFloat(form.loan_amount) || 0;
    const repayment = parseFloat(form.repayment_amount) || 0;
    const product = products.find((p) => p.id === form.product_id);
    if (!product || amount === 0 || repayment === 0) {
      setResult(null);
      return;
    }

    const annualRate = product.annual_interest_rate / 100;
    const dailyRate = annualRate / 365;

    // Establishment fee (per spec)
    let estFee = 45;
    if (amount > 3000) estFee = 495;
    else if (amount > 2000) estFee = 395;
    else if (amount > 1000) estFee = 295;
    else if (amount > 400) estFee = 195;
    else if (amount > 100) estFee = 95;

    const upfront = amount + estFee;
    const days = form.repayment_frequency === "weekly" ? 7 : form.repayment_frequency === "fortnightly" ? 14 : 30;
    const interestPerPeriod = upfront * dailyRate * days;
    const weeklyFees = 27; // $25 mgmt + $2 admin
    const feesPerPeriod = weeklyFees * (days / 7);
    const totalPerPeriod = interestPerPeriod + feesPerPeriod;
    const net = repayment - totalPerPeriod;

    if (net <= 0) {
      setResult({ error: "Repayment too low" });
      return;
    }

    const periods = Math.ceil(upfront / net);
    const end = new Date(form.start_date);
    end.setDate(end.getDate() + periods * days);

    setResult({
      periods,
      periodUnit: form.repayment_frequency,
      months: (periods * days / 30).toFixed(1),
      totalRepay: (repayment * periods).toFixed(2),
      endDate: end.toISOString().split("T")[0],
    });
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Repayment Term Calculator</h2>

        <input
          type="number"
          placeholder="Loan Amount"
          value={form.loan_amount}
          onChange={(e) => setForm({ ...form, loan_amount: e.target.value })}
          style={inputStyle}
        />

        <select
          value={form.product_id}
          onChange={(e) => setForm({ ...form, product_id: e.target.value })}
          style={inputStyle}
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.product_name} – {p.annual_interest_rate}%
            </option>
          ))}
        </select>

        <select
          value={form.repayment_frequency}
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
          value={form.repayment_amount}
          onChange={(e) => setForm({ ...form, repayment_amount: e.target.value })}
          style={inputStyle}
        />

        <input
          type="date"
          value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          style={inputStyle}
        />

        {result && !result.error && (
          <div style={resultBox}>
            <p><strong>Total Repayable:</strong> ${result.totalRepay}</p>
            <p><strong>Term:</strong> {result.periods} {result.periodUnit} ({result.months} months)</p>
            <p><strong>End Date:</strong> {result.endDate}</p>
          </div>
        )}
        {result?.error && <p style={{ color: "red" }}>{result.error}</p>}

        <button onClick={onClose} style={closeBtn}>Close</button>
      </div>
    </div>
  );
}

/* STYLES */
const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 };
const modalContent = { background: "#fff", borderRadius: "0.5rem", width: "90%", maxWidth: "420px", padding: "1.5rem" };
const inputStyle = { width: "100%", padding: "0.5rem", margin: "0.5rem 0", border: "1px solid #706e6b", borderRadius: "0.25rem" };
const resultBox = { margin: "1rem 0", padding: "1rem", background: "#f0f9ff", borderRadius: "0.25rem" };
const closeBtn = { background: "#706e6b", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.25rem", cursor: "pointer", marginTop: "1rem" };