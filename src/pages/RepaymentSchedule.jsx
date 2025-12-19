import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseService';
import Client360Modal from '../components/Client360Modal';

export default function RepaymentSchedule() {
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, paid
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRepayments();
  }, []);

  const fetchRepayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('repayment_schedule')
        .select('*, loans(id, loan_number, clients(id, first_name, last_name))')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setRepayments(data || []);
    } catch (err) {
      console.error('Error fetching repayments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRepayments = repayments.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = 
      r.loans?.loan_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${r.loans?.clients?.first_name} ${r.loans?.clients?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleMarkPaid = async (id) => {
    try {
      const { error } = await supabase
        .from('repayment_schedule')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      fetchRepayments();
    } catch (err) {
      console.error('Error updating repayment:', err);
    }
  };

  const styles = {
    container: {
      backgroundColor: '#f8f9fa',
      padding: '2rem',
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '2rem',
    },
    title: {
      fontSize: '1.8rem',
      color: '#0176d3',
      marginBottom: '1.5rem',
      fontWeight: 600,
    },
    controlsContainer: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
    },
    searchInput: {
      flex: 1,
      minWidth: '200px',
      padding: '0.75rem',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '0.95rem',
    },
    filterSelect: {
      padding: '0.75rem',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '0.95rem',
      backgroundColor: '#fff',
      cursor: 'pointer',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    thead: {
      backgroundColor: '#f3f2f2',
      borderBottom: '2px solid #0176d3',
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
    statusBadge: {
      padding: '0.4rem 0.8rem',
      borderRadius: '6px',
      fontSize: '0.8rem',
      fontWeight: 600,
      textTransform: 'uppercase',
    },
    pendingBadge: {
      backgroundColor: '#fff3e0',
      color: '#e65100',
    },
    paidBadge: {
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
    },
    actionBtn: {
      padding: '0.4rem 0.8rem',
      backgroundColor: '#0176d3',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: 500,
    },
    clientLink: {
      color: '#0176d3',
      background: 'none',
      border: 'none',
      textDecoration: 'underline',
      cursor: 'pointer',
      fontSize: '0.95rem',
    },
    emptyState: {
      textAlign: 'center',
      padding: '3rem',
      color: '#706e6b',
    },
    loadingState: {
      textAlign: 'center',
      padding: '2rem',
      color: '#706e6b',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loadingState}>Loading repayment schedule...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📅 Repayment Schedule</h1>

        <div style={styles.controlsContainer}>
          <input
            type="text"
            placeholder="Search by loan number or client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {filteredRepayments.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No repayment schedules found</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Loan #</th>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Due Date</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Principal</th>
                <th style={styles.th}>Interest</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRepayments.map(r => (
                <tr key={r.id}>
                  <td style={styles.td}>
                    <strong>{r.loans?.loan_number || 'N/A'}</strong>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => {
                        setSelectedClientId(r.loans?.clients?.id);
                        setShowClientModal(true);
                      }}
                      style={styles.clientLink}
                    >
                      {r.loans?.clients?.first_name} {r.loans?.clients?.last_name}
                    </button>
                  </td>
                  <td style={styles.td}>
                    {new Date(r.due_date).toLocaleDateString('en-NZ')}
                  </td>
                  <td style={styles.td}>${r.amount?.toFixed(2)}</td>
                  <td style={styles.td}>${r.principal?.toFixed(2) || '0.00'}</td>
                  <td style={styles.td}>${r.interest?.toFixed(2) || '0.00'}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(r.status === 'pending' ? styles.pendingBadge : styles.paidBadge),
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {r.status === 'pending' && (
                      <button
                        onClick={() => handleMarkPaid(r.id)}
                        style={styles.actionBtn}
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showClientModal && selectedClientId && (
        <Client360Modal
          isOpen={showClientModal}
          onClose={() => setShowClientModal(false)}
          clientId={selectedClientId}
        />
      )}
    </div>
  );
}