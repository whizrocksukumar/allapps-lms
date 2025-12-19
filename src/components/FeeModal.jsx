import React, { useState } from 'react';

export default function FeeModal({ isOpen, onClose, onSave, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    fee_type: 'management',
    amount: 0,
    description: '',
    is_recurring: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = () => {
    onSave(formData);
    setFormData({ fee_type: 'management', amount: 0, description: '', is_recurring: false });
  };

  const styles = {
    overlay: {
      display: isOpen ? 'flex' : 'none',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '12px',
      width: '90%',
      maxWidth: '500px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 600,
      marginBottom: '1.5rem',
      color: '#181818',
    },
    formGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 500,
      color: '#181818',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      fontSize: '0.95rem',
      boxSizing: 'border-box',
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      fontSize: '0.95rem',
      boxSizing: 'border-box',
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    checkbox: {
      cursor: 'pointer',
      width: '18px',
      height: '18px',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem',
      marginTop: '2rem',
    },
    btnCancel: {
      backgroundColor: '#e9ecef',
      color: '#181818',
      padding: '0.75rem 1.5rem',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 500,
    },
    btnSave: {
      backgroundColor: '#28a745',
      color: 'white',
      padding: '0.75rem 1.5rem',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 500,
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>{initialData ? 'Edit Fee' : 'Add Fee'}</h2>

        <div style={styles.formGroup}>
          <label style={styles.label}>Fee Type</label>
          <select
            name="fee_type"
            style={styles.select}
            value={formData.fee_type}
            onChange={handleChange}
          >
            <option value="management">Management Fee</option>
            <option value="establishment">Establishment Fee</option>
            <option value="dishonor">Dishonor Fee</option>
            <option value="late">Late Fee</option>
            <option value="admin">Admin Fee</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Amount</label>
          <input
            type="number"
            name="amount"
            style={styles.input}
            placeholder="0.00"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description</label>
          <input
            type="text"
            name="description"
            style={styles.input}
            placeholder="Enter description..."
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div style={styles.formGroup}>
          <div style={styles.checkboxGroup}>
            <input
              type="checkbox"
              name="is_recurring"
              style={styles.checkbox}
              checked={formData.is_recurring}
              onChange={handleChange}
            />
            <label style={{ ...styles.label, margin: 0 }}>Is Recurring (Weekly)</label>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.btnCancel} onClick={onClose}>
            Cancel
          </button>
          <button style={styles.btnSave} onClick={handleSubmit}>
            {initialData ? 'Update Fee' : 'Add Fee'}
          </button>
        </div>
      </div>
    </div>
  );
}