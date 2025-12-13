// src/components/Loans360Modal.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';

export default function Loans360Modal({ loan: initialLoan, onClose }) {
  const [loan, setLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialLoan?.id) {
      fetchFullLoanData();
    }
  }, [initialLoan?.id]);

  const fetchFullLoanData = async () => {
    try {
      const { data: loanData } = await supabase
        .from('loans')
        .select(`
          *,
          loan_products (*),
          clients (first_name, last_name, client_code)
        `)
        .eq('id', initialLoan.id)
        .single();

      const { data: schedule } = await supabase
        .from('repayment_schedule')
        .select('*')
        .eq('loan_id', initialLoan.id)
        .order('due_date', { ascending: true });

      setLoan(loanData);
      setInstallments(schedule || []);
    } catch (error) {
      console.error('Loan360 error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
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

  const exportToCSV = () => {
    const headers = ['Due Date', 'Amount', 'Principal', 'Interest', 'Fees', 'Status'];
    const rows = installments.map(i => [
      formatDate(i.due_date),
      i.amount?.toFixed(2),
      i.principal_portion?.toFixed(2),
      i.interest_portion?.toFixed(2),
      i.fee_portion?.toFixed(2),
      i.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Loan_${loan.loan_number}_Schedule.csv`;
    a.click();
  };

  const printPDF = () => {
    window.print();
  };

  if (!initialLoan) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '0.5rem', width: '90%', maxWidth: '1000px',
        maxHeight: '90vh', overflow: 'auto', padding: '1.5rem'
      }} onClick={e => e.stopPropagation()}>

        {/* HEADER */}
        <div style={{
          padding: '1rem', background: '#0176d3', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderRadius: '0.5rem 0.5rem 0 0'
        }}>
          <h2 style={{ margin: 0 }}>Loan 360 - {loan?.loan_number || '...'}</h2>
          <div>
            <button onClick={exportToCSV} style={{
              background: '#fff', color: '#0176d3', border: 'none', padding: '0.5rem 1rem',
              borderRadius: '0.25rem', marginRight: '0.5rem', fontSize: '0.875rem'
            }}>Export CSV</button>
            <button onClick={printPDF} style={{
              background: '#fff', color: '#0176d3', border: 'none', padding: '0.5rem 1rem',
              borderRadius: '0.25rem', marginRight: '0.5rem', fontSize: '0.875rem'
            }}>Print PDF</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem' }}>×</button>
          </div>
        </div>

        {loading ? <p style={{ padding: '2rem', textAlign: 'center' }}>Loading...</p> : (
          <>
            <div style={{ margin: '1.5rem 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><strong>Client:</strong> {loan?.clients?.first_name} {loan?.clients?.last_name} ({loan?.clients?.client_code})</div>
                <div><strong>Product:</strong> {loan?.loan_products?.name} ({loan?.loan_products?.interest_rate}%)</div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#0176d3', borderBottom: '2px solid #0176d3', paddingBottom: '0.5rem' }}>Loan Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div><strong>Amount Advanced:</strong> ${loan?.loan_amount?.toFixed(2)}</div>
                <div><strong>Start Date:</strong> {formatDate(loan?.start_date)}</div>
                <div><strong>Term:</strong> {loan?.term_months} months</div>
                <div><strong>End Date:</strong> {formatDate(loan?.end_date)}</div>
                <div><strong>Days to Go:</strong> {calculateDaysToGo()}</div>
                <div><strong>Installments Total:</strong> {installments.length}</div>
                <div><strong>Remaining:</strong> {installmentsRemaining()}</div>
                <div><strong>Current Balance:</strong> ${loan?.current_balance?.toFixed(2)}</div>
              </div>
            </div>

            <div>
              <h3 style={{ color: '#0176d3', borderBottom: '2px solid #0176d3', paddingBottom: '0.5rem' }}>Repayment Schedule</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Due Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Principal</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Interest</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Fees</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map(i => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>{formatDate(i.due_date)}</td>
                      <td style={{ padding: '0.75rem' }}>${i.amount?.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem' }}>${i.principal_portion?.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem' }}>${i.interest_portion?.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem' }}>${i.fee_portion?.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem' }}>{i.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}