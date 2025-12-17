
import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';

export default function FeeWaiverModal({ fee, onClose, onFeeWaived }) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!fee) return null;

    const handleConfirm = async () => {
        if (!reason.trim()) {
            setError("Waiver reason is required.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Get current user (Waived By)
            const { data: { user } } = await supabase.auth.getUser();
            const waivedBy = user?.email || 'system_user'; // Fallback if no auth context yet

            // 2. Insert Audit Record
            const { error: auditError } = await supabase
                .from('fee_waiver_audit')
                .insert({
                    fee_application_id: fee.id,
                    waived_amount: fee.amount,
                    waive_reason: reason,
                    waived_by: waivedBy,
                    waived_at: new Date().toISOString()
                });

            if (auditError) throw auditError;

            // 3. Update Fee Application
            const { error: updateError } = await supabase
                .from('fee_applications')
                .update({
                    status: 'waived',
                    // waived_by: waivedBy, // If column exists in fee_applications? Handoff implies only audit trail has it, or fee_applications might have it. 
                    // Handoff V3 Requirement: "UPDATE fee_applications (status='waived', waived_by, waive_reason)"
                    // I'll assume columns exist. If not, audit table is the source of truth.
                    // Let's safe bet: update status. If error on unknown column, we might need to adjust.
                    // Given the schema isn't fully visible, I'll update status first. 
                    // Wait, Handoff explicitly says "UPDATE fee_applications (status='waived', waived_by, waive_reason)". Trust the doc.
                })
                .eq('id', fee.id);

            // Check if update failed due to column missing? 
            // Better to fetch current user and such. 
            // To be safe against schema mismatch, I'll try just status first if I'm unsure, but doc says to update them.
            // I'll execute what doc says.

            // Re-execute update with fields:
            const { error: finalUpdateError } = await supabase.from('fee_applications').update({
                status: 'waived',
                waived_by: waivedBy,
                waive_reason: reason
            }).eq('id', fee.id);

            if (finalUpdateError) throw finalUpdateError;

            // 4. Update Balance?
            // "Fee tracking via fee_applications ONLY". 
            // Waiving a fee means it's no longer 'pending' or 'owing'.
            // Does it affect `loan_balances`?
            // If `unpaid_fees` tracked the sum of pending fees, then yes we should decrease it.
            // But V4 says: "Initialize unpaid_fees = 0... Payment allocation reads from fee_applications".
            // So `loan_balances.unpaid_fees` might NOT be used or is 0.
            // If it IS used, we would decrease it. 
            // Safest: Check if `unpaid_fees` > 0 on balance, if yes, deduct. 
            // BUT strict V4: "Use fee_applications ONLY".
            // So we do NOT touch loan_balances.

            onFeeWaived();
            onClose();

        } catch (err) {
            console.error("Waiver failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <h3 style={titleStyle}>Waive Fee</h3>

                <div style={detailsStyle}>
                    <p><strong>Fee Type:</strong> {fee.fee_type}</p>
                    <p><strong>Amount:</strong> ${fee.amount?.toFixed(2)}</p>
                    <p><strong>Date Created:</strong> {new Date(fee.created_at).toLocaleDateString()}</p>
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Reason for Waiver (Required):</label>
                    <textarea
                        style={textareaStyle}
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="e.g. Customer hardship, Administrative error..."
                    />
                </div>

                {error && <div style={errorStyle}>{error}</div>}

                <div style={actionsStyle}>
                    <button onClick={onClose} style={cancelBtnStyle} disabled={loading}>Cancel</button>
                    <button onClick={handleConfirm} style={confirmBtnStyle} disabled={loading}>
                        {loading ? 'Processing...' : 'Confirm Waiver'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Styles
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 };
const modalStyle = { background: '#fff', padding: '2rem', borderRadius: '8px', width: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' };
const titleStyle = { marginTop: 0, color: '#d32f2f' };
const detailsStyle = { background: '#f8f9fa', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' };
const formGroupStyle = { marginBottom: '1rem' };
const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: 500 };
const textareaStyle = { width: '100%', height: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da', fontFamily: 'inherit' };
const actionsStyle = { display: 'flex', justifyContent: 'flex-end', gap: '1rem' };
const cancelBtnStyle = { padding: '0.5rem 1rem', background: '#e9ecef', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const confirmBtnStyle = { padding: '0.5rem 1rem', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const errorStyle = { color: '#d32f2f', marginBottom: '1rem', fontSize: '0.9rem' };
