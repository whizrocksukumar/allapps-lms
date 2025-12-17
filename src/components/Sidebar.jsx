// src/components/Sidebar.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const logoUrl = 'https://storage.googleapis.com/msgsndr/1JWftY3EO8g1C5Mo47fV/media/6599278fae139623964a006c.png';

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const items = [
    { key: '/dashboard', label: 'Dashboard', icon: '📊' },
    { key: '/clients', label: 'Clients', icon: '👥' },
    { key: '/loans', label: 'Loans', icon: '💰' },
    { key: '/fees', label: 'Fees', icon: '🧾' },
    { key: '/payment-entry', label: 'Payment Entry', icon: '💳' },
    { key: '/repayments', label: 'Repayments', icon: '📝' },
    { key: '/reports', label: 'Reports', icon: '📈' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    // On mobile we might want to collapse the sidebar here
    if (window.innerWidth <= 768) {
      setCollapsed(true);
    }
  };

  return (
    <div style={{
      width: collapsed ? '70px' : '250px',
      background: '#ffffff',
      color: '#181818',
      padding: '1rem',
      transition: 'width 0.3s',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      flexShrink: 0,
      position: 'relative',
      borderRight: '1px solid #e0e0e0',
      height: 'calc(100vh - 60px)'
    }}>
      {/* Hamburger Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: 'none',
          border: 'none',
          color: '#181818',
          fontSize: '1.5rem',
          cursor: 'pointer',
          marginBottom: '1.5rem',
          padding: '0.5rem',
          textAlign: 'center'
        }}
      >
        ☰
      </button>

      {/* Menu Items */}
      <div style={{ flex: 1 }}>
        {items.map(item => {
          const isActive = currentPath === item.key || (item.key !== '/dashboard' && currentPath.startsWith(item.key));

          return (
            <div
              key={item.key}
              onClick={() => handleNavigation(item.key)}
              style={{
                padding: '0.75rem 1rem',
                marginBottom: '0.5rem',
                cursor: 'pointer',
                backgroundColor: isActive ? '#0176d3' : 'transparent',
                color: isActive ? '#fff' : '#181818',
                borderRadius: '4px',
                textAlign: collapsed ? 'center' : 'left',
                fontSize: '0.9rem',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#f0f0f0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>{item.icon}</span>
              {!collapsed && item.label}
            </div>
          );
        })}
      </div>

      {/* Whizrock Logo at Bottom */}
      <div style={{
        textAlign: 'center',
        paddingTop: '1rem',
        borderTop: '1px solid #e0e0e0',
        marginTop: 'auto'
      }}>
        <img src={logoUrl} alt="Whizrock" style={{ height: '24px', width: 'auto', opacity: 0.6 }} />
        <div style={{ fontSize: '0.7rem', color: '#706e6b', marginTop: '0.5rem', textAlign: 'center' }}>Powered by Whizrock</div>
      </div>
    </div>
  );
}