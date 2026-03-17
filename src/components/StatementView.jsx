// src/components/StatementView.jsx
// Updated: 22-DEC-2025 - Removed loan_products, fixed loan_balances usage
import React, { useRef } from 'react';
import { formatDate, getTransactionTypeName, formatCurrency } from '../utils/transactionHelpers';

export default function StatementView({ loan, transactions, onClose }) {
    const statementRef = useRef();

    const handlePrint = () => {
        window.print();
    };

    const today = new Date();
    
    // Get client and balance data
    const client = loan?.clients || {};
    const balance = Array.isArray(loan?.loan_balances) 
        ? loan.loan_balances[0] 
        : loan?.loan_balances || {};

    // Calculate totals for statement period
    const totalPaid = transactions
        .filter(t => t.txn_type === 'PAY' || t.transaction_type === 'PAY')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    // Get current balances from loan_balances table
    const currentOutstanding = balance.current_outstanding_balance || 0;
    const outstandingPrincipal = balance.outstanding_principal || 0;
    const outstandingInterest = balance.outstanding_interest || 0;
    const unpaidFees = balance.unpaid_fees || 0;

    return (
        <div style={overlayStyle}>
            <div style={containerStyle}>
                {/* Actions Bar (Hidden on Print) */}
                <div className="no-print" style={actionsBarStyle}>
                    <button onClick={onClose} style={closeBtnStyle}>Back</button>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={handlePrint} style={primaryActionBtn}>🖨️ Print Statement</button>
                    </div>
                </div>

                {/* Printable Area */}
                <div ref={statementRef} className="print-area" style={printableAreaStyle}>

                    {/* HEADER */}
                    <div style={headerSection}>
                        <h1 style={headerTitle}>LOAN ACCOUNT STATEMENT</h1>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                            <div>
                                <div style={labelData}><strong>Statement Date:</strong> {formatDate(today)}</div>
                                <div style={labelData}><strong>Account Period:</strong> {formatDate(loan.start_date)} - {formatDate(today)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#333' }}>All Apps Limited</div>
                                <div style={labelData}>15 Dudley Street Lower Hutt 5010</div>
                            </div>
                        </div>
                    </div>

                    {/* CLIENT & LOAN INFO GRID */}
                    <div style={gridSection}>
                        <div style={boxStyle}>
                            <div style={boxHeader}>CLIENT INFORMATION</div>
                            <div style={boxContent}>
                                <div style={rowItem}><span style={label}>Name:</span> {client.first_name} {client.last_name}</div>
                                <div style={rowItem}><span style={label}>Code:</span> {client.client_code || 'N/A'}</div>
                                <div style={rowItem}><span style={label}>Email:</span> {client.email || 'N/A'}</div>
                                <div style={rowItem}><span style={label}>Mobile:</span> {client.mobile_phone || client.phone || 'N/A'}</div>
                                <div style={rowItem}><span style={label}>Address:</span> {client.address ? `${client.address}, ${client.city || ''}` : 'N/A'}</div>
                            </div>
                        </div>

                        <div style={boxStyle}>
                            <div style={boxHeader}>LOAN INFORMATION</div>
                            <div style={boxContent}>
                                <div style={rowItem}><span style={label}>Loan Number:</span> {loan.loan_number}</div>
                                <div style={rowItem}><span style={label}>Principal:</span> ${loan.loan_amount?.toFixed(2)}</div>
                                <div style={rowItem}><span style={label}>Rate:</span> {loan.annual_interest_rate}% p.a.</div>
                                <div style={rowItem}><span style={label}>Term:</span> {loan.term} {loan.repayment_frequency}</div>
                                <div style={rowItem}><span style={label}>Start Date:</span> {formatDate(loan.start_date)}</div>
                                <div style={rowItem}><span style={label}>Status:</span> {loan.status?.toUpperCase()}</div>
                            </div>
                        </div>
                    </div>

                    {/* BALANCE SUMMARY */}
                    <div style={{ ...boxStyle, marginBottom: '2rem' }}>
                        <div style={boxHeader}>CURRENT BALANCE SUMMARY</div>
                        <div style={boxContent}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={rowItem}><span style={label}>Principal Outstanding:</span> ${outstandingPrincipal.toFixed(2)}</div>
                                    <div style={rowItem}><span style={label}>Interest Accrued:</span> ${outstandingInterest.toFixed(2)}</div>
                                    <div style={rowItem}><span style={label}>Fees Pending:</span> ${unpaidFees.toFixed(2)}</div>
                                </div>
                                <div style={{ flex: 1, borderLeft: '1px solid #ddd', paddingLeft: '2rem' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                        TOTAL OUTSTANDING: <span style={{ color: '#0176d3' }}>${currentOutstanding.toFixed(2)}</span>
                                    </div>
                                    <div style={rowItem}><span style={label}>Total Payments Made:</span> ${totalPaid.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TRANSACTIONS */}
                    <div style={boxStyle}>
                        <div style={boxHeader}>TRANSACTION HISTORY</div>
                        <div style={{ padding: '0' }}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr style={thRow}>
                                        <th style={th}>DATE</th>
                                        <th style={th}>TYPE</th>
                                        <th style={th}>DESCRIPTION</th>
                                        <th style={thAlignRight}>DEBIT</th>
                                        <th style={thAlignRight}>CREDIT</th>
                                        <th style={thAlignRight}>BALANCE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.length > 0 ? transactions.map((t, i) => {
                                        const txnType = t.txn_type || t.transaction_type;
                                        const isCredit = txnType === 'PAY';
                                        return (
                                            <tr key={i} style={tr}>
                                                <td style={td}>{formatDate(t.txn_date || t.transaction_date)}</td>
                                                <td style={td}>{getTransactionTypeName(txnType)}</td>
                                                <td style={td}>
                                                    {t.notes || t.description || '-'}
                                                   {t.allocation_breakdown && (
                                                    <div style={smallAlloc}>
                                                        (Prin: ${formatCurrency(t.allocation_breakdown.principal || 0)} | 
                                                        Int: ${formatCurrency(t.allocation_breakdown.interest || 0)} | 
                                                        Fees: ${formatCurrency(t.allocation_breakdown.fees || 0)})
                                                    </div>
)}

                                                </td>
                                                <td style={tdAlignRight}>{!isCredit ? `$${parseFloat(t.amount).toFixed(2)}` : ''}</td>
                                                <td style={tdAlignRight}>{isCredit ? `$${parseFloat(t.amount).toFixed(2)}` : ''}</td>
                                                <td style={tdAlignRight}>
                                                    ${t.balance_after_transaction ? parseFloat(t.balance_after_transaction).toFixed(2) : '-'}
                                                </td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>No transactions found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div style={{ marginTop: '2rem', borderTop: '2px solid #333', paddingTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>
                        Any enquiries regarding this statement should be directed to: credit@allapps.co.nz | Phone: 0800 765 555
                    </div>

                    <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    .print-area { padding: 0 !important; border: none !important; margin: 0 !important; width: 100% !important; }
                    @page { margin: 1cm; size: A4; }
                }
            `}</style>
                </div>
            </div>
        </div>
    );
}

// INLINE STYLES
const overlayStyle = { position: 'fixed', inset: 0, background: '#f5f5f5', zIndex: 9999, overflowY: 'auto' };
const containerStyle = { maxWidth: '850px', margin: '0 auto', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' };
const actionsBarStyle = { padding: '1rem', background: '#333', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 };
const primaryActionBtn = { background: '#0176d3', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const closeBtnStyle = { background: 'transparent', color: '#fff', border: '1px solid #fff', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' };

const printableAreaStyle = { padding: '3rem', fontFamily: '"Courier New", Courier, monospace', color: '#1a1a1a' };

const headerSection = { marginBottom: '2rem', borderBottom: '2px solid #333', paddingBottom: '1rem' };
const headerTitle = { margin: 0, fontSize: '1.8rem', textAlign: 'center', letterSpacing: '2px' };

const gridSection = { display: 'flex', gap: '2rem', marginBottom: '2rem' };

const boxStyle = { flex: 1, border: '1px solid #333' };
const boxHeader = { background: '#f0f0f0', borderBottom: '1px solid #333', padding: '0.4rem 0.8rem', fontWeight: 'bold', fontSize: '0.9rem' };
const boxContent = { padding: '1rem' };

const rowItem = { marginBottom: '0.4rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' };
const label = { color: '#666', marginRight: '1rem' };
const labelData = { fontSize: '0.9rem', marginBottom: '0.3rem' };

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' };
const thRow = { borderBottom: '1px solid #333' };
const th = { textAlign: 'left', padding: '0.5rem', background: '#f9f9f9' };
const thAlignRight = { textAlign: 'right', padding: '0.5rem', background: '#f9f9f9' };

const tr = { borderBottom: '1px solid #eee' };
const td = { padding: '0.5rem', verticalAlign: 'top' };
const tdAlignRight = { padding: '0.5rem', textAlign: 'right', verticalAlign: 'top' };

const smallAlloc = { fontSize: '0.75rem', color: '#666', marginTop: '2px', fontStyle: 'italic' };