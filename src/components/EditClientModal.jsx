// src/components/EditClientModal.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';

const EditClientModal = ({ client, onClose, onSave }) => {
  const [form, setForm] = useState(client);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const { error } = await supabase
      .from('clients')
      .update(form)
      .eq('id', form.id);
    if (!error) {
      onSave(form);
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }} onClick={onClose}>
      <div style={{
        background: '#fff', padding: '1.5rem', borderRadius: '0.5rem', width: '90%', maxWidth: '500px'
      }} onClick={e => e.stopPropagation()}>
        <h3>Edit Client</h3>
        <input name="name" value={form.name || ''} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', margin: '0.5rem 0' }} />
        <input name="email" value={form.email || ''} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', margin: '0.5rem 0' }} />
        <input name="region" value={form.region || ''} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', margin: '0.5rem 0' }} placeholder="Region" />
        <div style={{ marginTop: '1rem' }}>
          <button onClick={handleSubmit} style={{ background: '#0176d3', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.25rem' }}>Save</button>
          <button onClick={onClose} style={{ background: '#706e6b', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.25rem', marginLeft: '0.5rem' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default EditClientModal;