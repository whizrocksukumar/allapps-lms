// src/pages/Clients.jsx
import React, { useState, useEffect } from 'react';
import {
  getClients,
  getLoansByClient,
  updateClient,
} from '../services/supabaseService';
import Loans360Modal from '../components/Loans360Modal';
import EditClientModal from '../components/EditClientModal';
import Client360Modal from '../components/Client360Modal';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientLoans, setClientLoans] = useState([]);
  const [showLoans360, setShowLoans360] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showClient360, setShowClient360] = useState(false);

  useEffect(() => {
    (async () => {
      const { success, data } = await getClients();
      if (success) setClients(data);
    })();
  }, []);

  const openClientModal = async (client) => {
    setSelectedClient(client);
    setShowClient360(true);
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
                {client.code} - {client.first_name} {client.last_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showClient360 && selectedClient && (
        <Client360Modal
          isOpen={showClient360}
          onClose={() => setShowClient360(false)}
          clientId={selectedClient.id}
        />
      )}
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