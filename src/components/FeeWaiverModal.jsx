import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';

export default function CreateLoanWaiverModal({ onClose, onWaiverCreated }) {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [activeLoan, setActiveLoan] = useState(null);
  const [noActiveLoan, setNoActiveLoan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    waiverType: 'Partial Waiver',
    reason: 'Customer Hardship',
    principalToWaive: 0,
    interestToWaive: 0,
    feesToWaive: 0,
  });

  // Fetch all clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  // When client is selected, fetch their active loan
  useEffect(() => {
    if (selectedClientId) {
      fetchActiveLoan(selectedClientId);
    } else {
      setActiveLoan(null);
      setNoActiveLoan(false);
    }
  }, [selectedClientId]);

  const fetchActiveLoan = async (clientId) => {
    console.log('[FeeWaiverModal] fetchActiveLoan called with clientId:', clientId);
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('id, loan_number, current_outstanding_balance, status')
        .eq('client_id', clientId)
        .filter('status', 'ilike', '%active%')
        .single(); // Assuming only one active loan per client

      console.log('[FeeWaiverModal] query result:', { data, error });

      if (error && error.code === 'PGRST116') {
        // No rows returned
        setActiveLoan(null);
        setNoActiveLoan(true);
      } else if (error) {
        throw error;
      } else {
        setActiveLoan(data);
        setNoActiveLoan(false);
      }
    } catch (err) {
      console.error('Error fetching active loan:', err);
      setActiveLoan(null);
      setNoActiveLoan(true);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClientId || !activeLoan) {
      setError('Please select a client with an active loan');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Reason for waiver is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const approvedBy = user?.email || 'system_user';

      // Create waiver record
      const { error: waiverError } = await supabase
        .from('loan_waivers')
        .insert({
          loan_id: activeLoan.id,
          client_id: selectedClientId,
          waiver_type: formData.waiverType,
          principal_waived: parseFloat(formData.principalToWaive) || 0,
          interest_waived: parseFloat(formData.interestToWaive) || 0,
          fees_waived: parseFloat(formData.feesToWaive) || 0,
          reason: formData.reason,
          status: 'pending',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        });

      if (waiverError) throw waiverError;

      alert('Loan waiver created successfully!');
      onWaiverCreated?.();
      onClose();
    } catch (err) {
      console.error('Error creating waiver:', err);
      setError(err.message || 'Failed to create waiver');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    },
    modal: {
      background: '#fff',
      borderRadius: '8px',
      width: '95%',
      maxWidth: '500px',
      padding: '2rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    },
    header: {
      marginTop: 0,
      marginBottom: '1.5rem',
      color: '#0176d3',
      fontSize: '1.3rem',
      fontWeight: 600,
    },
    formGroup: {
      marginBottom: '1rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 600,
      color: '#181818',
      fontSize: '0.9rem',
    },
    required: {
      color: 'red',
      marginLeft: '0.25rem',
    },
    input: {
      width: '100%',
      padding: '0.7rem',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '0.9rem',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
    },
    select: {
      width: '100%',
      padding: '0.7rem',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '0.9rem',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      backgroundColor: '#fff',
      cursor: 'pointer',
    },
    infoBox: {
      background: '#f0f7ff',
      padding: '1rem',
      borderRadius: '4px',
      border: '1px solid #0176d3',
      marginBottom: '1rem',
      fontSize: '0.9rem',
    },
    errorMessage: {
      background: '#fdeded',
      color: '#5f2120',
      padding: '0.75rem',
      borderRadius: '4px',
      marginBottom: '1rem',
      fontSize: '0.9rem',
      border: '1px solid #f5c6cb',
    },
    noActiveLoanMessage: {
      background: '#fff3cd',
      color: '#856404',
      padding: '0.75rem',
      borderRadius: '4px',
      marginBottom: '1rem',
      fontSize: '0.9rem',
      border: '1px solid #ffeaa7',
    },
    amountsRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '1rem',
      marginBottom: '1rem',
    },
    amountInput: {
      width: '100%',
      padding: '0.7rem',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '0.9rem',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
    },
    amountLabel: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 500,
      color: '#666',
      fontSize: '0.8rem',
    },
    footer: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'flex-end',
      marginTop: '1.5rem',
      paddingTop: '1rem',
      borderTop: '1px solid #eee',
    },
    cancelBtn: {
      padding: '0.75rem 1.5rem',
      background: '#e9ecef',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 500,
      fontSize: '0.9rem',
    },
    submitBtn: {
      padding: '0.75rem 1.5rem',
      background: '#28a745',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '0.9rem',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.header}>Create Loan Waiver</h2>

        {error && <div style={styles.errorMessage}>{error}</div>}

        {/* Client Select */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Select Client <span style={styles.required}>*</span>
          </label>
          <select
            style={styles.select}
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            disabled={loading}
          >
            <option value="">Choose a client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.first_name} {client.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* Active Loan Display */}
        {selectedClientId && (
          <>
            {noActiveLoan ? (
              <div style={styles.noActiveLoanMessage}>
                ⚠️ No active loans for this client
              </div>
            ) : activeLoan ? (
              <div style={styles.infoBox}>
                <strong>Active Loan:</strong> {activeLoan.loan_number} - ${activeLoan.current_outstanding_balance?.toFixed(2)}
              </div>
            ) : null}
          </>
        )}

        {/* Only show form if there's an active loan */}
        {activeLoan && (
          <>
            {/* Waiver Type */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Waiver Type <span style={styles.required}>*</span>
              </label>
              <select
                style={styles.select}
                value={formData.waiverType}
                onChange={(e) => setFormData({ ...formData, waiverType: e.target.value })}
                disabled={loading}
              >
                <option value="Partial Waiver">Partial Waiver</option>
                <option value="Full Waiver">Full Waiver</option>
                <option value="Adjustment">Adjustment</option>
              </select>
            </div>

            {/* Reason */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Reason for Waiver <span style={styles.required}>*</span>
              </label>
              <select
                style={styles.select}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                disabled={loading}
              >
                <option value="Customer Hardship">Customer Hardship</option>
                <option value="Administrative Error">Administrative Error</option>
                <option value="System Correction">System Correction</option>
                <option value="Special Approval">Special Approval</option>
              </select>
            </div>

            {/* Amounts to Waive */}
            <div style={styles.formGroup}>
              <div style={styles.amountsRow}>
                <div>
                  <label style={styles.amountLabel}>Principal to Waive</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.principalToWaive}
                    onChange={(e) => setFormData({ ...formData, principalToWaive: e.target.value })}
                    style={styles.amountInput}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label style={styles.amountLabel}>Interest to Waive</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.interestToWaive}
                    onChange={(e) => setFormData({ ...formData, interestToWaive: e.target.value })}
                    style={styles.amountInput}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label style={styles.amountLabel}>Fees to Waive</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.feesToWaive}
                    onChange={(e) => setFormData({ ...formData, feesToWaive: e.target.value })}
                    style={styles.amountInput}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn} disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={styles.submitBtn}
            disabled={loading || !activeLoan}
          >
            {loading ? 'Creating...' : 'Create Waiver'}
          </button>
        </div>
      </div>
    </div>
  );
}