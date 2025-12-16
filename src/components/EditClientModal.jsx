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

  // Styles
  const labelStyle = { display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem', color: '#444' };
  const inputStyle = { width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.95rem' };
  const groupStyle = { marginBottom: '1rem' };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }} onClick={onClose}>
      <div style={{
        background: '#fff', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '600px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }} onClick={e => e.stopPropagation()}>

        <h2 style={{ marginTop: 0, color: '#0176d3', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Edit Client</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={groupStyle}>
            <label style={labelStyle}>First Name</label>
            <input name="first_name" value={form.first_name || ''} onChange={handleChange} style={inputStyle} />
          </div>
          <div style={groupStyle}>
            <label style={labelStyle}>Last Name</label>
            <input name="last_name" value={form.last_name || ''} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div style={groupStyle}>
          <label style={labelStyle}>Email</label>
          <input name="email" value={form.email || ''} onChange={handleChange} style={inputStyle} />
        </div>

        <div style={groupStyle}>
          <label style={labelStyle}>Phone</label>
          <input name="phone" value={form.phone || ''} onChange={handleChange} style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={groupStyle}>
            <label style={labelStyle}>Address</label>
            <input name="address" value={form.address || ''} onChange={handleChange} style={inputStyle} />
          </div>
          <div style={groupStyle}>
            <label style={labelStyle}>Region</label>
            <input name="region" value={form.region || ''} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button onClick={onClose} style={{ background: '#f3f2f2', color: '#333', padding: '0.6rem 1.2rem', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button onClick={handleSubmit} style={{ background: '#0176d3', color: '#fff', padding: '0.6rem 1.2rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default EditClientModal;