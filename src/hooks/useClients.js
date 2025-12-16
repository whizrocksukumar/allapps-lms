// src/hooks/useClients.js
import { useState, useEffect, useCallback } from 'react';
import { getClients, addClient, updateClient, deleteClient } from '../services/supabaseService';

export const useClients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getClients();
            // Assuming getClients returns array directly or handles errors internally returning empty array.
            // Based on previous definition it returns `data || []`.
            setClients(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch clients');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const createClient = async (clientData) => {
        try {
            const newClient = await addClient(clientData);
            if (newClient) {
                setClients(prev => [newClient, ...prev]);
                return { success: true, data: newClient };
            }
            return { success: false, message: 'Failed to create client' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const editClient = async (id, updates) => {
        try {
            const updated = await updateClient(id, updates);
            if (updated) {
                setClients(prev => prev.map(c => c.id === id ? updated : c));
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to update client' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const removeClient = async (id) => {
        try {
            const success = await deleteClient(id);
            if (success) {
                setClients(prev => prev.filter(c => c.id !== id));
                return { success: true };
            }
            return { success: false, message: 'Failed to delete client' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    return {
        clients,
        loading,
        error,
        refetch: fetchClients,
        createClient,
        editClient,
        removeClient
    };
};
