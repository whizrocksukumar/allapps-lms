// src/pages/PaymentEntry.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseService.js";
import { allocatePayment } from "../services/supabaseService.js";

export default function PaymentEntry() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState("");
  const [loanId, setLoanId] = useState("");
  const [amount, setAmount] = useState("");
  const [ref, setRef] = useState("");
  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    supabase.from("clients").select("id, full_name").then(({ data }) => setClients(data || []));
  }, []);

  React.useEffect(() => {
    if (!clientId) {
      setLoans([]);
      return;
    }
    supabase
      .from("loans")
      .select("id, loan_number, principal_outstanding")
      .eq("client_id", clientId)
      .in("status", ["active", "overdue"])
      .then(({ data }) => setLoans(data || []));
  }, [clientId]);

  const submit = async () => {
    setBusy(true);
    const res = await allocatePayment(loanId, amount, ref);
    setMsg(res.success ? "Payment processed!" : res.message);
    setBusy(false);
    if (res.success) {
      setAmount(""); setRef("");
    }
  };

  const close = () => navigate("/");

  const s = {
    modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
    card: { background: "#fff", borderRadius: 12, width: "90%", maxWidth: 520, padding: "2rem", position: "relative" },
    close: { position: "absolute", top: 12, right: 12, fontSize: 28, background: "none", border: "none", cursor: "pointer", color: "#706e6b" },
    title: { fontSize: "1.8rem", margin: "0 0 1.5rem", color: "#181818" },
    label: { display: "block", margin: "1rem 0 0.5rem", fontWeight: 600 },
    input: { width: "100%", padding: "0.75rem", border: "1px solid #dddbda", borderRadius: 6, fontSize: "1rem" },
    btn: { marginTop: "1.5rem", width: "100%", padding: "1rem", background: "#0176d3", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }
  };

  return (
    <div style={s.modal} onClick={close}>
      <div style={s.card} onClick={e => e.stopPropagation()}>
        <button style={s.close} onClick={close}>×</button>
        <h1 style={s.title}>Payment Entry</h1>

        <label style={s.label}>Client</label>
        <select style={s.input} value={clientId} onChange={e => { setClientId(e.target.value); setLoanId(""); }}>
          <option value="">-- Select Client --</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </select>

        <label style={s.label}>Loan</label>
        {loans.length === 0 ? (
          <div style={{ color: "#706e6b", fontStyle: "italic" }}>No active loans</div>
        ) : (
          <select style={s.input} value={loanId} onChange={e => setLoanId(e.target.value)}>
            <option value="">-- Select Loan --</option>
            {loans.map(l => <option key={l.id} value={l.id}>#{l.loan_number} – ${l.principal_outstanding}</option>)}
          </select>
        )}

        <input style={s.input} type="number" placeholder="Amount ($)" value={amount} onChange={e => setAmount(e.target.value)} />
        <input style={s.input} placeholder="Reference (optional)" value={ref} onChange={e => setRef(e.target.value)} />

        <button style={s.btn} onClick={submit} disabled={busy || !loanId || !amount}>
          {busy ? "Processing…" : "Process Payment"}
        </button>

        {msg && <div style={{ marginTop: "1rem", padding: "0.75rem", background: msg.includes("processed") ? "#e8f5e9" : "#ffebee", borderRadius: 6 }}>{msg}</div>}
      </div>
    </div>
  );
}