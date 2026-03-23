import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const logoUrl = 'https://storage.googleapis.com/msgsndr/1JWftY3EO8g1C5Mo47fV/media/6599278fae139623964a006c.png';

export default function Sidebar({ collapsed, setCollapsed, userRole = 'staff' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Main menu items with nested subitems
  const menuItems = [
    {
      key: '/clients',
      label: 'Clients',
      icon: '👥',
      children: [
       // { key: '/clients/new', label: 'Add New Client', icon: '➕' },
      ],
    },
    {
      key: '/loans',
      label: 'Loans',
      icon: '💰',
      children: [
        // { key: '/loans/new', label: 'Add New Loan', icon: '➕' },
        { key: '/loans/transactions', label: 'Transactions', icon: '📊' },
        // { key: '/loans/repayment-schedule', label: 'Repayment Schedule', icon: '📅' },
        // { key: '/loans/actual-repayments', label: 'Actual Repayments', icon: '✅' },
        { key: '/loans/agreement', label: 'Loan Agreement', icon: '📄' },
        // { key: '/loans/products', label: 'Add New Product', icon: '➕' },
      ],
    },
    {
      key: '/payment-entry',
      label: 'Payment Entry',
      icon: '💳',
    },
  ];

  // Admin Tools menu
  const adminMenu = {
    key: '/admin',
    label: 'Admin Tools',
    icon: '⚙️',
    children: [
      { key: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
      { key: '/admin/waivers', label: 'Loan Waivers', icon: '💼' },
      { key: '/fees', label: 'Fees Management', icon: '🧾' },
      { key: '/admin/expenses', label: 'Expenses', icon: '💸' },
      { key: '/admin/pl', label: 'P&L', icon: '📈' },
      { key: '/reports', label: 'Reports', icon: '📊' },
      { key: '/admin/settings', label: 'Settings', icon: '⚙️' },
    ],
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth <= 768) {
      setCollapsed(true);
    }
  };

  const isActive = (path) => {
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  const renderMenuItem = (item, isSubItem = false) => {
    const active = isActive(item.key);
    const isParentWithChildren = !isSubItem && item.children && item.children.length > 0;

    return (
      <div
        key={item.key}
        onClick={() => { if (!isParentWithChildren) handleNavigation(item.key); }}
        style={{
          padding: isSubItem ? '0.65rem 1rem 0.65rem 1.5rem' : '0.75rem 1rem',
          marginBottom: isSubItem ? '0.3rem' : '0.25rem',
          cursor: isParentWithChildren ? 'default' : 'pointer',
          backgroundColor: active && !isParentWithChildren ? '#0176d3' : 'transparent',
          color: isParentWithChildren ? '#706e6b' : active ? '#fff' : '#181818',
          borderRadius: '6px',
          textAlign: collapsed ? 'center' : 'left',
          fontSize: isSubItem ? '0.875rem' : isParentWithChildren ? '0.75rem' : '0.95rem',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: isParentWithChildren ? 600 : isSubItem ? 400 : 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textTransform: isParentWithChildren ? 'uppercase' : 'none',
          letterSpacing: isParentWithChildren ? '0.05em' : 'normal',
        }}
        onMouseEnter={(e) => {
          if (!active && !isParentWithChildren) e.currentTarget.style.background = '#f5f5f5';
        }}
        onMouseLeave={(e) => {
          if (!active && !isParentWithChildren) e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={{ fontSize: isSubItem ? '1rem' : '1.1rem' }}>{item.icon}</span>
        {!collapsed && <span style={{ flex: 1, minWidth: 0 }}>{item.label}</span>}
      </div>
    );
  };

  const renderMenuSection = (section) => {
    return (
      <div key={section.key} style={{ marginBottom: '0.5rem' }}>
        {renderMenuItem(section)}
        {section.children && section.children.length > 0 && !collapsed && (
          <div style={{ marginTop: '0.125rem' }}>
            {section.children.map(child => renderMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
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
        height: 'calc(100vh - 60px)',
      }}
    >
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
          textAlign: 'center',
        }}
      >
        ☰
      </button>

      {/* Menu Items */}
      <div style={{ flex: 1 }}>
        {/* Regular Menu */}
        {menuItems.map(item => renderMenuSection(item))}

        {/* Admin Tools Section */}
        {userRole === 'admin' && (
          <>
            <div style={{ borderTop: '1px solid #e0e0e0', margin: '1rem 0', paddingTop: '1rem' }}>
              {renderMenuSection(adminMenu)}
            </div>
          </>
        )}
      </div>

      {/* Whizrock Logo at Bottom */}
      <div
        style={{
          textAlign: 'center',
          paddingTop: '1rem',
          borderTop: '1px solid #e0e0e0',
          marginTop: 'auto',
        }}
      >
        <img src={logoUrl} alt="Whizrock" style={{ height: '24px', width: 'auto', opacity: 0.6 }} />
        <div style={{ fontSize: '0.7rem', color: '#706e6b', marginTop: '0.5rem', textAlign: 'center' }}>
          Powered by Whizrock
        </div>
      </div>
    </div>
  );
}