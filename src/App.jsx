// src/App.jsx - FINAL
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Loans from './pages/Loans';
import LoanAgreement from './pages/LoanAgreement';  
import PaymentEntry from './pages/PaymentEntry';
import FeeManagementPage from './pages/FeeManagementPage';
import LoanWaiversDashboard from './pages/LoanWaiversDashboard';
import Transactions from './pages/Transactions';
import RepaymentSchedule from './pages/RepaymentSchedule';
import ActualRepayments from './pages/ActualRepayments';
import Expenses from './pages/Expenses';
import ProfitAndLoss from './pages/ProfitAndLoss';
import ComplianceAuditControls from './pages/ComplianceAuditControls';
import AccountingFinancialReporting from './pages/AccountingFinancialReporting';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui', width: '100%' }}>
      <Navbar onToggle={() => setCollapsed(!collapsed)} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%' }}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} userRole="admin" />
        <main style={{
          flex: 1,
          overflow: 'auto',
          minWidth: 0,
          padding: '1.5rem'
         }}>
          <Routes>
            <Route path="/" element={<Navigate to="/clients" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/loans/transactions" element={<Transactions />} />
            <Route path="/loans/repayment-schedule" element={<RepaymentSchedule />} />
            <Route path="/loans/actual-repayments" element={<ActualRepayments />} />
            <Route path="/loans/agreement" element={<LoanAgreement />} />
            <Route path="/payment-entry" element={<PaymentEntry />} />
            <Route path="/fees" element={<FeeManagementPage />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/waivers" element={<LoanWaiversDashboard />} />
            <Route path="/admin/expenses" element={<Expenses />} />
            <Route path="/admin/pl" element={<ProfitAndLoss />} />
            <Route path="/admin/compliance" element={<ComplianceAuditControls />} />
            <Route path="/admin/accounting" element={<AccountingFinancialReporting />} />
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