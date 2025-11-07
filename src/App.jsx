// src/App.jsx - FULL MVP WITH ROOT ROUTE
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Loans from './pages/Loans';
import PaymentEntry from './pages/PaymentEntry';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
      case '': // Root route
        return <Dashboard />;
      case 'clients':
        return <Clients />;
      case 'loans':
        return <Loans />;
      case 'paymentEntry':
        return <PaymentEntry />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui', width: '100%' }}>
      <Navbar onToggle={() => setCollapsed(!collapsed)} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%' }}>
        <Sidebar page={page} setPage={setPage} collapsed={collapsed} />
        <main style={{ flex: 1, padding: '1.5rem', overflow: 'auto', minWidth: 0, width: '100%' }}>
          {renderPage()}
        </main>
      </div>
      <footer style={{ background: '#181818', color: '#fff', textAlign: 'center', padding: '1rem', fontSize: '0.875rem', flexShrink: 0, width: '100%' }}>
        <a href="https://whizrock.com" style={{ color: '#0176d3', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
          Powered by Whizrock
        </a>
      </footer>
    </div>
  );
}