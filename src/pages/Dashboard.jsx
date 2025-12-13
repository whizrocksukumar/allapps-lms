import React, { useState, useEffect, useMemo } from "react";
import { getLoansWithClientNames, getClients } from "../services/supabaseService";
import CalculatorModal from "../components/CalculatorModal";
import NewClientModal from "../components/NewClientModal";
import Client360Modal from "../components/Client360Modal";
import Loans360Modal from "../components/Loans360Modal";
import * as XLSX from "xlsx";

export default function Dashboard() {
  // STATE
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // MODAL STATE
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClient360, setShowClient360] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showLoans360, setShowLoans360] = useState(false);

  // LOAD DATA
  async function loadData() {
    setLoading(true);
    const [loanRes, clientRes] = await Promise.all([
      getLoansWithClientNames(),
      getClients(),
    ]);

    if (loanRes.success) setLoans(loanRes.data || []);
    if (clientRes.success) setClients(clientRes.data || []);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // BUILD ROWS — 1 ROW PER LOAN
  const dataRows = useMemo(() => {
    const loanRows = loans.map((l) => ({
      type: "loan",
      id: l.id,
      clientId: l.clients.id,
      firstName: l.clients.first_name,
      lastName: l.clients.last_name,
      loanNumber: l.loan_number,
      city: l.clients.city,
      region: l.clients.region,
      balance: l.current_balance,
      status: l.status,
      instalmentsDue: l.instalments_due,
      fullObject: l // Keep full object for modal
    }));

    const clientRows = clients
      .filter((c) => !loans.some((l) => l.clients.id === c.id))
      .map((c) => ({
        type: "client",
        id: c.id,
        clientId: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        loanNumber: "",
        city: c.city,
        region: c.region,
        balance: 0,
        status: "",
        instalmentsDue: 0,
        fullObject: null
      }));

    let list = [...loanRows, ...clientRows];

    // SEARCH
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          `${r.firstName} ${r.lastName}`.toLowerCase().includes(term) ||
          (r.loanNumber || "").toLowerCase().includes(term) ||
          (r.city || "").toLowerCase().includes(term) ||
          (r.region || "").toLowerCase().includes(term)
      );
    }

    // FILTER
    if (filterStatus !== "all") {
      list = list.filter((r) => r.type === "loan" && r.status === filterStatus);
    }

    // SORT
    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal, bVal;

        if (sortConfig.key === "clientName") {
          aVal = `${a.lastName} ${a.firstName}`.toLowerCase();
          bVal = `${b.lastName} ${b.firstName}`.toLowerCase();
        } else {
          aVal = (a[sortConfig.key] || "").toString().toLowerCase();
          bVal = (b[sortConfig.key] || "").toString().toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [loans, clients, searchTerm, sortConfig, filterStatus]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  // HANDLERS
  const handleClientClick = (clientId) => {
    setSelectedClient({ id: clientId }); // Minimal object needed for modal logic usually, or fetch full
    setShowClient360(true);
  };

  const handleLoanClick = (loan) => {
    setSelectedLoan(loan);
    setShowLoans360(true);
  };

  // METRICS
  const metrics = useMemo(() => {
    const active = loans.filter((l) => l.status === "active").length;
    const total = loans.reduce((s, l) => s + (l.current_balance || 0), 0);
    return {
      totalLoans: loans.length,
      activeLoans: active,
      totalOverdue: "0.00",
      totalOutstanding: total.toFixed(2),
    };
  }, [loans]);

  // RENDER
  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Loan Dashboard</h1>
        <div style={actionBarStyle}>
          <input
            type="text"
            placeholder="🔍 Search by name, loan#, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchStyle}
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={filterStyle}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
          <button onClick={() => setShowCalculator(true)} style={calcBtnStyle}>+ New Loan</button>
          <button onClick={() => setShowNewClient(true)} style={newClientBtnStyle}>+ New Client</button>
          <button onClick={() => exportToExcel(dataRows)} style={excelBtnStyle}>Export Excel</button>
          <button onClick={printPDF} style={printBtnStyle}>Print PDF</button>
        </div>
      </div>

      <div style={metricsGridStyle}>
        <div style={metricCardStyle}><h3 style={metricValueStyle}>{metrics.totalLoans}</h3><p style={metricLabelStyle}>Total Loans</p></div>
        <div style={metricCardStyle}><h3 style={metricValueStyle}>{metrics.activeLoans}</h3><p style={metricLabelStyle}>Active Loans</p></div>
        <div style={metricCardStyle}><h3 style={{ ...metricValueStyle, color: "#d32f2f" }}>${metrics.totalOverdue}</h3><p style={metricLabelStyle}>Total Overdue</p></div>
        <div style={metricCardStyle}><h3 style={{ ...metricValueStyle, color: "#0176d3" }}>${metrics.totalOutstanding}</h3><p style={metricLabelStyle}>Total Outstanding</p></div>
      </div>

      <div style={tableContainerStyle}>
        {loading ? <p style={loadingStyle}>Loading…</p> :
          error ? <p style={errorStyle}>{error}</p> :
            dataRows.length === 0 ? <p style={emptyStyle}>No records found.</p> :
              <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                  <thead><tr>
                    <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>
                      <input type="checkbox" />
                    </th>
                    {columns.map(c => (
                      <th key={c.key} onClick={() => requestSort(c.sortKey)} style={thStyle}>
                        {c.label}
                        {sortConfig.key === c.sortKey && <span style={{ marginLeft: "0.5rem" }}>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                      </th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {dataRows.map(r => (
                      <tr key={r.id} style={trStyle}>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <input type="checkbox" />
                        </td>
                        <td style={tdStyle}>
                          <span
                            onClick={() => handleClientClick(r.clientId)}
                            style={{ color: '#0176d3', cursor: 'pointer', fontWeight: 500 }}
                          >
                            {r.firstName} {r.lastName}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {r.loanNumber ? (
                            <span
                              onClick={() => handleLoanClick(r.fullObject)}
                              style={{ color: '#0176d3', cursor: 'pointer', fontWeight: 500 }}
                            >
                              {r.loanNumber}
                            </span>
                          ) : "-"}
                        </td>
                        <td style={tdStyle}>{r.city || "-"}</td>
                        <td style={tdStyle}>{r.region || "-"}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: "#0176d3" }}>${r.balance.toFixed(2)}</td>
                        <td style={tdStyle}>
                          {r.status ? (
                            <span style={{
                              ...statusBadgeStyle,
                              backgroundColor: r.status === "active" ? "#d4edda" : "#f8d7da",
                              color: r.status === "active" ? "#155724" : "#721c24"
                            }}>
                              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                            </span>
                          ) : "-"}
                        </td>
                        <td style={tdStyle}>{r.instalmentsDue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        }
      </div>

      {showCalculator && <CalculatorModal onClose={() => setShowCalculator(false)} />}
      {showNewClient && <NewClientModal onClose={() => setShowNewClient(false)} onSave={() => loadData()} />}

      {showClient360 && selectedClient && (
        <Client360Modal
          isOpen={showClient360}
          onClose={() => setShowClient360(false)}
          clientId={selectedClient.id}
        />
      )}

      {showLoans360 && selectedLoan && (
        <Loans360Modal
          loan={selectedLoan}
          onClose={() => setShowLoans360(false)}
        />
      )}
    </div>
  );
}

const columns = [
  { label: "Client Name", key: "clientName", sortKey: "clientName" },
  { label: "Loan No.", key: "loanNumber", sortKey: "loanNumber" },
  { label: "City", key: "city", sortKey: "city" },
  { label: "Region", key: "region", sortKey: "region" },
  { label: "Current Balance", key: "balance", sortKey: "balance" },
  { label: "Status", key: "status", sortKey: "status" },
  { label: "# Instalments Due", key: "instalmentsDue", sortKey: "instalmentsDue" },
];

/* STYLES & EXPORT/PRINT */
const pageStyle = { padding: "1.5rem", maxWidth: "1400px", margin: "0 auto" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" };
const titleStyle = { margin: 0, color: "#0176d3", fontSize: "1.75rem", fontWeight: 600 };
const actionBarStyle = { display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" };
const searchStyle = { padding: "0.5rem 1rem", border: "1px solid #706e6b", borderRadius: "0.25rem", width: "280px" };
const filterStyle = { padding: "0.5rem", border: "1px solid #706e6b", borderRadius: "0.25rem", background: "#fff" };
const calcBtnStyle = { background: "#0176d3", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.25rem", cursor: "pointer" };
const newClientBtnStyle = { background: "#181818", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.25rem", cursor: "pointer" };
const excelBtnStyle = { background: "#2e7d32", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.25rem", cursor: "pointer" };
const printBtnStyle = { background: "#706e6b", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.25rem", cursor: "pointer" };

const metricsGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" };
const metricCardStyle = { background: "#f0f9ff", padding: "1.5rem", borderRadius: "0.5rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" };
const metricValueStyle = { margin: 0, fontSize: "2rem", fontWeight: 700, color: "#181818" };
const metricLabelStyle = { margin: "0.5rem 0 0", color: "#706e6b", fontSize: "0.9rem" };

const tableContainerStyle = { background: "#fff", borderRadius: "0.5rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" };
const tableWrapperStyle = { overflowX: "auto" };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" };
const thStyle = { background: "#0176d3", color: "#fff", padding: "0.75rem", textAlign: "left", fontWeight: 600, cursor: "pointer", userSelect: "none", whiteSpace: 'nowrap' };
const trStyle = { borderBottom: "1px solid #eee" };
const tdStyle = { padding: "0.75rem", color: "#181818", verticalAlign: 'middle' };
const statusBadgeStyle = { padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 500 };
const loadingStyle = { textAlign: "center", padding: "3rem", color: "#706e6b" };
const errorStyle = { ...loadingStyle, color: "#d32f2f" };
const emptyStyle = { ...loadingStyle, color: "#706e6b", fontStyle: "italic" };

const exportToExcel = (data) => {
  const ws = XLSX.utils.json_to_sheet(data.map(r => ({
    "Client Name": `${r.firstName} ${r.lastName}`,
    "Loan No.": r.loanNumber,
    City: r.city,
    Region: r.region,
    "Current Balance": r.balance.toFixed(2),
    Status: r.status,
    "# Instalments Due": r.instalmentsDue,
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Loans");
  XLSX.writeFile(wb, `LMS_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const printPDF = () => {
  const win = window.open("", "", "width=900,height=700");
  win?.document.write(`
    <html><head><title>LMS Report</title>
    <style>body{font-family:Arial;padding:30px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #000;padding:8px;text-align:left;}th{background:#0176d3;color:#fff;}</style>
    </head><body>
    <h2>All Apps Ltd – Loan Report</h2>
    <table><thead><tr><th>Client</th><th>Loan No.</th><th>City</th><th>Region</th><th>Balance</th><th>Status</th><th># Due</th></tr></thead><tbody>
    ${dataRows.map(r => `<tr>
      <td>${r.firstName} ${r.lastName}</td>
      <td>${r.loanNumber || ""}</td>
      <td>${r.city || ""}</td>
      <td>${r.region || ""}</td>
      <td>$${r.balance.toFixed(2)}</td>
      <td>${r.status || ""}</td>
      <td>${r.instalmentsDue}</td>
    </tr>`).join("")}
    </tbody></table>
    <script>window.onload=()=>window.print();</script>
    </body></html>
  `);
  win?.document.close();
};