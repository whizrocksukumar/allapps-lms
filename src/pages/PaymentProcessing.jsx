// src/pages/PaymentEntry.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseService.js";
import { allocatePayment } from "../services/supabaseService.js";

export default function PaymentEntry({ onClose }) {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState("");
  const [amount, setAmount] = useState("");
  const [ref, setRef] = useState("");
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Load Clients
  useEffect(() => {
    supabase
      .from("clients")
      .select("id, full_name")
      .then(({ data }) => setClients(data || []));
  }, []);

  // Load Active Loans for selected Client
  useEffect(() => {
    if (!selectedClient) {
      setLoans([]);
      setSelectedLoan("");
      return;
    }
    supabase
      .from("loans")
      .select("id, loan_number, principal, status")
      .eq("client_id", selectedClient)
      .eq("status", "active")
      .then(({ data }) => setLoans(data || []));
  }, [selectedClient]);

  // Payment Preview
  useEffect(() => {
    if (!selectedLoan || !amount) {
      setPreview(null);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("loans")
        .select("unpaid_fees, accrued_interest, principal_outstanding")
        .eq("id", selectedLoan)
        .single();
      if (!data) return;
      let rem = parseFloat(amount);
      const fees = Math.min(rem, data.unpaid_fees || 0); rem -= fees;
      const int = Math.min(rem, data.accrued_interest || 0); rem -= int;
      const prin = Math.min(rem, data.principal_outstanding || 0);
      setPreview({ fees, int, prin, rem });
    }, 300);
    return () => clearTimeout(t);
  }, [selectedLoan, amount]);

  const submit = async () => {
    setBusy(true); setMsg("");
    const res = await allocatePayment(selectedLoan, amount, ref);
    if (res.success) {
      setMsg(`Paid – Fees $${res.allocation.fees} | Interest $${res.allocation.interest} | Principal $${res.allocation.principal}`);
      setAmount(""); setRef("");
    } else {
      setMsg(`Error: ${res.message}`);
    }
    setBusy(false);
  };

  const s = {
    modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
    card: { background: "#fff", borderRadius: 12, width: "90%", maxWidth: 560, padding: "2rem", position: "relative" },
    close: { position: "absolute", top: 12, right: 12, fontSize: 28, background: "none", border: "none", cursor: "pointer", color: "#706e6b" },
    title: { fontSize: "1.8rem", margin: "0 0 1.5rem", color: "#181818" },
    input: { width: "100%", padding: "0.75rem", border: "1px solid #dddbda", borderRadius: 6, fontSize: "1rem", marginBottom: "1rem" },
    btn: { width: "100%", padding: "1rem", background: "#0176d3", color: "#fff", border: "none", borderRadius: 6, fontSize: "1rem", cursor: "pointer" }
  };

  return (
    <div style={s.modal} onClick={onClose}>
      <div style={s.card} onClick={e => e.stopPropagation()}>
        <button style={s.close} onClick={onClose}>×</button>
        <h1 style={s.title}>Payment Processing</h1>

        <label>client</label>
        <select style={s.input} value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
          <option value="">-- Select client --</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.full_name}</option>
          ))}
        </select>

        <label>Active Loans</label>
        {loans.length === 0 ? (
          <div style={{ color: "#706e6b", fontStyle: "italic" }}>No active loans for this client</div>
        ) : (
          <select style={s.input} value={selectedLoan} onChange={e => setSelectedLoan(e.target.value)}>
            <option value="">-- Select Loan --</option>
            {loans.map(l => (
              <option key={l.id} value={l.id}>#{l.loan_number} – ${l.principal}</option>
            ))}
          </select>
        )}

        <input style={s.input} type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
        <input style={s.input} placeholder="Reference" value={ref} onChange={e => setRef(e.target.value)} />

        {preview && (
          <div style={{ background: "#f0f8ff", padding: "1rem", borderRadius: 8, border: "1px solid #0176d3" }}>
            <strong>Preview:</strong><br />
            Fees <strong>${preview.fees.toFixed(2)}</strong> | 
            Interest <strong>${preview.int.toFixed(2)}</strong> | 
            Principal <strong>${preview.prin.toFixed(2)}</strong> | 
            Left <strong>${preview.rem.toFixed(2)}</strong>
          </div>
        )}

        <button style={s.btn} onClick={submit} disabled={busy || !preview}>
          {busy ? "Processing…" : "Process Payment"}
        </button>

        {msg && <div style={{ marginTop: "1rem", padding: "0.75rem", background: msg.includes("Paid") ? "#e8f5e9" : "#ffebee", borderRadius: 6 }}>{msg}</div>}
      </div>
    </div>
  );
}