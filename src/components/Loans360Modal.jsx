// src/components/Loans360Modal.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { formatDate } from '../utils/dateFormatter';
import StatementView from './StatementView';

export default function Loans360Modal({ loan: initialLoan, onClose }) {
  const [loan, setLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showStatement, setShowStatement] = useState(false);

  useEffect(() => {
    if (initialLoan?.id) {
      fetchFullLoanData();
    }
  }, [initialLoan?.id]);

  const fetchFullLoanData = async () => {
    try {
      // 1. Fetch Loan Details
      const { data: loanData } = await supabase
        .from('loans')
        .select(`
          *,
          loan_products (name, interest_type),
          clients (first_name, last_name, client_code),
          loan_balances (
             current_outstanding_balance,
             outstanding_principal
          )
        `)
        .eq('id', initialLoan.id)
        .single();

      // Normalize balance data from relation if exists
      if (loanData && loanData.loan_balances) {
        // If it's an array (which it shouldn't be with single() but just in case of FK weirdness or no single modifier on relation)
        // Actually we joined it. It might come as object or array depending on relation setup.
        // Let's assume object if logic changes, but safeguard.
        const bal = Array.isArray(loanData.loan_balances) ? loanData.loan_balances[0] : loanData.loan_balances;
        if (bal) {
          loanData.current_balance = bal.current_outstanding_balance;
          loanData.outstanding_principal = bal.outstanding_principal;
        }
      }

      // 2. Fetch Repayment Schedule
      const { data: schedule } = await supabase
        .from('repayment_schedule')
        .select('*')
        .eq('loan_id', initialLoan.id)
        .order('due_date', { ascending: true });

      // 3. Fetch Transactions
      const { data: txns } = await supabase
        .from('transactions')
        .select('*')
        .eq('loan_id', initialLoan.id)
        .order('txn_date', { ascending: false });

      setLoan(loanData);
      setInstallments(schedule || []);
      setTransactions(txns || []);
    } catch (error) {
      console.error('Loan360 error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysToGo = () => {
    if (!loan?.end_date) return 'N/A';
    const diff = new Date(loan.end_date) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const installmentsRemaining = () => {
    return installments.filter(i => new Date(i.due_date) >= new Date()).length;
  };

  const exportScheduleCSV = () => {
    const headers = ['Due Date', 'Amount', 'Principal', 'Interest', 'Fees', 'Status'];
    const rows = installments.map(i => [
      formatDate(i.due_date),
      i.scheduled_amount?.toFixed(2) || i.amount?.toFixed(2), // Handle possible column name diffs
      i.principal_portion?.toFixed(2),
      i.interest_portion?.toFixed(2),
      i.fee_portion?.toFixed(2) || '0.00',
      i.status
    ]);
    downloadCSV(headers, rows, `Loan_${loan.loan_number}_Schedule.csv`);
  };

  const exportTransactionsCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Source', 'Status', 'Notes'];
    const rows = transactions.map(t => [
      formatDate(t.txn_date),
      t.txn_type,
      t.amount?.toFixed(2),
      t.source,
      t.processing_status,
      t.notes || ''
    ]);
    downloadCSV(headers, rows, `Loan_${loan.loan_number}_Transactions.csv`);
  };

  const downloadCSV = (headers, rows, filename) => {
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (showStatement) {
    return <StatementView loan={loan} transactions={transactions} onClose={() => setShowStatement(false)} />;
  }

  if (!initialLoan) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>Loan Details</h2>
            <div style={subTitleStyle}>{loan?.loan_number || 'Loading...'} • <span style={{ color: '#fff', opacity: 0.9 }}>{loan?.clients?.first_name} {loan?.clients?.last_name}</span></div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => setShowStatement(true)} style={actionBtnStyle}>Print Statement</button>
            <button onClick={onClose} style={closeBtnStyle}>×</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={tabContainerStyle}>
          <button style={activeTab === 'overview' ? activeTabStyle : tabStyle} onClick={() => setActiveTab('overview')}>Overview</button>
          <button style={activeTab === 'schedule' ? activeTabStyle : tabStyle} onClick={() => setActiveTab('schedule')}>Repayment Schedule</button>
          <button style={activeTab === 'transactions' ? activeTabStyle : tabStyle} onClick={() => setActiveTab('transactions')}>Transactions</button>
        </div>

        {loading ? <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>Loading loan details...</div> : (
          <div style={contentStyle}>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div style={cardGridStyle}>
                {/* Card 1: Loan Info */}
                <div style={cardStyle}>
                  <h3 style={cardTitleStyle}>Loan Information</h3>
                  <div style={infoGridStyle}>
                    <InfoItem label="Product" value={loan?.loan_products?.name || 'Standard Loan'} />
                    <InfoItem label="Interest Rate" value={`${loan?.annual_interest_rate || loan?.loan_products?.interest_rate || 0}%`} />
                    <InfoItem label="Term" value={`${loan?.instalments_due || 0} (${loan?.term || ''})`} />
                    <InfoItem label="Frequency" value={loan?.term || 'Monthly'} capitalize />
                    <InfoItem label="Start Date" value={formatDate(loan?.start_date)} />
                    <InfoItem label="Maturity Date" value={formatDate(loan?.end_date)} />
                  </div>
                </div>

                {/* Card 2: Financial Status */}
                <div style={cardStyle}>
                  <h3 style={cardTitleStyle}>Financial Status</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#666' }}>Current Balance</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0176d3' }}>${loan?.current_balance?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div style={infoGridStyle}>
                      <InfoItem label="Original Amount" value={`$${loan?.loan_amount?.toFixed(2)}`} />
                      <InfoItem label="Installments Left" value={`${installmentsRemaining()} / ${installments.length}`} />
                      <InfoItem label="Days Remaining" value={calculateDaysToGo()} />
                      <InfoItem label="Status" value={loan?.status} badge />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCHEDULE TAB */}
            {activeTab === 'schedule' && (
              <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ ...cardTitleStyle, marginBottom: 0 }}>Repayment Schedule</h3>
                  <button onClick={exportScheduleCSV} style={{ ...actionBtnStyle, background: '#0176d3', color: '#fff' }}>Download CSV</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={tableHeaderRowStyle}>
                        <th style={thStyle}>#</th>
                        <th style={thStyle}>Due Date</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Principal</th>
                        <th style={thStyle}>Interest</th>
                        <th style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installments.length > 0 ? installments.map((i, idx) => (
                        <tr key={i.id || idx} style={{ borderBottom: idx === installments.length - 1 ? 'none' : '1px solid #f3f2f2' }}>
                          <td style={tdStyle}>{i.payment_number}</td>
                          <td style={tdStyle}>{formatDate(i.due_date)}</td>
                          <td style={{ ...tdStyle, fontWeight: 500 }}>${(i.scheduled_amount || i.amount || 0).toFixed(2)}</td>
                          <td style={tdStyle}>${(i.principal_portion || 0).toFixed(2)}</td>
                          <td style={tdStyle}>${(i.interest_portion || 0).toFixed(2)}</td>
                          <td style={tdStyle}>
                            <StatusBadge status={i.status} />
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '2rem' }}>No schedule generated.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TRANSACTIONS TAB */}
            {activeTab === 'transactions' && (
              <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ ...cardTitleStyle, marginBottom: 0 }}>Transaction History</h3>
                  <button onClick={exportTransactionsCSV} style={{ ...actionBtnStyle, background: '#0176d3', color: '#fff' }}>Download CSV</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={tableHeaderRowStyle}>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Source</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length > 0 ? transactions.map((t, idx) => (
                        <tr key={t.id || idx} style={{ borderBottom: idx === transactions.length - 1 ? 'none' : '1px solid #f3f2f2' }}>
                          <td style={tdStyle}>{formatDate(t.txn_date)}</td>
                          <td style={tdStyle}><span style={{ fontWeight: 600 }}>{t.txn_type}</span></td>
                          <td style={{ ...tdStyle, fontWeight: 500, color: t.txn_type === 'PAYMENT' ? 'green' : '#333' }}>
                            {t.txn_type === 'PAYMENT' ? '-' : ''}${t.amount?.toFixed(2)}
                          </td>
                          <td style={tdStyle}>{t.source}</td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: t.processing_status === 'processed' ? '#e6fffa' : '#fff5f5', color: t.processing_status === 'processed' ? '#2c7a7b' : '#c53030' }}>
                              {t.processing_status}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, maxWidth: '200px', fontSize: '0.85rem', color: '#666' }}>{t.notes}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '2rem' }}>No transactions found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components
