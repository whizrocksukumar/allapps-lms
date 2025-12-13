import React from 'react';
import { NavLink } from 'react-router-dom';

const menuItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/clients', label: 'Clients' },
  { path: '/loans', label: 'Loans' },
  { path: '/payment-entry', label: 'Payment Entry' },
  { path: '/repayments', label: 'Repayments' },
  { path: '/reports', label: 'Reports' },
];

export default function Sidebar({ collapsed }) {
  return (
    <div
      style={{
        width: collapsed ? '70px' : '250px',
        backgroundColor: '#003366',
        color: '#ffffff',
        padding: '1rem',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      {/* User Profile */}
      <div
        style={{
          marginBottom: '2rem',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          paddingBottom: '1rem',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            color: '#003366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: 'bold',
            margin: '0 auto 0.5rem',
          }}
        >
          U
        </div>

        {!collapsed && (
          <>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
              User Name
            </div>
            <button
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.6)',
                color: '#ffffff',
                padding: '0.3rem 0.8rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <div style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.75rem 1rem',
              marginBottom: '0.5rem',
              borderRadius: '4px',
              backgroundColor: isActive ? '#0176d3' : 'transparent',
              color: '#ffffff',
              textDecoration: 'none',
              textAlign: collapsed ? 'center' : 'left',
              transition: 'background-color 0.2s ease',
            })}
          >
            {collapsed ? item.label.charAt(0) : item.label}
          </NavLink>
        ))}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div
          style={{
            marginTop: '1rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <div style={{ marginBottom: '0.5rem' }}>
            <img
              src="/whizrock-icon.png"
              alt="Whizrock"
              style={{ width: '24px', opacity: 0.85 }}
            />
          </div>
          <div>Powered by</div>
          <a
            href="https://whizrock.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            Whizrock
          </a>
        </div>
      )}
    </div>
  );
}
