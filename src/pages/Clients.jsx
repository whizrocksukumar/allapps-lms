// src/pages/Clients.jsx
import React, { useState, useEffect } from 'react';
import {
  getClients,
  getLoansByClient,
  updateClient,
} from '../services/supabaseService';
import Loans360Modal from '../components/Loans360Modal';
import EditClientModal from '../components/EditClientModal';

const styles = {
  modal: { 
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
    background: '#fff', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 0 1rem rgba(0,0,0,0.2)', 
    zIndex: 1000, width: '80%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' 
  },
  closeButton: { background: '#0176d3', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' },
  section: { marginBottom: '1rem', padding: '1rem', background: '#f4f4f4', borderRadius: '0.25rem' },
  heading: { color: '#181818', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#706e6b', color: '#fff', padding: '0.5rem' },
  td: { padding: '0.5rem', border: '1px solid #ddd' },
  editButton: { background: '#0176d3', color: '#fff', padding: '0.5rem', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', marginLeft: '1rem' },
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientLoans, setClientLoans] = useState([]);
  const [showLoans360, setShowLoans360] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    (async () => {
      const { success, data } = await getClients();
      if (success) setClients(data);
    })();
  }, []);

  const openClientModal = async (client) => {
    setSelectedClient(client);
    const { success, data } = await getLoansByClient(client.id);
    if (success) setClientLoans(data);
  };

  const handleLoansClick = (loan) => {
    setSelectedLoan(loan || clientLoans[0]);
    setShowLoans360(true);
  };

  const handleSave = (updatedClient) => {
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );
    setSelectedClient(updatedClient);
  };

  return (
    <div>
      {/* Simple client list - expand to table later */}
      <h1>Clients</h1>
      {clients.length === 0 ? (
        <p>Loading clients...</p>
      ) : (
        <ul>
          {clients.map((client) => (
            <li key={client.id}>
              <button onClick={() => openClientModal(client)}>
                {client.code} - {client.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Client 360 Modal */}
      {selectedClient && (
        <div style={styles.modal}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Client {selectedClient.code} - {selectedClient.name}</h2>
            <button style={styles.editButton} onClick={() => setShowEdit(true)}>
              Edit
            </button>
            <button style={styles.closeButton} onClick={() => setSelectedClient(null)}>Close</button>
          </div>
          <hr style={{ borderColor: '#0176d3' }} />

          <div style={styles.section}>
            <h3>Personal Details</h3>
            <p>Code: {selectedClient.code}</p>
            <p>Name: {selectedClient.name}</p>
            <p>Email: {selectedClient.email}</p>
            <p>Phone: {selectedClient.phone}</p>
            <p>Status: {selectedClient.status}</p>
          </div>

          <div style={styles.section}>
            <h3>Address</h3>
            <p>{selectedClient.address || 'N/A'}</p>
            <p>Region: {selectedClient.region || 'N/A'}</p>
          </div>

          <div style={styles.section}>
            <h3>Employment</h3>
            <p>Status: {selectedClient.employment_status}</p>
            <p>Monthly Income: ${selectedClient.monthly_income || 0}</p>
          </div>

          <div style={styles.section}>
            <h3>Identification</h3>
            <p>Type: {selectedClient.id_type || 'N/A'}</p>
            <p>Number: {selectedClient.id_number || 'N/A'}</p>
            <p>DOB: {selectedClient.dob || 'N/A'}</p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.heading} onClick={() => handleLoansClick()}>
              Loans ({clientLoans.length})
            </h3>
            {clientLoans.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Loan #</th>
                    <th style={styles.th}>Balance</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Current Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {clientLoans.map((loan) => (
                    <tr
                      key={loan.id}
                      onClick={() => handleLoansClick(loan)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={styles.td}>{loan.loan_number}</td>
                      <td style={styles.td}>${loan.balance || 0}</td>
                      <td style={styles.td}>{loan.status}</td>
                      <td style={styles.td}>${loan.balance || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No loans found.</p>
            )}
          </div>

          <div style={styles.section}>
            <h3>Recent Transactions</h3>
            <p>No transactions found (implement fetch later).</p>
          </div>
        </div>
      )}

      {/* Loans 360 Modal */}
      {showLoans360 && selectedLoan && (
        <Loans360Modal loan={selectedLoan} onClose={() => setShowLoans360(false)} />
      )}

      {/* Edit Client Modal */}
      {showEdit && selectedClient && (
        <EditClientModal
          client={selectedClient}
          onClose={() => setShowEdit(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Clients;