const InfoItem = ({ label, value, capitalize, badge }) => (
  <div style={{ marginBottom: '0.5rem' }}>
    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.2rem' }}>{label}</div>
    {badge ? (
      <StatusBadge status={value} />
    ) : (
      <div style={{ fontSize: '1rem', color: '#2b2b2b', fontWeight: 500, textTransform: capitalize ? 'capitalize' : 'none' }}>
        {value || '-'}
      </div>
    )}
  </div>
);

const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase() || '';
  let bg = '#eee';
  let color = '#333';

  if (s === 'active' || s === 'paid' || s === 'current') { bg = '#cdfbc8'; color = '#1e7e34'; }
  else if (s === 'pending') { bg = '#fff3cd'; color = '#856404'; }
  else if (s === 'overdue' || s === 'written off' || s === 'late') { bg = '#f8d7da'; color = '#721c24'; }

  return (
    <span style={{ background: bg, color: color, padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {status}
    </span>
  );
};

// Styles
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 };
const modalStyle = { background: '#f4f6f9', width: '90%', maxWidth: '1100px', height: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '8px', boxShadow: '0 15px 30px rgba(0,0,0,0.2)', overflow: 'hidden' };
const headerStyle = { background: '#0176d3', color: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 };
const titleStyle = { margin: 0, fontSize: '1.25rem', fontWeight: 600 };
const subTitleStyle = { fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.25rem' };
const contentStyle = { padding: '2rem', overflowY: 'auto', flex: 1 };
const actionBtnStyle = { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s', marginLeft: '0.5rem' };
const closeBtnStyle = { background: 'none', border: 'none', color: '#fff', fontSize: '1.8rem', cursor: 'pointer', lineHeight: 1, padding: '0 0.5rem' };

const tabContainerStyle = { display: 'flex', background: '#fff', padding: '0 2rem', borderBottom: '1px solid #e1e4e8' };
const tabStyle = { background: 'none', border: 'none', borderBottom: '2px solid transparent', padding: '1rem 1.5rem', fontSize: '0.95rem', fontWeight: 500, color: '#666', cursor: 'pointer' };
const activeTabStyle = { ...tabStyle, color: '#0176d3', borderBottom: '2px solid #0176d3' };

const cardGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' };
const cardStyle = { background: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #e1e4e8' };
const cardTitleStyle = { margin: '0 0 1.25rem 0', fontSize: '1.1rem', color: '#0176d3', fontWeight: 600 };
const infoGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const tableHeaderRowStyle = { background: '#f8f9fa', borderBottom: '2px solid #e9ecef' };
const thStyle = { padding: '0.8rem 1rem', textAlign: 'left', fontWeight: 600, color: '#495057', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.03em' };
const tdStyle = { padding: '0.8rem 1rem', color: '#212529' };

