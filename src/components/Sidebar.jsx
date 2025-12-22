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
      { key: '/admin/fees', label: 'Fees Management', icon: '🧾' },
      { key: '/admin/expenses', label: 'Expenses', icon: '💸' },
      { key: '/admin/pl', label: 'P&L', icon: '📈' },
      { key: '/admin/compliance', label: 'Compliance, Audit, and Controls', icon: '📋' },
      { key: '/admin/accounting', label: 'Accounting & Financial Reporting', icon: '💼' },
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
    return (
      <div
        key={item.key}
        onClick={() => handleNavigation(item.key)}
        style={{
          padding: isSubItem ? '0.5rem 1rem 0.5rem 2.5rem' : '0.75rem 1rem',
          marginBottom: isSubItem ? '0.25rem' : '0.5rem',
          cursor: 'pointer',
          backgroundColor: active ? '#0176d3' : 'transparent',
          color: active ? '#fff' : '#181818',
          borderRadius: '4px',
          textAlign: collapsed ? 'center' : 'left',
          fontSize: isSubItem ? '0.85rem' : '0.9rem',
          transition: 'background 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: isSubItem ? 400 : 500,
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = '#f0f0f0';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <span>{item.icon}</span>
        {!collapsed && item.label}
      </div>
    );
  };

  const renderMenuSection = (section) => {
    return (
      <div key={section.key}>
        {renderMenuItem(section)}
        {section.children && !collapsed && (
          <div style={{ marginLeft: '0.5rem' }}>
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