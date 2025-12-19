import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';

export default function Expenses() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Default to today
    reference: '',
    expense_amount: '',
    category: '',
    tax: '', // Tax - GST field
    description: '',
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('category, tax')
        .neq('category', null)
        .order('category', { ascending: true });

      if (error) throw error;

      // Get unique categories
      const uniqueCategories = Array.from(
        new Map(data.map(item => [item.category, item])).values()
      );

      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setMessage('Error loading categories');
      setMessageType('error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If category changed, auto-populate tax
    if (name === 'category') {
      const selectedCat = categories.find(c => c.category === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        tax: selectedCat?.tax || '', // Auto-populate tax
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.date || !formData.reference || !formData.expense_amount || !formData.category) {
      setMessage('Please fill in all required fields');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.from('expenses').insert([
        {
          date: formData.date,
          reference: formData.reference,
          expense_amount: parseFloat(formData.expense_amount),
          category: formData.category,
          tax: formData.tax,
          description: formData.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setMessage('✅ Saved successfully');
      setMessageType('success');

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        expense_amount: '',
        category: '',
        tax: '',
        description: '',
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error saving expense:', err);
      setMessage(`❌ Error: ${err.message}`);
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      backgroundColor: '#f8f9fa',
      padding: '2rem',
      minHeight: '100vh',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '600px',
      margin: '0 auto',
    },
    title: {
      fontSize: '1.8rem',
      color: '#0176d3',
      marginBottom: '1.5rem',
      fontWeight: 600,
    },
    formGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 500,
      color: '#181818',
      fontSize: '0.95rem',
    },
    required: {
      color: 'red',
      marginLeft: '0.25rem',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '0.95rem',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '0.95rem',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      backgroundColor: '#fff',
      cursor: 'pointer',
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '0.95rem',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      minHeight: '100px',
      resize: 'vertical',
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      marginTop: '2rem',
    },
    saveButton: {
      backgroundColor: '#0176d3',
      color: '#fff',
      padding: '0.75rem 1.5rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '0.95rem',
      transition: 'background 0.2s',
    },
    saveButtonHover: {
      backgroundColor: '#0156a8',
    },
    messageSuccess: {
      color: '#28a745',
      fontSize: '0.95rem',
      fontWeight: 500,
    },
    messageError: {
      color: '#dc3545',
      fontSize: '0.95rem',
      fontWeight: 500,
    },
    categoryInfo: {
      fontSize: '0.85rem',
      color: '#706e6b',
      marginTop: '0.25rem',
      fontStyle: 'italic',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>💸 Add Expense</h1>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Date <span style={styles.required}>*</span>
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            style={styles.input}
            disabled={loading}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Reference <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="reference"
            placeholder="e.g., INV-001"
            value={formData.reference}
            onChange={handleInputChange}
            style={styles.input}
            disabled={loading}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Amount <span style={styles.required}>*</span>
          </label>
          <input
            type="number"
            name="expense_amount"
            placeholder="0.00"
            step="0.01"
            min="0"
            value={formData.expense_amount}
            onChange={handleInputChange}
            style={styles.input}
            disabled={loading}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Category <span style={styles.required}>*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            style={styles.select}
            disabled={loading}
          >
            <option value="">-- Select Category --</option>
            {categories.map(cat => (
              <option key={cat.category} value={cat.category}>
                {cat.category}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Tax - GST</label>
          <input
            type="text"
            name="tax"
            placeholder="e.g., 15% GST on Expenses"
            value={formData.tax}
            onChange={handleInputChange}
            style={styles.input}
            disabled={loading}
          />
          <div style={styles.categoryInfo}>
            This field auto-populates based on selected category, but can be edited.
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description</label>
          <textarea
            name="description"
            placeholder="Enter expense description..."
            value={formData.description}
            onChange={handleInputChange}
            style={styles.textarea}
            disabled={loading}
          />
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={handleSave}
            style={styles.saveButton}
            onMouseEnter={(e) => e.target.style.backgroundColor = styles.saveButtonHover.backgroundColor}
            onMouseLeave={(e) => e.target.style.backgroundColor = styles.saveButton.backgroundColor}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          {message && (
            <span style={messageType === 'success' ? styles.messageSuccess : styles.messageError}>
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}