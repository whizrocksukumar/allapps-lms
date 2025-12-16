import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseService.js";
import { formatDate } from "../utils/dateFormatter";
import Client360Modal from "../components/Client360Modal.jsx";

export default function Repayments({ loanId }) {
  const [repayments, setRepayments] = useState([]);
  const [loan, setLoan] = useState(null);
  const [client, setClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // if (!loanId) return;
    // const fetchLoanAndClient = async () => {
    //   // Fetch loan details to get client_id
    //   const { data: loanData, error: loanError } = await supabase
    //     .from("loans")
    //     .select("*, client_id(id, first_name, last_name)")
    //     .eq("id", loanId)
    //     .single();

    //   if (loanError) {
    //     console.error("Error fetching loan data:", loanError);
    //     return;
    //   }

    //   setLoan(loanData);
    //   setClient(loanData.client_id); // The client data is nested
    // };

    // fetchLoanAndClient();

    supabase
      .from("repayment_schedule")
      .select("*, loans(*, clients(*))")
      // .eq("loan_id", loanId)
      .order("due_date")
      .then(({ data }) => setRepayments(data || []));
  }, []);

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
    <>
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={s.title}>Repayment Schedule</h3>
        </div>
        {msg && <div style={{ padding: "0.75rem", background: "#e8f5e9", borderRadius: 6, marginBottom: "1rem" }}>{msg}</div>}
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Loan</th>
              <th style={s.th}>Client</th>
              <th style={s.th}>Due Date</th>
              <th style={s.th}>Amount</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {repayments.map(r => (
              <tr key={r.id}>
                <td style={s.td}>{r.loans.loan_number}</td>
                <td style={s.td}>
                  <button
                    onClick={() => {
                      setSelectedClientId(r.loans.clients.id);
                      setShowClientModal(true);
                    }}
                    style={{ color: '#0176d3', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {r.loans.clients.first_name} {r.loans.clients.last_name}
                  </button>
                </td>
                <td style={s.td}>
                  {(() => {
                    return formatDate(r.due_date);
                  })()}
                </td>
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
      {showClientModal && selectedClientId && (
        <Client360Modal
          isOpen={showClientModal}
          onClose={() => setShowClientModal(false)}
          clientId={selectedClientId}
        />
      )}
    </>
  );
}