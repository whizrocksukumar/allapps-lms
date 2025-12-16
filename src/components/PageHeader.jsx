import React from 'react';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1.5rem 2rem',
      background: '#fff',
      borderBottom: '1px solid #e0e0e0',
      marginBottom: '2rem'
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1a1a1a' }}>{title}</h1>
        {subtitle && (
          <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.9rem' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div>
        {actions}
      </div>
    </div>
  );
}