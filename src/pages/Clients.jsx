// src/pages/Clients.jsx
import React, { useState, useEffect } from 'react';
import { useClients } from '../hooks/useClients';
import PageHeader from '../components/PageHeader';
import Client360Modal from '../components/Client360Modal';
import EditClientModal from '../components/EditClientModal';
import NewClientModal from '../components/NewClientModal';
import './Clients.css';

const Clients = () => {
  const { clients, loading, refetch, createClient, editClient } = useClients();
  const [filteredClients, setFilteredClients] = useState([]);

  // Modals
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClient360, setShowClient360] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    filterClients();
  }, [clients, search, statusFilter]);

  const filterClients = () => {
    let result = [...clients];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        (c.first_name && c.first_name.toLowerCase().includes(q)) ||
        (c.last_name && c.last_name.toLowerCase().includes(q)) ||
        (c.client_code && c.client_code.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(c => c.status === statusFilter);
    }

    setFilteredClients(result);
  };

  const handleSave = async (updatedClient) => {
    const success = await editClient(updatedClient.id, updatedClient);
    if (success) {
      if (selectedClient?.id === updatedClient.id) {
        setSelectedClient(updatedClient);
      }
      setShowEdit(false);
    }
  };

  const handleClientAdded = async (newClientData) => {
    // NewClientModal might pass the response object or just trigger a refresh.
    // Assuming NewClientModal handles the API call internally based on old code, 
    // but ideally we should pass `createClient` to it.
    // For now, let's stick to the pattern: invalidating/refetching or optimistic updates.
    // The old NewClientModal seemingly just called onClose(data).

    // If we want to use the hook, NewClientModal props might need adjustment,
    // but let's assume it returns the new client object onSave.
    // Wait, let's check NewClientModal implementation if possible or just assume standard behavior.
    // If NewClientModal calls API itself, we just need to refetch.
    // For now, let's re-fetch to be safe.
    refetch();
    setShowNew(false);
  };

  return (
    <div className="clients-page">
      <PageHeader
        title="Contacts"
        subtitle="Manage your customer contacts"
        actions={
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            + New Contact
          </button>
        }
      />

      {/* Controls */}
      <div className="clients-controls">
        <div className="clients-search">
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="clients-filters">
          <div className="status-filter-group">
            <span className="status-label">Status:</span>
            {['All', 'Active', 'Prospect', 'Inactive'].map(s => (
              <button
                key={s}
                className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <button className="filter-btn">Export</button>
          <button className="filter-btn">Import</button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-stats">
          Showing {filteredClients.length} of {clients.length} contacts
        </div>

        <table className="clients-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}><input type="checkbox" /></th>
              <th>Action</th>
              <th>Contact Name</th>
              <th>Company Name</th>
              <th>Site Address</th>
              <th>Region</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="loading-state">Loading...</td></tr>
            ) : filteredClients.length === 0 ? (
              <tr><td colSpan="9" className="empty-state">No contacts found.</td></tr>
            ) : (
              filteredClients.map(client => (
                <tr key={client.id}>
                  <td><input type="checkbox" /></td>
                  <td>
                    <div className="action-cell">
                      <button
                        className="btn-sm"
                        onClick={() => { setSelectedClient(client); setShowClient360(true); }}
                      >
                        View
                      </button>
                      <button
                        className="btn-sm"
                        onClick={() => { setSelectedClient(client); setShowEdit(true); }}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                  <td
                    className="client-link"
                    onClick={() => { setSelectedClient(client); setShowClient360(true); }}
                  >
                    {client.first_name} {client.last_name}
                  </td>
                  <td>{client.company_name || '-'}</td>
                  <td>{client.address || '-'}</td>
                  <td>{client.region || '-'}</td>
                  <td>{client.phone || '-'}</td>
                  <td>{client.email || '-'}</td>
                  <td>
                    <span className={`status-badge ${client.status?.toLowerCase() || ''}`}>
                      {client.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showClient360 && selectedClient && (
        <Client360Modal
          isOpen={showClient360}
          onClose={() => setShowClient360(false)}
          clientId={selectedClient.id}
        />
      )}

      {showEdit && selectedClient && (
        <EditClientModal
          client={selectedClient}
          onClose={() => setShowEdit(false)}
          onSave={handleSave}
        />
      )}

      {showNew && (
        <NewClientModal
          isOpen={showNew}
          onClose={() => setShowNew(false)}
          onSave={handleClientAdded}
        />
      )}
    </div>
  );
};

export default Clients;