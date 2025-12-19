import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';

export default function LoanWaiversDashboard() {
  // State Management
  const [activeTab, setActiveTab] = useState('pending');
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);
  const [waivers, setWaivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedWaiver, setSelectedWaiver] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    waiver_type: 'partial',
    waiver_reason: 'hardship',
    custom_reason: '',
    principal_waived: 0,
    interest_waived: 0,
    fees_waived: 0,
    new_term_months: null,
    settlement_amount: null,
  });

  // Stats
  const [stats, setStats] = useState({
    pendingCount: 0,
    totalPending: 0,
    approvedCount: 0,
    executedCount: 0,
  });

  // Fetch data
  useEffect(() => {
    fetchData();
    fetchClients();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: loansData } = await supabase
        .from('loans')
        .select(`id, loan_number, client_id, status, annual_interest_rate, clients(first_name, last_name, client_code), loan_balances(current_outstanding_balance, principal_outstanding, outstanding_interest, outstanding_fees)`)
        .eq('status', 'active')
        .order('loan_number');

      setLoans(loansData || []);

      const { data: waiversData } = await supabase
        .from('loan_waivers')
        .select('*')
        .order('created_at', { ascending: false });

      setWaivers(waiversData || []);

      if (waiversData) {
        const pending = waiversData.filter(w => w.status === 'pending');
        const approved = waiversData.filter(w => w.status === 'approved');
        const executed = waiversData.filter(w => w.status === 'executed');

        setStats({
          pendingCount: pending.length,
          totalPending: pending.reduce((sum, w) => sum + (w.total_amount_waived || 0), 0),
          approvedCount: approved.length,
          executedCount: executed.length,
        });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .order('first_name');
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const handleCreateWaiver = async () => {
    // Find the active loan for the selected client
    const clientLoan = loans.find(l => l.client_id === selectedClient);
    
    if (!selectedClient || !clientLoan) {
      alert('Please select a client with an active loan');
      return;
    }

    try {
      const response = await fetch(
        `${supabase.url}/functions/v1/create-loan-waiver`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loan_id: clientLoan.id,
            waiver_type: formData.waiver_type,
            waiver_reason: formData.waiver_reason,
            custom_reason: formData.custom_reason,
            principal_waived: parseFloat(formData.principal_waived) || 0,
            interest_waived: parseFloat(formData.interest_waived) || 0,
            fees_waived: parseFloat(formData.fees_waived) || 0,
            new_term_months: formData.new_term_months ? parseInt(formData.new_term_months) : null,
            settlement_amount: formData.settlement_amount ? parseFloat(formData.settlement_amount) : null,
            created_by: 'admin@example.com',
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Waiver created successfully!');
        setShowCreateModal(false);
        setSelectedClient('');
        setFormData({
          waiver_type: 'partial',
          waiver_reason: 'hardship',
          custom_reason: '',
          principal_waived: 0,
          interest_waived: 0,
          fees_waived: 0,
          new_term_months: null,
          settlement_amount: null,
        });
        fetchData();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error('Error creating waiver:', err);
      alert('Failed to create waiver');
    }
  };

  const handleApproveWaiver = async () => {
    if (!selectedWaiver) return;

    try {
      const response = await fetch(
        `${supabase.url}/functions/v1/approve-loan-waiver`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loan_waiver_id: selectedWaiver.id,
            approval_notes: selectedWaiver.approval_notes || '',
            approved_by: 'admin@example.com',
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Waiver approved successfully!');
        setShowApprovalModal(false);
        fetchData();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error('Error approving waiver:', err);
      alert('Failed to approve waiver');
    }
  };

  const handleApplyWaiver = async () => {
    if (!selectedWaiver) return;

    try {
      const response = await fetch(
        `${supabase.url}/functions/v1/apply-loan-waiver`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loan_waiver_id: selectedWaiver.id,
            executed_by: 'admin@example.com',
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Waiver applied successfully!');
        setShowApplyModal(false);
        fetchData();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error('Error applying waiver:', err);
      alert('Failed to apply waiver');
    }
  };

  const filteredWaivers = waivers.filter(w => {
    if (activeTab === 'pending') return w.status === 'pending';
    if (activeTab === 'approved') return w.status === 'approved';
    if (activeTab === 'executed') return w.status === 'executed';
    return true;
  });

  // Styles
  const styles = {
    container: {
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      padding: '2rem',
    },
    header: {
      backgroundColor: '#0176d3',
      color: 'white',
      padding: '2rem',
      borderRadius: '8px',
      marginBottom: '2rem',
      boxShadow: '0 4px 12px rgba(1, 118, 211, 0.15)',
    },
    headerTitle: {
      fontSize: '2rem',
      fontWeight: 600,
      margin: 0,
      color: 'white',
    },
    headerSubtitle: {
      fontSize: '0.95rem',
      opacity: 0.9,
      marginTop: '0.5rem',
      color: 'white',
    },
    statsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginTop: '1.5rem',
    },
    statCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    statNumber: {
      fontSize: '2rem',
      fontWeight: 700,
      color: 'white',
    },
    statLabel: {
      fontSize: '0.9rem',
      opacity: 0.9,
      marginTop: '0.5rem',
      color: 'white',
    },
    controlsContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      gap: '1rem',
      flexWrap: 'wrap',
    },
    searchInput: {
      padding: '0.75rem 1rem',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      width: '300px',
      fontSize: '0.95rem',
    },
    btnPrimary: {
      backgroundColor: '#0176d3',
      color: 'white',
      padding: '0.75rem 1.5rem',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 500,
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(1, 118, 211, 0.2)',
    },
    tabsContainer: {
      display: 'flex',
      borderBottom: '2px solid #e0e0e0',
      marginBottom: '2rem',
      gap: 0,
    },
    tab: {
      padding: '1rem 1.5rem',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontWeight: 500,
      color: '#706e6b',
      borderBottom: '3px solid transparent',
      transition: 'all 0.3s ease',
    },
    tabActive: {
      color: '#0176d3',
      borderBottomColor: '#0176d3',
    },
    tableContainer: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.95rem',
    },
    thead: {
      backgroundColor: '#f3f2f2',
      borderBottom: '2px solid #e0e0e0',
    },
    th: {
      padding: '1rem',
      textAlign: 'left',
      fontWeight: 600,
      color: '#181818',
    },
    td: {
      padding: '1rem',
      borderBottom: '1px solid #f0f0f0',
      color: '#181818',
    },
    badge: {
      display: 'inline-block',
      padding: '0.4rem 0.8rem',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: 600,
      textTransform: 'uppercase',
    },
    badgePending: {
      backgroundColor: '#fff3e0',
      color: '#e65100',
    },
    badgeApproved: {
      backgroundColor: '#e3f2fd',
      color: '#0d47a1',
    },
    badgeExecuted: {
      backgroundColor: '#e8f5e9',
      color: '#1b5e20',
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '12px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    },
    modalTitle: {
      fontSize: '1.5rem',
      fontWeight: 600,
      marginBottom: '1.5rem',
      color: '#181818',
    },
    formGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 500,
      color: '#181818',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      fontSize: '0.95rem',
      boxSizing: 'border-box',
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      fontSize: '0.95rem',
      boxSizing: 'border-box',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem',
      marginTop: '2rem',
    },
    btnSuccess: {
      backgroundColor: '#28a745',
      color: 'white',
      padding: '0.75rem 1.5rem',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 500,
    },
    btnDanger: {
      backgroundColor: '#dc3545',
      color: 'white',
      padding: '0.75rem 1.5rem',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 500,
    },
    btnSecondary: {
      backgroundColor: '#e9ecef',
      color: '#181818',
      padding: '0.75rem 1.5rem',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 500,
    },
    btnSm: {
      backgroundColor: 'transparent',
      color: '#0176d3',
      border: '1px solid #e0e0e0',
      padding: '0.4rem 0.8rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      fontWeight: 500,
      transition: 'all 0.3s ease',
    },
    actionCell: {
      display: 'flex',
      gap: '0.5rem',
    },
    emptyState: {
      textAlign: 'center',
      padding: '3rem',
      color: '#706e6b',
    },
    amountHighlight: {
      fontWeight: 600,
      color: '#0176d3',
      fontSize: '1.1rem',
    },
    infoBox: {
      backgroundColor: '#f0f7ff',
      padding: '1rem',
      borderRadius: '4px',
      marginBottom: '1rem',
      border: '1px solid #0176d3',
      fontSize: '0.9rem',
    },
    warningBox: {
      backgroundColor: '#fff3e0',
      color: '#e65100',
      padding: '0.75rem',
      borderRadius: '4px',
      marginBottom: '1rem',
      fontSize: '0.9rem',
      border: '1px solid #ffeaa7',
    },
  };

  const getStatusBadge = (status) => {
    const baseStyle = { ...styles.badge };
    if (status === 'pending') return { ...baseStyle, ...styles.badgePending };
    if (status === 'approved') return { ...baseStyle, ...styles.badgeApproved };
    if (status === 'executed') return { ...baseStyle, ...styles.badgeExecuted };
    return baseStyle;
  };

  if (loading) {
    return (
      <div style={{
        ...styles.container,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}>
        <div style={{ fontSize: '1.2rem', color: '#706e6b' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Loan Waivers &amp; Adjustments</h1>
        <p style={styles.headerSubtitle}>
          Manage loan waivers, approvals, and adjustments. Admin-only access.
        </p>

        {/* Stats */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.pendingCount}</div>
            <div style={styles.statLabel}>Pending Waivers</div>
            {stats.totalPending > 0 && (
              <div style={{ ...styles.statLabel, marginTop: '0.5rem', fontSize: '0.85rem' }}>
                Total: ${stats.totalPending.toFixed(2)}
              </div>
            )}
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.approvedCount}</div>
            <div style={styles.statLabel}>Approved (Pending Apply)</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.executedCount}</div>
            <div style={styles.statLabel}>Executed Waivers</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controlsContainer}>
        <input
          type="text"
          placeholder="Search by loan number or client..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          style={styles.btnPrimary}
          onClick={() => {
            setShowCreateModal(true);
            setSelectedClient('');
          }}
          onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 16px rgba(1, 118, 211, 0.3)'}
          onMouseLeave={(e) => e.target.style.boxShadow = '0 2px 8px rgba(1, 118, 211, 0.2)'}
        >
          + Create Waiver
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        {['pending', 'approved', 'executed'].map(tab => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({filteredWaivers.filter(w => w.status === tab).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        {filteredWaivers.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              No {activeTab} waivers found
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              {activeTab === 'pending'
                ? 'Create a new waiver to get started'
                : 'Check other tabs for waivers'}
            </div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Loan #</th>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWaivers.map(waiver => {
                const loan = loans.find(l => l.id === waiver.loan_id);
                const client = loan?.clients;
                return (
                  <tr
                    key={waiver.id}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <td style={styles.td}>
                      <strong>{loan?.loan_number || 'N/A'}</strong>
                    </td>
                    <td style={styles.td}>
                      {client?.first_name} {client?.last_name}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, backgroundColor: '#f0f7ff', color: '#0176d3' }}>
                        {waiver.waiver_type}
                      </span>
                    </td>
                    <td style={styles.td}>{waiver.waiver_reason}</td>
                    <td style={styles.td}>
                      <span style={styles.amountHighlight}>
                        ${waiver.total_amount_waived?.toFixed(2)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={getStatusBadge(waiver.status)}>
                        {waiver.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionCell}>
                        {waiver.status === 'pending' && (
                          <button
                            style={styles.btnSm}
                            onClick={() => {
                              setSelectedWaiver(waiver);
                              setShowApprovalModal(true);
                            }}
                            title="Approve this waiver"
                          >
                            Approve
                          </button>
                        )}
                        {waiver.status === 'approved' && (
                          <button
                            style={styles.btnSm}
                            onClick={() => {
                              setSelectedWaiver(waiver);
                              setShowApplyModal(true);
                            }}
                            title="Apply this waiver"
                          >
                            Apply
                          </button>
                        )}
                        {(waiver.status === 'pending' || waiver.status === 'approved') && (
                          <button
                            style={{ ...styles.btnSm, color: '#dc3545', borderColor: '#dc3545' }}
                            onClick={() => alert('Reject functionality coming soon')}
                            title="Reject this waiver"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE WAIVER MODAL */}
      {showCreateModal && (
        <div style={styles.modal} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Create Loan Waiver</h2>

            {/* Step 1: Select Client */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Client *</label>
              <select
                style={styles.select}
                value={selectedClient || ''}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="">Choose a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Display Active Loan */}
            {selectedClient && (
              <div>
                {loans.find(l => l.client_id === selectedClient) ? (
                  <div style={styles.infoBox}>
                    <strong>Active Loan:</strong> {loans.find(l => l.client_id === selectedClient)?.loan_number} - ${loans.find(l => l.client_id === selectedClient)?.loan_balances?.[0]?.current_outstanding_balance?.toFixed(2)}
                  </div>
                ) : (
                  <div style={styles.warningBox}>
                    ⚠️ No active loans for this client
                  </div>
                )}
              </div>
            )}

            {/* Only show form if there's an active loan */}
            {selectedClient && loans.find(l => l.client_id === selectedClient) && (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Waiver Type *</label>
                  <select
                    style={styles.select}
                    value={formData.waiver_type}
                    onChange={(e) => setFormData({ ...formData, waiver_type: e.target.value })}
                  >
                    <option value="partial">Partial Waiver</option>
                    <option value="full">Full Waiver</option>
                    <option value="settlement">Settlement</option>
                    <option value="reschedule">Reschedule</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Reason for Waiver *</label>
                  <select
                    style={styles.select}
                    value={formData.waiver_reason}
                    onChange={(e) => setFormData({ ...formData, waiver_reason: e.target.value })}
                  >
                    <option value="hardship">Customer Hardship</option>
                    <option value="settlement">Settlement Agreement</option>
                    <option value="recovery">Recovery Cost</option>
                    <option value="admin_error">Administrative Error</option>
                    <option value="policy_decision">Policy Decision</option>
                    <option value="other">Other (specify below)</option>
                  </select>
                </div>

                {formData.waiver_reason === 'other' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Please specify the reason</label>
                    <input
                      type="text"
                      style={styles.input}
                      placeholder="Enter custom reason..."
                      value={formData.custom_reason}
                      onChange={(e) => setFormData({ ...formData, custom_reason: e.target.value })}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Principal to Waive</label>
                    <input
                      type="number"
                      style={styles.input}
                      placeholder="0.00"
                      value={formData.principal_waived}
                      onChange={(e) =>
                        setFormData({ ...formData, principal_waived: e.target.value })
                      }
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Interest to Waive</label>
                    <input
                      type="number"
                      style={styles.input}
                      placeholder="0.00"
                      value={formData.interest_waived}
                      onChange={(e) =>
                        setFormData({ ...formData, interest_waived: e.target.value })
                      }
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Fees to Waive</label>
                    <input
                      type="number"
                      style={styles.input}
                      placeholder="0.00"
                      value={formData.fees_waived}
                      onChange={(e) => setFormData({ ...formData, fees_waived: e.target.value })}
                    />
                  </div>
                </div>

                {formData.waiver_type === 'reschedule' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>New Term (months)</label>
                    <input
                      type="number"
                      style={styles.input}
                      placeholder="Enter new term..."
                      value={formData.new_term_months || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, new_term_months: e.target.value })
                      }
                    />
                  </div>
                )}

                {formData.waiver_type === 'settlement' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Settlement Amount</label>
                    <input
                      type="number"
                      style={styles.input}
                      placeholder="Enter settlement amount..."
                      value={formData.settlement_amount || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, settlement_amount: e.target.value })
                      }
                    />
                  </div>
                )}
              </>
            )}

            <div style={styles.buttonGroup}>
              <button
                style={styles.btnSecondary}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.btnSuccess,
                  opacity: !selectedClient || !loans.find(l => l.client_id === selectedClient) ? 0.5 : 1,
                  cursor: !selectedClient || !loans.find(l => l.client_id === selectedClient) ? 'not-allowed' : 'pointer'
                }}
                onClick={handleCreateWaiver}
                disabled={!selectedClient || !loans.find(l => l.client_id === selectedClient)}
              >
                Create Waiver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL MODAL */}
      {showApprovalModal && selectedWaiver && (
        <div style={styles.modal} onClick={() => setShowApprovalModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Approve Waiver Request</h2>

            <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Amount to Waive:</strong> <span style={styles.amountHighlight}>${selectedWaiver.total_amount_waived?.toFixed(2)}</span>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Type:</strong> {selectedWaiver.waiver_type}
              </div>
              <div>
                <strong>Reason:</strong> {selectedWaiver.waiver_reason}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Approval Notes (Optional)</label>
              <textarea
                style={{ ...styles.input, minHeight: '100px' }}
                placeholder="Add any notes for approval..."
                onChange={(e) =>
                  setSelectedWaiver({ ...selectedWaiver, approval_notes: e.target.value })
                }
              />
            </div>

            <div style={styles.buttonGroup}>
              <button
                style={styles.btnSecondary}
                onClick={() => setShowApprovalModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.btnSuccess}
                onClick={handleApproveWaiver}
              >
                Approve Waiver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPLY MODAL */}
      {showApplyModal && selectedWaiver && (
        <div style={styles.modal} onClick={() => setShowApplyModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Apply Waiver to Loan</h2>

            <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0' }}>
                <strong>Waiver Summary:</strong>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                Principal: ${selectedWaiver.principal_waived?.toFixed(2)}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                Interest: ${selectedWaiver.interest_waived?.toFixed(2)}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                Fees: ${selectedWaiver.fees_waived?.toFixed(2)}
              </div>
              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e0e0e0' }}>
                <strong>Total Waived: <span style={styles.amountHighlight}>${selectedWaiver.total_amount_waived?.toFixed(2)}</span></strong>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff3e0', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid #e65100' }}>
              <div style={{ fontWeight: 600, color: '#e65100', marginBottom: '0.5rem' }}>⚠️ Warning</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                This action will immediately apply the waiver and update the loan balance. This cannot be undone.
              </div>
            </div>

            <div style={styles.buttonGroup}>
              <button
                style={styles.btnSecondary}
                onClick={() => setShowApplyModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.btnDanger}
                onClick={handleApplyWaiver}
              >
                Apply Waiver Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}