import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import PageHeader from '../components/PageHeader';

const today = new Date();

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfQuarter(d) {
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), q * 3, 1);
}

function endOfQuarter(d) {
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), q * 3 + 3, 0);
}

// NZ Financial Year: April 1 – March 31
function nzFYStart(d) {
  return d.getMonth() >= 3
    ? new Date(d.getFullYear(), 3, 1)
    : new Date(d.getFullYear() - 1, 3, 1);
}
function nzFYEnd(d) {
  return d.getMonth() >= 3
    ? new Date(d.getFullYear() + 1, 2, 31)
    : new Date(d.getFullYear(), 2, 31);
}

const QUICK_RANGES = [
  { label: 'This Month', fn: () => ({ from: isoDate(startOfMonth(today)), to: isoDate(today) }) },
  { label: 'Last Month', fn: () => {
    const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return { from: isoDate(startOfMonth(lm)), to: isoDate(endOfMonth(lm)) };
  }},
  { label: 'This Quarter', fn: () => ({ from: isoDate(startOfQuarter(today)), to: isoDate(endOfQuarter(today)) }) },
  { label: 'YTD', fn: () => ({ from: isoDate(new Date(today.getFullYear(), 0, 1)), to: isoDate(today) }) },
  { label: 'Last Year', fn: () => ({
    from: isoDate(new Date(today.getFullYear() - 1, 0, 1)),
    to: isoDate(new Date(today.getFullYear() - 1, 11, 31)),
  })},
  { label: 'NZ FY', fn: () => ({ from: isoDate(nzFYStart(today)), to: isoDate(nzFYEnd(today)) }) },
];

