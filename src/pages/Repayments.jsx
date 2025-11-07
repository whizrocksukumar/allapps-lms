// src/pages/Repayments.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseService.js";

export default function Repayments({ loanId }) {
  const [repayments, setRepayments] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!loanId) return;
    supabase
      .from("repayment_schedule")
      .select("*")
      .eq("loan_id", loanId)
      .order("due_date")
      .then(({ data }) => setRepayments(data || []));
  }, [loanId]);

  const markPaid = async (id) => {
    const { error } = await supabase
      .from("repayment_schedule")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", id);
    setMsg(error ? `Error: ${error.message}` : "Marked paid!");
    setTimeout(() => setMsg(""), 2000);
  };

  const s = {
    card: { background: "#fff", padding: "20px 25px", borderRadius: "10px", boxShadow: "0 3px 6px rgba(0,0,0,0.08)", marginTop: "20px" },
    title: { marginBottom: "10px", fontSize: "18px", fontWeight: 600 },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { borderBottom: "2px solid #0176d3", padding: "0.75rem", textAlign: "left" },
    td: { borderBottom: "1px solid #dddbda", padding: "0.75rem" },
    btn: { padding: "0.5rem 1rem", background: "#0176d3", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }
  };

  return (
    <div style={s.card}>
      <h3 style={s.title}>Repayment Schedule</h3>
      {msg && <div style={{ padding: "0.75rem", background: "#e8f5e9", borderRadius: 6, marginBottom: "1rem" }}>{msg}</div>}
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Due Date</th>
            <th style={s.th}>Amount</th>
            <th style={s.th}>Status</th>
            <th style={s.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {repayments.map(r => (
            <tr key={r.id}>
              <td style={s.td}>{new Date(r.due_date).toLocaleDateString()}</td>
              <td style={s.td}>${r.amount.toFixed(2)}</td>
              <td style={s.td}>{r.status}</td>
              <td style={s.td}>
                {r.status === "pending" && (
                  <button style={s.btn} onClick={() => markPaid(r.id)}>Mark Paid</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}