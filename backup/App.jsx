// src/App.jsx - FULL MVP WITH ROOT ROUTE
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Loans from './pages/Loans';
import PaymentEntry from './pages/PaymentEntry';
import Repayments from './pages/Repayments';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui', width: '100%' }}>
      <Navbar onToggle={() => setCollapsed(!collapsed)} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%' }}>
        <Sidebar collapsed={collapsed} />
        <main style={{ flex: 1, padding: '1.5rem', overflow: 'auto', minWidth: 0, width: '100%' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/payment-entry" element={<PaymentEntry />} />
            <Route path="/repayments" element={<Repayments />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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