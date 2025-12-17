// src/components/Client360Modal.jsx
import React, { useState, useEffect } from "react";
import { supabase, getNextRepayment, getLoanStatistics } from "../services/supabaseService";
import Loans360Modal from "./Loans360Modal";
import EditClientModal from "./EditClientModal";

// Helper to format phone for href
const formatPhoneLink = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9+]/g, '');
  return `tel:${cleaned}`;
};

export default function Client360Modal({ isOpen, onClose, clientId }) {
  const [client, setClient] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoan, setShowLoan] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (isOpen && clientId) {
      fetchClient();
      fetchLoans();
    }
  }, [isOpen, clientId]);

  const fetchClient = async () => {
    const { data } = await supabase.from('clients').select('*').eq('id', clientId).single();
    setClient(data);
  };

  const fetchLoans = async () => {
    setLoading(true);
    // Fetch loans
    const { data: loanData, error } = await supabase
      .from('loans')
      .select('*')
      .eq('client_id', clientId);

    if (error) {
      console.error("Error fetching loans:", error);
      setLoading(false);
      return;
    }

    // Fetch next repayment and stats for each loan
    const loansWithDetails = await Promise.all(
      (loanData || []).map(async (loan) => {
        const [nextRepaymentRes, statsRes] = await Promise.all([
          getNextRepayment(loan.id),
          getLoanStatistics(loan.id)
        ]);
        return {
          ...loan,
          nextRepayment: nextRepaymentRes.data,
          stats: statsRes.data || { totalPaymentsMade: 0, overdueAmount: 0 }
        };
      })
    );

    setLoans(loansWithDetails);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>

        {/* Header Actions */}
        <div style={headerActionsStyle}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={avatarPlaceholderStyle}>
              {client?.first_name?.charAt(0)}{client?.last_name?.charAt(0)}
            </div>
            <div>
              <h2 style={clientNameStyle}>{client?.first_name} {client?.last_name}</h2>
              <p style={clientCodeStyle}>{client?.client_code || 'No Code'}</p>
            </div>
          </div>
          <div>
            <button onClick={() => setShowEdit(true)} style={editBtnStyle}>Edit Client</button>
            <button onClick={onClose} style={closeBtnStyle}>×</button>
          </div>
        </div>

        {/* NEW CONTACT HEADER */}
        {!loading && (
          <div style={contactHeaderStyle}>
            {client?.email && (
              <span style={contactItemStyle}>
                📧 <a href={`mailto:${client.email}`} style={linkStyle}>{client.email}</a>
              </span>
            )}
            {client?.mobile_phone && (
              <span style={contactItemStyle}>
                📱 Mob: <a href={formatPhoneLink(client.mobile_phone)} style={linkStyle}>{client.mobile_phone}</a>
              </span>
            )}
            {client?.work_phone && (
              <span style={contactItemStyle}>
                🏢 Work: <a href={formatPhoneLink(client.work_phone)} style={linkStyle}>{client.work_phone}</a>
              </span>
            )}
            {client?.home_phone && (
              <span style={contactItemStyle}>
                🏠 Home: <a href={formatPhoneLink(client.home_phone)} style={linkStyle}>{client.home_phone}</a>
              </span>
            )}
          </div>
        )}

        {loading ? <p style={{ padding: '2rem', textAlign: 'center' }}>Loading Client Details...</p> : (
          <div style={contentContainerStyle}>

            {/* TOP SECTION: Contact & Details */}
            <div style={topSectionStyle}>

              {/* LEFT CARD: Contact Info */}
              <div style={{ flex: 1, paddingRight: '2rem', borderRight: '1px solid #eee' }}>
                <h4 style={sectionTitleStyle}>Contact Info</h4>
                <InfoRow label="Company Name" value={client?.company_name} />
                <div style={dividerStyle}></div>
                <InfoRow label="Address" value={client?.address} />
                <InfoRow label="City" value={client?.city} />
                <InfoRow label="Region" value={client?.region} />
                <InfoRow label="Postcode" value={client?.postal_code} />
                <div style={dividerStyle}></div>
                <InfoRow label="Employment Status" value={client?.employment_status} />
                <InfoRow label="Status" value={client?.status} />
              </div>

              {/* RIGHT CARD: Client Details */}
              <div style={{ flex: 1, paddingLeft: '2rem' }}>
                <h4 style={sectionTitleStyle}>Client Details</h4>
                <InfoRow label="Client Type" value={client?.client_type} />
                <InfoRow label="Date of Birth" value={formatDate(client?.date_of_birth)} />
                <InfoRow label="Gender" value={client?.gender} />
                <InfoRow label="Occupation" value={client?.occupation} />
                <div style={dividerStyle}></div>
                <InfoRow label="ID Type" value={client?.id_type} />
                <InfoRow label="ID Number" value={client?.id_number} />
                <div style={dividerStyle}></div>
                <InfoRow label="Monthly Income" value={client?.monthly_income ? `$${formatMoney(client.monthly_income)}` : '-'} />
                <InfoRow label="Credit Rating" value={client?.credit_rating} />
              </div>

            </div>

            {/* BOTTOM SECTION: Loans */}
            <div style={loansSectionStyle}>
              <h3 style={loansTitleStyle}>Active Loans & History</h3>
              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={headerRowStyle}>
                      <th style={thStyle}>Loan #</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Source</th>
                      <th style={thStyle}>Start Date</th>
                      <th style={thStyle}>Maturity Date</th>
                      <th style={thStyle}>Balance</th>
                      <th style={thStyle}>Outstanding</th>
                      <th style={thStyle}>Payments Made</th>
                      <th style={thStyle}>Overdue</th>
                      <th style={thStyle}>Next Due</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map(loan => (
                      <tr key={loan.id} onClick={() => { setSelectedLoan(loan); setShowLoan(true); }} style={rowStyle}>
                        <td style={tdStyle}>{loan.loan_number}</td>
                        <td style={tdStyle}>{loan.loan_type || '-'}</td>
                        <td style={tdStyle}>{loan.source || '-'}</td>
                        <td style={tdStyle}>{formatDate(loan.start_date || loan.created_at)}</td>
                        <td style={tdStyle}>{formatDate(loan.end_date)}</td>
                        <td style={{ ...tdStyle, fontWeight: 'bold' }}>${formatMoney(loan.current_balance)}</td>
                        <td style={tdStyle}>${formatMoney(loan.principal_outstanding)}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{loan.stats?.totalPaymentsMade || 0}</td>
                        <td style={{ ...tdStyle, color: (loan.stats?.overdueAmount > 0) ? '#d32f2f' : 'inherit', fontWeight: (loan.stats?.overdueAmount > 0) ? 'bold' : 'normal' }}>
                          ${formatMoney(loan.stats?.overdueAmount)}
                        </td>
                        <td style={tdStyle}>
                          {loan.nextRepayment ? (
                            <div>
                              <div>{formatDate(loan.nextRepayment.due_date)}</div>
                              <div style={{ fontSize: '0.8em', color: '#666' }}>${formatMoney(loan.nextRepayment.amount_due)}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td style={tdStyle}>
                          <StatusBadge status={loan.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>

      {showLoan && <Loans360Modal loan={selectedLoan} onClose={() => setShowLoan(false)} />}
      {showEdit && <EditClientModal client={client} onClose={() => setShowEdit(false)} onSave={setClient} />}
    </div>
  );
}

// Helper Components & Functions
const InfoRow = ({ label, value }) => (
  <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ color: '#666', fontSize: '0.9rem' }}>{label}:</span>
    <span style={{ fontWeight: 500, fontSize: '0.9rem', textAlign: 'right' }}>{value || '-'}</span>
  </div>
);

const StatusBadge = ({ status }) => {
  const isGood = status === 'active' || status === 'paid';
  return (
    <span style={{
      padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600, textTransform: 'capitalize',
      backgroundColor: isGood ? "#d4edda" : "#f8d7da",
      color: isGood ? "#155724" : "#721c24"
    }}>
      {status}
    </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatMoney = (amount) => {
  return (amount || 0).toFixed(2);
};

// Styles
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' };
const modalStyle = { background: '#f8f9fa', borderRadius: '0.75rem', width: '95%', maxWidth: '1400px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const headerActionsStyle = { padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #eee' };
const editBtnStyle = { background: '#0176d3', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', marginRight: '1rem', cursor: 'pointer', fontWeight: 500 };
const closeBtnStyle = { background: 'none', border: 'none', fontSize: '2rem', lineHeight: '1rem', cursor: 'pointer', color: '#666' };

const contentContainerStyle = { padding: '2rem', overflowY: 'auto', height: '100%' };

const topSectionStyle = {
  display: 'flex',
  background: '#fff',
  padding: '2rem',
  borderRadius: '0.5rem',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  marginBottom: '2rem',
  gap: '2rem'
};

const avatarPlaceholderStyle = { width: '50px', height: '50px', background: '#0176d3', color: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginRight: '1rem' };
const clientNameStyle = { margin: 0, color: '#1a1a1a', fontSize: '1.2rem' };
const clientCodeStyle = { margin: 0, color: '#666', fontSize: '0.9rem' };
const sectionTitleStyle = { color: '#0176d3', borderBottom: '2px solid #0176d3', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: 0 };

const loansSectionStyle = {};
const loansTitleStyle = { margin: '0 0 1rem', color: '#1a1a1a', fontSize: '1.2rem' };
const tableContainerStyle = { background: '#fff', borderRadius: '0.5rem', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const headerRowStyle = { background: '#f1f3f5', borderBottom: '2px solid #dee2e6' };
const thStyle = { padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#495057', whiteSpace: 'nowrap' };
const rowStyle = { borderBottom: '1px solid #eee', cursor: 'pointer', transition: 'background 0.2s' };
const tdStyle = { padding: '1rem', color: '#212529', verticalAlign: 'middle' };

// New Styles for Contact Header
const contactHeaderStyle = { padding: '0.5rem 2rem', background: '#f8f9fa', borderBottom: '1px solid #eee', display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#555' };
const contactItemStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem' };
const linkStyle = { color: '#0176d3', textDecoration: 'none' };
const dividerStyle = { height: '1px', background: '#eee', margin: '1rem 0' };