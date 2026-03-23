
import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';

export default function CustomFeeModal({ loans = [], initialLoanId = '', onClose, onFeeAdded }) {
    const [selectedLoanId, setSelectedLoanId] = useState(initialLoanId);
    const [feeType, setFeeType] = useState('adhoc');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const feeTypes = [
        { value: 'adhoc', label: 'Ad-hoc / Custom' },
        { value: 'legal', label: 'Legal Fee' },
        { value: 'inspection', label: 'Inspection Fee' },
        { value: 'admin', label: 'Admin Adjustment' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedLoanId) {
            setError("Please select a loan.");
            return;
        }
        if (!amount || !description) {
            setError("Amount and Description are required.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const feeAmount = parseFloat(amount);
            const loan = loans.find(l => l.id === selectedLoanId);

            const { error: feeError } = await supabase
                .from('fee_applications')
                .insert({
                    loan_id: selectedLoanId,
                    client_id: loan?.client_id || null,
                    fee_type: feeType,
                    amount: feeAmount,
                    status: 'pending',
                    description: description
                });

            if (feeError) throw feeError;

            const { error: txnError } = await supabase
                .from('transactions')
                .insert({
                    loan_id: selectedLoanId,
                    txn_type: 'CFEE',
                    amount: feeAmount,
                    txn_date: new Date().toISOString().split('T')[0],
                    notes: `Custom Fee: ${feeType} - ${description}`,
                    source: 'manual',
                    processing_status: 'processed'
                });

            if (txnError) throw txnError;

            onFeeAdded();
            onClose();

        } catch (err) {
            console.error("Add fee failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <h3 style={titleStyle}>Add Custom Fee</h3>
                <form onSubmit={handleSubmit}>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Loan *</label>
                        <select
                            style={inputStyle}
                            value={selectedLoanId}
                            onChange={e => setSelectedLoanId(e.target.value)}
                        >
                            <option value="">Select a loan...</option>
                            {loans.map(loan => (
                                <option key={loan.id} value={loan.id}>
                                    {loan.loan_number} — {loan.clients?.first_name} {loan.clients?.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Fee Type</label>
                        <select
                            style={inputStyle}
                            value={feeType}
                            onChange={e => setFeeType(e.target.value)}
                        >
                            {feeTypes.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                        </select>
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Amount ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            style={inputStyle}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Description / Reason</label>
                        <textarea
                            style={textareaStyle}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Reason for fee..."
                        />
                    </div>

                    {error && <div style={errorStyle}>{error}</div>}

                    <div style={actionsStyle}>
                        <button type="button" onClick={onClose} style={cancelBtnStyle} disabled={loading}>Cancel</button>
                        <button type="submit" style={confirmBtnStyle} disabled={loading}>
                            {loading ? 'Adding...' : 'Add Fee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 };
const modalStyle = { background: '#fff', padding: '2rem', borderRadius: '8px', width: '440px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' };
const titleStyle = { marginTop: 0, color: '#0176d3' };
const formGroupStyle = { marginBottom: '1rem' };
const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: 500 };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' };
const textareaStyle = { width: '100%', height: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' };
const actionsStyle = { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' };
const cancelBtnStyle = { padding: '0.5rem 1rem', background: '#e9ecef', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const confirmBtnStyle = { padding: '0.5rem 1rem', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const errorStyle = { color: '#d32f2f', marginBottom: '1rem', fontSize: '0.9rem' };
