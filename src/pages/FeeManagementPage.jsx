
import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseService";
import FeeWaiverModal from "../components/FeeWaiverModal";
import CustomFeeModal from "../components/CustomFeeModal";

export default function FeeManagementPage() {
    const [loans, setLoans] = useState([]);
    const [selectedLoanId, setSelectedLoanId] = useState('all');

    // Tabs: 'pending', 'history', 'audit'
    const [activeTab, setActiveTab] = useState('pending');

    const [feeData, setFeeData] = useState([]);
    const [auditData, setAuditData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null); // For Waiver

    const [customFeeModalOpen, setCustomFeeModalOpen] = useState(false);

    useEffect(() => {
        fetchLoans();
        fetchFees();
    }, [activeTab, selectedLoanId]);

    const fetchLoans = async () => {
        const { data } = await supabase.from('loans').select('id, loan_number, client_id, clients(first_name, last_name)').order('loan_number');
        if (data) setLoans(data);
    };

    const fetchFees = async () => {
        setLoading(true);
        try {
            if (activeTab === 'audit') {
                // Fetch Waivers
                let query = supabase.from('fee_waiver_audit').select('*, fee_applications(loan_id, fee_type, description, loans(loan_number))').order('waived_at', { ascending: false });

                const { data, error } = await query;
                if (error) throw error;

                let filtered = data;
                if (selectedLoanId !== 'all') {
                    filtered = data.filter(item => item.fee_applications?.loan_id === selectedLoanId);
                }
                setAuditData(filtered);

            } else {
                // Fetch Fee Applications
                let query = supabase.from('fee_applications').select('*, loans(loan_number)').order('created_at', { ascending: false });

                if (selectedLoanId !== 'all') {
                    query = query.eq('loan_id', selectedLoanId);
                }

                if (activeTab === 'pending') {
                    query = query.eq('status', 'pending');
                }

                const { data, error } = await query;
                if (error) throw error;
                setFeeData(data);
            }
        } catch (err) {
            console.error("Error fetching fees:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleWaiveClick = (fee) => {
        setSelectedFee(fee);
        setModalOpen(true);
    };

    const handleAddCustomClick = () => {
        if (!selectedLoanId || selectedLoanId === 'all') {
            alert("Please select a specific loan to add a custom fee.");
            return;
        }
        setCustomFeeModalOpen(true);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                background: '#014486', // Blue background for header
                padding: '1.5rem',
                borderRadius: '8px',
                color: '#fff' // White text
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#fff' }}>Fee Management</h1>
                    <p style={{ margin: '0.5rem 0 0', opacity: 0.9, fontSize: '0.9rem' }}>Manage fee applications, waivers, and custom charges.</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select
                        style={selectStyle}
                        value={selectedLoanId}
                        onChange={e => setSelectedLoanId(e.target.value)}
                    >
                        <option value="all">All Loans</option>
                        {loans.map(loan => (
                            <option key={loan.id} value={loan.id}>
                                {loan.loan_number} - {loan.clients?.first_name} {loan.clients?.last_name}
                            </option>
                        ))}
                    </select>

                    <button onClick={handleAddCustomClick} style={addBtnStyle}>
                        + Add Custom Fee
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div style={tabsContainerStyle}>
                <button
                    style={activeTab === 'pending' ? activeTabStyle : tabStyle}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending Fees
                </button>
                <button
                    style={activeTab === 'history' ? activeTabStyle : tabStyle}
                    onClick={() => setActiveTab('history')}
                >
                    Fee History (All)
                </button>
                <button
                    style={activeTab === 'audit' ? activeTabStyle : tabStyle}
                    onClick={() => setActiveTab('audit')}
                >
                    Waiver Audit Trail
                </button>
            </div>

            {/* CONTENT */}
            <div style={contentStyle}>
                {loading ? <p>Loading...</p> : (
                    <>
                        {activeTab === 'audit' ? (
                            <table style={tableStyle}>
                                <thead>
                                    <tr style={headerRowStyle}>
                                        <th style={thStyle}>Date Waived</th>
                                        <th style={thStyle}>Loan #</th>
                                        <th style={thStyle}>Fee Type</th>
                                        <th style={thStyle}>Waived Amount</th>
                                        <th style={thStyle}>Reason</th>
                                        <th style={thStyle}>Waived By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditData.map(audit => (
                                        <tr key={audit.id} style={rowStyle}>
                                            <td style={tdStyle}>{new Date(audit.waived_at).toLocaleDateString()}</td>
                                            <td style={tdStyle}>{audit.fee_applications?.loans?.loan_number || '-'}</td>
                                            <td style={tdStyle}>{audit.fee_applications?.fee_type}</td>
                                            <td style={tdStyle}>${audit.waived_amount?.toFixed(2)}</td>
                                            <td style={tdStyle}>{audit.waive_reason}</td>
                                            <td style={tdStyle}>{audit.waived_by}</td>
                                        </tr>
                                    ))}
                                    {auditData.length === 0 && <tr><td colSpan="6" style={tdStyle}>No audit records found.</td></tr>}
                                </tbody>
                            </table>
                        ) : (
                            <table style={tableStyle}>
                                <thead>
                                    <tr style={headerRowStyle}>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Loan #</th>
                                        <th style={thStyle}>Fee Type</th>
                                        <th style={thStyle}>Description</th>
                                        <th style={thStyle}>Amount</th>
                                        <th style={thStyle}>Status</th>
                                        {activeTab === 'pending' && <th style={thStyle}>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {feeData.map(fee => (
                                        <tr key={fee.id} style={rowStyle}>
                                            <td style={tdStyle}>{new Date(fee.created_at).toLocaleDateString()}</td>
                                            <td style={tdStyle}>{fee.loans?.loan_number}</td>
                                            <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{fee.fee_type}</td>
                                            <td style={tdStyle}>{fee.description}</td>
                                            <td style={{ ...tdStyle, fontWeight: 'bold' }}>${fee.amount?.toFixed(2)}</td>
                                            <td style={tdStyle}>
                                                <span style={getStatusStyle(fee.status)}>{fee.status}</span>
                                            </td>
                                            {activeTab === 'pending' && (
                                                <td style={tdStyle}>
                                                    <button onClick={() => handleWaiveClick(fee)} style={waiveBtnStyle}>Waive</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {feeData.length === 0 && <tr><td colSpan="7" style={tdStyle}>No fees found.</td></tr>}
                                </tbody>
                            </table>
                        )}
                    </>
                )}
            </div>

            {/* MODALS */}
            {modalOpen && (
                <FeeWaiverModal
                    fee={selectedFee}
                    onClose={() => setModalOpen(false)}
                    onFeeWaived={fetchFees}
                />
            )}

            {customFeeModalOpen && (
                <CustomFeeModal
                    loanId={selectedLoanId}
                    clientId={loans.find(l => l.id === selectedLoanId)?.client_id}
                    onClose={() => setCustomFeeModalOpen(false)}
                    onFeeAdded={fetchFees}
                />
            )}
        </div>
    );
}

// Styles
const selectStyle = { padding: '0.5rem', borderRadius: '4px', border: 'none', minWidth: '200px', height: '38px' };
// Updated 'Add Custom Fee' button style
const addBtnStyle = {
    background: '#0176d3', // Uniform Blue
    color: '#fff',
    border: '1px solid #fff', // Add border for visibility against blue header? Or just match theme
    // Actually typically on blue header, a white button or lighter blue button is used. 
    // But user asked for #0176d3 button while header is #014486 (Dark Blue). This provides contrast.
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    minWidth: '160px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const tabsContainerStyle = { display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '1rem' };
const tabStyle = { padding: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontWeight: 500, borderBottom: '2px solid transparent' };
const activeTabStyle = { ...tabStyle, color: '#0176d3', borderBottom: '2px solid #0176d3' };
const contentStyle = { background: '#fff', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', padding: '1rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const headerRowStyle = { borderBottom: '2px solid #eee' };
const thStyle = { padding: '1rem', textAlign: 'left', color: '#666' };
const rowStyle = { borderBottom: '1px solid #f0f0f0' };
const tdStyle = { padding: '1rem', verticalAlign: 'middle' };
const waiveBtnStyle = { background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' };

const getStatusStyle = (status) => {
    switch (status) {
        case 'paid': return { color: '#155724', background: '#d4edda', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' };
        case 'waived': return { color: '#856404', background: '#fff3cd', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' };
        default: return { color: '#721c24', background: '#f8d7da', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' };
    }
};
