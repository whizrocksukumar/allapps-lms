// src/components/Loans360Modal.jsx
// Updated: 22-DEC-2025 - Horizontal layout, removed loan_products, added CSV export
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { formatDate, getTransactionTypeName, exportTransactionsToCSV, exportScheduleToCSV } from '../utils/transactionHelpers';
import StatementView from './StatementView';

export default function Loans360Modal({ loan: initialLoan, onClose }) {
  const [loan, setLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loanBalance, setLoanBalance] = useState(null);
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
      setLoading(true);
      
      // 1. Fetch Loan Details with client info (NO loan_products)
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select(`
          *,
          clients (id, first_name, last_name, client_code, email, mobile_phone, address, city)
        `)
        .eq('id', initialLoan.id)
        .single();

      if (loanError) {
        console.error('Loan fetch error:', loanError);
        setLoading(false);
        return;
      }

      // 2. Fetch Loan Balance (source of truth)
      const { data: balanceData } = await supabase
        .from('loan_balances')
        .select('*')
        .eq('loan_id', initialLoan.id)
        .single();

      // 3. Fetch Repayment Schedule
      const { data: schedule } = await supabase
        .from('repayment_schedule')
        .select('*')
        .eq('loan_id', initialLoan.id)
        .order('due_date', { ascending: true });

      // 4. Fetch Transactions
      const { data: txns } = await supabase
        .from('transactions')
        .select('*')
        .eq('loan_id', initialLoan.id)
        .order('txn_date', { ascending: false });

      setLoan(loanData);
      setLoanBalance(balanceData);
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
    return installments.filter(i => i.status === 'pending').length;
  };

  const formatTerm = (term, frequency) => {
    if (!term || !frequency) return 'N/A';
    const unit = frequency === 'Weekly' ? 'Weeks' :
                 frequency === 'Fortnightly' ? 'Fortnights' : 'Months';
    return `${term} ${unit}`;
  };

  const handleExportScheduleCSV = () => {
    if (loan && installments.length > 0) {
      exportScheduleToCSV(loan, installments, `Loan_${loan.loan_number}_Schedule.csv`);
    }
  };

  const handleExportTransactionsCSV = () => {
    if (loan && transactions.length > 0) {
      exportTransactionsToCSV(loan, transactions, `Loan_${loan.loan_number}_Transactions.csv`);
    }
  };

  if (showStatement) {
    return <StatementView loan={loan} transactions={transactions} onClose={() => setShowStatement(false)} />;
  }

  if (!initialLoan) return null;

  const client = Array.isArray(loan?.clients) ? loan.clients[0] : loan?.clients;

  return (
    <div style={overlayStyle} onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div style={modalStyle} onMouseDown={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>Loan Details</h2>
            <div style={subTitleStyle}>{loan?.loan_number || 'Loading...'} • <span style={{ color: '#fff', opacity: 0.9 }}>{client?.first_name} {client?.last_name}</span></div>
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
              <div style={topSectionStyle}>
                
                {/* LEFT CARD: Loan Information */}
                <div style={{ flex: 1, paddingRight: '2rem', borderRight: '1px solid #eee' }}>
                  <h4 style={sectionTitleStyle}>Loan Information</h4>
                  <InfoRow label="Loan Number" value={loan?.loan_number} />
                  <InfoRow label="Client Code" value={client?.client_code} />
                  <div style={dividerStyle}></div>
                  <InfoRow label="Interest Rate" value={loan?.annual_interest_rate ? `${loan.annual_interest_rate}%` : 'N/A'} />
                  <InfoRow label="Term" value={formatTerm(loan?.term, loan?.repayment_frequency)} />
                  <InfoRow label="Frequency" value={loan?.repayment_frequency} />
                  <div style={dividerStyle}></div>
                  <InfoRow label="Start Date" value={formatDate(loan?.start_date)} />
                  <InfoRow label="End Date" value={formatDate(loan?.end_date)} />
                  <InfoRow label="Days Remaining" value={calculateDaysToGo()} />
                  <div style={dividerStyle}></div>
                  <InfoRow label="Establishment Fee" value={`$${loan?.establishment_fee?.toFixed(2) || '0.00'}`} />
                  <InfoRow label="Status" value={<StatusBadge status={loan?.status} />} />
                </div>

                {/* RIGHT CARD: Balance & Status */}
                <div style={{ flex: 1, paddingLeft: '2rem' }}>
                  <h4 style={sectionTitleStyle}>Balance & Status</h4>
                  
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0f8ff', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>Current Balance</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0176d3', marginTop: '0.5rem' }}>
                      ${loanBalance?.current_outstanding_balance?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  
                  <InfoRow label="Original Amount" value={`$${loan?.loan_amount?.toFixed(2)}`} />
                  <InfoRow label="Principal Outstanding" value={`$${loanBalance?.outstanding_principal?.toFixed(2) || '0.00'}`} />
                  <InfoRow label="Interest Outstanding" value={`$${loanBalance?.outstanding_interest?.toFixed(2) || '0.00'}`} />
                  <InfoRow label="Unpaid Fees" value={`$${loanBalance?.unpaid_fees?.toFixed(2) || '0.00'}`} />
                  <div style={dividerStyle}></div>
                  <InfoRow label="Installments Left" value={`${installmentsRemaining()} / ${installments.length}`} />
                </div>
              </div>
            )}

            {/* SCHEDULE TAB */}
            {activeTab === 'schedule' && (
              <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ ...cardTitleStyle, marginBottom: 0 }}>Repayment Schedule</h3>
                  <button onClick={handleExportScheduleCSV} style={{ ...actionBtnStyle, background: '#0176d3', color: '#fff' }}>Download CSV</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={tableHeaderRowStyle}>
                        <th style={thStyle}>No.</th>
                        <th style={thStyle}>Due Date</th>
                        <th style={thStyle}>Principal</th>
                        <th style={thStyle}>Interest</th>
                        <th style={thStyle}>Total Amount</th>
                        <th style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installments.length > 0 ? installments.map((i, idx) => (
                        <tr key={i.id || idx} style={{ borderBottom: idx === installments.length - 1 ? 'none' : '1px solid #f3f2f2' }}>
                          <td style={tdStyle}>{i.instalment_number}</td>
                          <td style={tdStyle}>{formatDate(i.due_date)}</td>
                          <td style={tdStyle}>${(i.principal_amount || 0).toFixed(2)}</td>
                          <td style={tdStyle}>${(i.interest_amount || 0).toFixed(2)}</td>
                          <td style={{ ...tdStyle, fontWeight: 500 }}>${(i.total_amount || 0).toFixed(2)}</td>
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
                  <button onClick={handleExportTransactionsCSV} style={{ ...actionBtnStyle, background: '#0176d3', color: '#fff' }}>Download CSV</button>
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
                          <td style={tdStyle}><span style={{ fontWeight: 600 }}>{getTransactionTypeName(t.txn_type)}</span></td>
                          <td style={{ ...tdStyle, fontWeight: 500, color: t.txn_type === 'PAY' ? 'green' : '#333' }}>
                            {t.txn_type === 'PAY' ? '-' : ''}${t.amount?.toFixed(2)}
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

// Helper Components
const InfoRow = ({ label, value }) => (
  <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ color: '#666', fontSize: '0.9rem' }}>{label}:</span>
    <span style={{ fontWeight: 500, fontSize: '0.9rem', textAlign: 'right' }}>{value || '-'}</span>
  </div>
);

const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase() || '';
  let bg = '#eee';
  let color = '#333';

  if (s === 'active' || s === 'paid' || s === 'current') { bg = '#cdfbc8'; color = '#1e7e34'; }
  else if (s === 'pending') { bg = '#fff3cd'; color = '#856404'; }
  else if (s === 'overdue' || s === 'consolidated' || s === 'written off' || s === 'late') { bg = '#f8d7da'; color = '#721c24'; }

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

const topSectionStyle = { display: 'flex', background: '#fff', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', gap: '2rem' };
const sectionTitleStyle = { color: '#0176d3', borderBottom: '2px solid #0176d3', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: 0 };
const dividerStyle = { height: '1px', background: '#eee', margin: '1rem 0' };

const cardStyle = { background: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #e1e4e8' };
const cardTitleStyle = { margin: '0 0 1.25rem 0', fontSize: '1.1rem', color: '#0176d3', fontWeight: 600 };

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const tableHeaderRowStyle = { background: '#f8f9fa', borderBottom: '2px solid #e9ecef' };
const thStyle = { padding: '0.8rem 1rem', textAlign: 'left', fontWeight: 600, color: '#495057', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.03em' };
const tdStyle = { padding: '0.8rem 1rem', color: '#212529' };