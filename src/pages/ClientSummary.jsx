import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getclientById,
  getLoansForclient,
} from '../services/supabaseService';

const ClientSummary = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    try {
      const clientData = await getclientById(clientId);
      setClient(clientData);
      const loansData = await getLoansForclient(clientId);
      setLoans(loansData || []);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;

  if (!client) return <div style={{ padding: '40px' }}>Client not found</div>;

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
      <button onClick={() => navigate('/clients')} style={{ marginBottom: '20px' }}>
        ← Back to Clients
      </button>
      
      <h1>{client.full_name}</h1>
      <p><strong>Code:</strong> {client.code}</p>
      <p><strong>Email:</strong> {client.email}</p>
      <p><strong>Phone:</strong> {client.phone || 'N/A'}</p>
      
      <h2>Active Loans: {loans.filter(l => l.status === 'active').length}</h2>
      {loans.length === 0 ? (
        <p>No loans found</p>
      ) : (
        <ul>
          {loans.map(loan => (
            <li key={loan.id}>
              {loan.loan_number} - ${(loan.outstanding_principal || 0).toFixed(2)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientSummary;