import React from 'react';

export default function LoanAgreement() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#0176d3', marginBottom: '0.5rem' }}>Loan Agreement</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Generate and manage loan agreement documents</p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        textAlign: 'center',
        minHeight: '400px',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📄</div>
        <h2 style={{ color: '#0176d3', fontSize: '2rem', margin: '0 0 1rem 0' }}>Coming Soon</h2>
        <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Loan agreement document generation feature is under development.
        </p>
        <p style={{ color: '#181818', fontWeight: 500, marginBottom: '1rem' }}>
          This page will allow you to:
        </p>
        <ul style={{
          listStyle: 'none',
          padding: '0',
          color: '#555',
          fontSize: '0.95rem',
          textAlign: 'left',
          display: 'inline-block',
          maxWidth: '400px',
        }}>
          <li style={{ marginBottom: '0.5rem' }}>✓ Generate loan agreement documents with client terms</li>
          <li style={{ marginBottom: '0.5rem' }}>✓ Display loan term in format: {`{number} {frequency}`} (e.g., 12 Months, 52 Weeks)</li>
          <li style={{ marginBottom: '0.5rem' }}>✓ Include all loan conditions and terms & conditions</li>
          <li style={{ marginBottom: '0.5rem' }}>✓ Download and print agreements for client signature</li>
          <li style={{ marginBottom: '0.5rem' }}>✓ Track signed agreements per loan</li>
        </ul>
      </div>
    </div>
  );
}