function fmt(n) {
  return `$${(n || 0).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ProfitAndLoss() {
  const [dateRange, setDateRange] = useState({
    from: isoDate(startOfMonth(today)),
    to: isoDate(today),
  });
  const [activeQuick, setActiveQuick] = useState('This Month');
  const [loading, setLoading] = useState(false);
  const [income, setIncome] = useState({ interest: 0, fees: 0 });
  const [expenses, setExpenses] = useState([]);
  const [portfolio, setPortfolio] = useState({ outstanding: 0, principal: 0, interest: 0 });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchIncome(), fetchExpenses(), fetchPortfolio()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncome = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('interest_applied, fees_applied')
      .eq('txn_type', 'PAY')
      .gte('txn_date', dateRange.from)
      .lte('txn_date', dateRange.to);

    if (error) { console.error(error); return; }
    const interest = (data || []).reduce((s, t) => s + (t.interest_applied || 0), 0);
    const fees = (data || []).reduce((s, t) => s + (t.fees_applied || 0), 0);
    setIncome({ interest, fees });
  };

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount')
      .gte('expense_date', dateRange.from)
      .lte('expense_date', dateRange.to);

    if (error) { console.error(error); return; }
    const grouped = {};
    (data || []).forEach(e => {
      grouped[e.category] = (grouped[e.category] || 0) + (e.amount || 0);
    });
    const rows = Object.entries(grouped)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
    setExpenses(rows);
  };

  const fetchPortfolio = async () => {
    const { data, error } = await supabase
      .from('loan_balances')
      .select('current_outstanding_balance, outstanding_principal, outstanding_interest');

    if (error) { console.error(error); return; }
    const outstanding = (data || []).reduce((s, b) => s + (b.current_outstanding_balance || 0), 0);
    const principal = (data || []).reduce((s, b) => s + (b.outstanding_principal || 0), 0);
    const interest = (data || []).reduce((s, b) => s + (b.outstanding_interest || 0), 0);
    setPortfolio({ outstanding, principal, interest });
  };

  const totalIncome = income.interest + income.fees;
  const totalExpenses = expenses.reduce((s, e) => s + e.total, 0);
  const netProfit = totalIncome - totalExpenses;

  const setQuick = (item) => {
    setActiveQuick(item.label);
    setDateRange(item.fn());
  };

  const exportCSV = () => {
    let csv = `Profit & Loss Report\nPeriod: ${dateRange.from} to ${dateRange.to}\n\n`;
    csv += 'INCOME\n';
    csv += `Interest Collected,${income.interest.toFixed(2)}\n`;
    csv += `Fees Collected,${income.fees.toFixed(2)}\n`;
    csv += `Total Income,${totalIncome.toFixed(2)}\n\n`;
    csv += 'EXPENSES\n';
    expenses.forEach(e => { csv += `${e.category},${e.total.toFixed(2)}\n`; });
    csv += `Total Expenses,${totalExpenses.toFixed(2)}\n\n`;
    csv += `NET PROFIT,${netProfit.toFixed(2)}\n\n`;
    csv += 'LOAN PORTFOLIO\n';
    csv += `Total Outstanding,${portfolio.outstanding.toFixed(2)}\n`;
    csv += `Principal Outstanding,${portfolio.principal.toFixed(2)}\n`;
    csv += `Interest Accrued (not collected),${portfolio.interest.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pl_${dateRange.from}_${dateRange.to}.csv`;
    link.click();
  };

  return (
    <div style={{ padding: '1.5rem', background: '#f8f9fa', minHeight: '100vh' }}>
      <PageHeader
        title="Profit & Loss"
        subtitle="Income, expenses and net profit over a selected period."
        actions={<button onClick={exportCSV} style={exportBtnStyle}>Export to CSV</button>}
      />

      {/* Date Range Filter */}
      <div style={filterCardStyle}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {QUICK_RANGES.map(item => (
            <button
              key={item.label}
              onClick={() => setQuick(item)}
              style={activeQuick === item.label ? activeQuickBtnStyle : quickBtnStyle}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <label style={labelStyle}>
            From&nbsp;
            <input
              type="date"
              value={dateRange.from}
              onChange={e => { setActiveQuick(''); setDateRange(r => ({ ...r, from: e.target.value })); }}
              style={dateInputStyle}
            />
          </label>
          <label style={labelStyle}>
            To&nbsp;
            <input
              type="date"
              value={dateRange.to}
              onChange={e => { setActiveQuick(''); setDateRange(r => ({ ...r, to: e.target.value })); }}
              style={dateInputStyle}
            />
          </label>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* INCOME */}
          <div style={sectionCard}>
            <h3 style={{ ...sectionTitle, color: '#2e7d32' }}>Income</h3>
            <table style={tableStyle}>
              <tbody>
                <tr style={rowStyle}>
                  <td style={tdLabel}>Interest Collected</td>
                  <td style={tdValue}>{fmt(income.interest)}</td>
                </tr>
                <tr style={rowStyle}>
                  <td style={tdLabel}>Fees Collected</td>
                  <td style={tdValue}>{fmt(income.fees)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={totalRowStyle}>
                  <td style={tdTotalLabel}>Total Income</td>
                  <td style={{ ...tdTotalValue, color: '#2e7d32' }}>{fmt(totalIncome)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* EXPENSES */}
          <div style={sectionCard}>
            <h3 style={{ ...sectionTitle, color: '#c62828' }}>Expenses</h3>
            <table style={tableStyle}>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="2" style={{ color: '#999', padding: '1rem', fontStyle: 'italic' }}>
                      No expenses in this period
                    </td>
                  </tr>
                ) : (
                  expenses.map(e => (
                    <tr key={e.category} style={rowStyle}>
                      <td style={tdLabel}>{e.category}</td>
                      <td style={tdValue}>{fmt(e.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={totalRowStyle}>
                  <td style={tdTotalLabel}>Total Expenses</td>
                  <td style={{ ...tdTotalValue, color: '#c62828' }}>{fmt(totalExpenses)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* NET PROFIT */}
          <div style={{
            ...sectionCard,
            gridColumn: '1 / -1',
            borderTop: `4px solid ${netProfit >= 0 ? '#2e7d32' : '#c62828'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#181818' }}>Net Profit</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#706e6b' }}>
                  Total Income minus Total Expenses
                </p>
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: netProfit >= 0 ? '#2e7d32' : '#c62828',
              }}>
                {netProfit < 0 ? '-' : ''}{fmt(Math.abs(netProfit))}
              </div>
            </div>
          </div>

          {/* LOAN PORTFOLIO */}
          <div style={{ ...sectionCard, gridColumn: '1 / -1' }}>
            <h3 style={sectionTitle}>Loan Portfolio (All Active Loans)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={statCard}>
                <div style={statLabel}>Total Outstanding</div>
                <div style={statValue}>{fmt(portfolio.outstanding)}</div>
              </div>
              <div style={statCard}>
                <div style={statLabel}>Principal Outstanding</div>
                <div style={statValue}>{fmt(portfolio.principal)}</div>
              </div>
              <div style={statCard}>
                <div style={statLabel}>Interest Accrued (not collected)</div>
                <div style={statValue}>{fmt(portfolio.interest)}</div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// Styles
const exportBtnStyle = {
  background: '#0176d3', color: '#fff', border: 'none',
  padding: '0.6rem 1.2rem', borderRadius: '4px', cursor: 'pointer',
  fontSize: '0.9rem', fontWeight: 600,
};
const filterCardStyle = {
  background: '#fff', borderRadius: '8px', padding: '1.25rem 1.5rem',
  marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  border: '1px solid #e1e4e8',
};
const quickBtnStyle = {
  padding: '0.35rem 0.9rem', borderRadius: '20px', border: '1px solid #d1d5db',
  background: '#fff', color: '#374151', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
};
const activeQuickBtnStyle = {
  ...quickBtnStyle, background: '#0176d3', color: '#fff', border: '1px solid #0176d3',
};
const labelStyle = { fontSize: '0.875rem', fontWeight: 500, color: '#374151' };
const dateInputStyle = {
  marginLeft: '0.5rem', padding: '0.4rem 0.6rem',
  border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem',
};
const sectionCard = {
  background: '#fff', borderRadius: '8px', padding: '1.5rem',
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #e1e4e8',
};
const sectionTitle = { margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const rowStyle = { borderBottom: '1px solid #f0f0f0' };
const totalRowStyle = { borderTop: '2px solid #e1e4e8', background: '#f8f9fa' };
const tdLabel = { padding: '0.6rem 0.5rem', color: '#374151', fontSize: '0.9rem' };
const tdValue = { padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 500, color: '#181818', fontSize: '0.9rem' };
const tdTotalLabel = { padding: '0.75rem 0.5rem', fontWeight: 700, color: '#181818' };
const tdTotalValue = { padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, fontSize: '1.05rem' };
const statCard = {
  background: '#f8f9fa', borderRadius: '8px', padding: '1rem 1.25rem',
  border: '1px solid #e1e4e8',
};
const statLabel = { fontSize: '0.8rem', color: '#706e6b', marginBottom: '0.4rem' };
const statValue = { fontSize: '1.4rem', fontWeight: 700, color: '#0176d3' };
