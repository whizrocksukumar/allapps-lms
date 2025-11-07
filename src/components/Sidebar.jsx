// src/components/Sidebar.jsx - UPDATED ROUTES
import React from 'react';

const logoUrl = 'https://storage.googleapis.com/msgsndr/1JWftY3EO8g1C5Mo47fV/media/6599278fae139623964a006c.png';

const items = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'clients', label: 'Clients' },
  { key: 'loans', label: 'Loans' },
  { key: 'paymentEntry', label: 'Payment Entry' },
  { key: 'repayments', label: 'Repayments' },
  { key: 'reports', label: 'Reports' },
];

export default function Sidebar({ page, setPage, collapsed }) {
  return (
    <div style={{
      width: collapsed ? '70px' : '250px',
      background: '#181818',
      color: '#fff',
      padding: '1rem',
      transition: 'width 0.3s',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      flexShrink: 0
    }}>
      {items.map(item => (
        <div
          key={item.key}
          onClick={() => setPage(item.key)}
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '0.5rem',
            cursor: 'pointer',
            backgroundColor: page === item.key ? '#0176d3' : 'transparent',
            borderRadius: '4px',
            textAlign: collapsed ? 'center' : 'left'
          }}
        >
          {collapsed ? item.label[0] : item.label}
        </div>
      ))}
    </div>
  );
}