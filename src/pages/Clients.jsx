// src/pages/Clients.jsx
import React, { useState, useEffect } from 'react';
import { getClients, addClient, updateClient, deleteClient } from '../services/supabaseService';

const styles = {
  container: {
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  searchInput: {
    padding: '0.75rem',
    width: '300px',
    border: '1px solid #706e6b',
    borderRadius: '4px',
  },
  addButton: {
    backgroundColor: '#0176d3',
    color: '#ffffff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  clientList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  },
  clientCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  clientName: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#181818',
    marginBottom: '0.5rem',
  },
  clientInfo: {
    color: '#706e6b',
    marginBottom: '0.25rem',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#ffffff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    width: '500px',
    zIndex: 1000,
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #706e6b',
    borderRadius: '4px',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: '#ffffff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    color: '#ffffff',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchClients = async () => {
      const data = await getClients();
      setClients(data || []);
    };
    fetchClients();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (client = null) => {
    setSelectedClient(client);
    setFormData(client || {});
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    let result;
    if (selectedClient) {
      result = await updateClient(selectedClient.id, formData);
    } else {
      result = await addClient(formData);
    }
    if (result.success) {
      const data = await getClients();
      setClients(data || []);
      setIsModalOpen(false);
    } else {
      console.error(result.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      const result = await deleteClient(id);
      if (result.success) {
        setClients(clients.filter(c => c.id !== id));
      } else {
        console.error(result.message);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <input
          type="text"
          placeholder="Search clients..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={handleSearch}
        />
        <button style={styles.addButton} onClick={() => openModal()}>Add New Client</button>
      </div>
      <div style={styles.clientList}>
        {filteredClients.map(client => (
          <div key={client.id} style={styles.clientCard} onClick={() => openModal(client)}>
            <div style={styles.clientName}>{client.name}</div>
            <div style={styles.clientInfo}>Code: {client.code}</div>
            <div style={styles.clientInfo}>Email: {client.email}</div>
            <div style={styles.clientInfo}>Phone: {client.phone}</div>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}>Delete</button>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div style={styles.modal}>
          <h2>{selectedClient ? 'Edit Client' : 'Add Client'}</h2>
          <input
            name="name"
            placeholder="Name"
            style={styles.input}
            value={formData.name || ''}
            onChange={handleInputChange}
          />
          <input
            name="email"
            placeholder="Email"
            style={styles.input}
            value={formData.email || ''}
            onChange={handleInputChange}
          />
          <input
            name="phone"
            placeholder="Phone"
            style={styles.input}
            value={formData.phone || ''}
            onChange={handleInputChange}
          />
          <div style={styles.buttonGroup}>
            <button style={styles.saveButton} onClick={handleSave}>Save</button>
            <button style={styles.cancelButton} onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;