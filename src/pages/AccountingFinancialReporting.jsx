import React from 'react';

const AccountingFinancialReporting = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '2rem',
    }}>
      <div style={{
        textAlign: 'center',
        backgroundColor: '#ffffff',
        padding: '3rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '500px',
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem',
        }}>
          💼
        </div>
        <h1 style={{
          fontSize: '2rem',
          color: '#0176d3',
          margin: '0 0 1rem 0',
          fontWeight: 600,
        }}>
          Accounting & Financial Reporting
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#706e6b',
          margin: '0',
          lineHeight: '1.6',
        }}>
          Coming Soon
        </p>
        <p style={{
          fontSize: '0.95rem',
          color: '#999',
          margin: '1rem 0 0 0',
        }}>
          Financial reporting and accounting records.
        </p>
      </div>
    </div>
  );
};

export default AccountingFinancialReporting;