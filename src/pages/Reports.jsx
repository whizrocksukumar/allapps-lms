import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import PageHeader from '../components/PageHeader';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('portfolio');
  const [loading, setLoading] = useState(false);

  // Portfolio data
  const [portfolioData, setPortfolioData] = useState({
    totalActiveLoans: 0,
    totalOutstanding: 0,
    totalPrincipal: 0,
    totalInterest: 0,
    totalFees: 0,
    loans: []
  });

  // Overdue data
  const [overdueLoans, setOverdueLoans] = useState([]);

  // Collections data
  const [collectionsData, setCollectionsData] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (activeReport === 'portfolio') {
      fetchPortfolioData();
    } else if (activeReport === 'overdue') {
      fetchOverdueLoans();
    } else if (activeReport === 'collections') {
      fetchCollectionsData();
    }
  }, [activeReport]);

  useEffect(() => {
    if (activeReport === 'collections') {
      fetchCollectionsData();
    }
  }, [dateRange]);

  const fetchPortfolioData = async () => {
    setLoading(true);
    try {
      // Fetch active loans with client info and balances
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select(`
          *,
          clients (id, first_name, last_name, client_code),
          loan_balances (
            total_outstanding_balance,
            outstanding_principal,
            outstanding_interest,
            unpaid_fees
          )
        `)
        .ilike('status', 'active')
        .order('loan_number');

      if (loansError) {
        console.error('Loans query error:', loansError);
        throw loansError;
      }

      console.log('Fetched loans:', loans?.length, loans);

      let totalOutstanding = 0;
      let totalPrincipal = 0;
      let totalInterest = 0;
      let totalFees = 0;

      const processedLoans = (loans || []).map(loan => {
        const balance = Array.isArray(loan.loan_balances)
          ? loan.loan_balances[0]
          : loan.loan_balances;
        const client = Array.isArray(loan.clients)
          ? loan.clients[0]
          : loan.clients;

        console.log('Loan balance for', loan.loan_number, ':', balance);

        const outstanding = balance?.total_outstanding_balance || 0;
        const principal = balance?.outstanding_principal || 0;
        const interest = balance?.outstanding_interest || 0;
        const fees = balance?.unpaid_fees || 0;

        totalOutstanding += outstanding;
        totalPrincipal += principal;
        totalInterest += interest;
        totalFees += fees;

        return {
          ...loan,
          client_name: client ? `${client.first_name} ${client.last_name}` : 'Unknown',
          outstanding_balance: outstanding,
          outstanding_principal: principal,
          outstanding_interest: interest,
          unpaid_fees: fees
        };
      });

      setPortfolioData({
        totalActiveLoans: processedLoans.length,
        totalOutstanding,
        totalPrincipal,
        totalInterest,
        totalFees,
        loans: processedLoans
      });
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdueLoans = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch loans with overdue payments
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select(`
          *,
          clients (id, first_name, last_name, client_code),
          loan_balances (total_outstanding_balance)
        `)
        .ilike('status', 'active')
        .lt('next_payment_due_date', today)
        .not('next_payment_due_date', 'is', null)
        .order('next_payment_due_date');

      if (loansError) throw loansError;

      const processedLoans = (loans || []).map(loan => {
        const balance = Array.isArray(loan.loan_balances)
          ? loan.loan_balances[0]
          : loan.loan_balances;
        const client = Array.isArray(loan.clients)
          ? loan.clients[0]
          : loan.clients;

        const dueDate = new Date(loan.next_payment_due_date);
        const todayDate = new Date(today);
        const daysOverdue = Math.floor((todayDate - dueDate) / (1000 * 60 * 60 * 24));

        return {
          ...loan,
          client_name: client ? `${client.first_name} ${client.last_name}` : 'Unknown',
          outstanding_balance: balance?.total_outstanding_balance || 0,
          days_overdue: daysOverdue
        };
      });

      setOverdueLoans(processedLoans);
    } catch (error) {
      console.error('Error fetching overdue loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionsData = async () => {
    setLoading(true);
    try {
      // Fetch payment transactions in date range
      const { data: transactions, error: txnError } = await supabase
        .from('transactions')
        .select(`
          *,
          loans (loan_number, clients (first_name, last_name))
        `)
        .eq('txn_type', 'PAY')
        .gte('txn_date', dateRange.from)
        .lte('txn_date', dateRange.to)
        .order('txn_date', { ascending: false });

      if (txnError) throw txnError;

      const processedTransactions = (transactions || []).map(txn => {
        const loan = txn.loans;
        const client = loan?.clients;

        return {
          ...txn,
          loan_number: loan?.loan_number || 'N/A',
          client_name: client ? `${client.first_name} ${client.last_name}` : 'Unknown'
        };
      });

      setCollectionsData(processedTransactions);
    } catch (error) {
      console.error('Error fetching collections data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateCollectionsTotal = () => {
    return collectionsData.reduce((sum, txn) => sum + (txn.amount || 0), 0);
  };

  const calculateCollectionsTotalByType = (field) => {
    return collectionsData.reduce((sum, txn) => sum + (txn[field] || 0), 0);
  };

  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';

    if (activeReport === 'portfolio') {
      csvContent = 'Loan Number,Client Name,Principal,Interest Rate,Outstanding Balance,Status\n';
      portfolioData.loans.forEach(loan => {
        csvContent += `"${loan.loan_number}","${loan.client_name}",${loan.outstanding_principal},${loan.annual_interest_rate}%,${loan.outstanding_balance},"${loan.status}"\n`;
      });
      filename = 'portfolio_summary.csv';
    } else if (activeReport === 'overdue') {
      csvContent = 'Loan Number,Client Name,Due Date,Days Overdue,Outstanding Balance\n';
      overdueLoans.forEach(loan => {
        csvContent += `"${loan.loan_number}","${loan.client_name}",${loan.next_payment_due_date},${loan.days_overdue},${loan.outstanding_balance}\n`;
      });
      filename = 'overdue_loans.csv';
    } else if (activeReport === 'collections') {
      csvContent = 'Date,Loan Number,Client Name,Amount Paid,Fees,Interest,Principal\n';
      collectionsData.forEach(txn => {
        csvContent += `${txn.txn_date},"${txn.loan_number}","${txn.client_name}",${txn.amount},${txn.fees_applied || 0},${txn.interest_applied || 0},${txn.principal_applied || 0}\n`;
      });
      filename = 'collections_report.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div style={pageStyle}>
      <PageHeader
        title="Reports"
        subtitle="Financial and portfolio reporting"
        actions={
          <button onClick={exportToCSV} style={exportBtnStyle}>
            Export to CSV
          </button>
        }
      />

      {/* Report Tabs */}
      <div style={tabsContainerStyle}>
        <button
          style={activeReport === 'portfolio' ? activeTabStyle : tabStyle}
          onClick={() => setActiveReport('portfolio')}
        >
          Portfolio Summary
        </button>
        <button
          style={activeReport === 'overdue' ? activeTabStyle : tabStyle}
          onClick={() => setActiveReport('overdue')}
        >
          Overdue Loans
        </button>
        <button
          style={activeReport === 'collections' ? activeTabStyle : tabStyle}
          onClick={() => setActiveReport('collections')}
        >
          Collections
        </button>
      </div>

      {loading ? (
        <div style={loadingStyle}>Loading report data...</div>
      ) : (
        <>
          {/* PORTFOLIO SUMMARY REPORT */}
          {activeReport === 'portfolio' && (
            <div>
              {/* Summary Cards */}
              <div style={cardsContainerStyle}>
                <div style={cardStyle}>
                  <div style={cardLabelStyle}>Active Loans</div>
                  <div style={cardValueStyle}>{portfolioData.totalActiveLoans}</div>
                </div>
                <div style={cardStyle}>
                  <div style={cardLabelStyle}>Total Outstanding</div>
                  <div style={cardValueStyle}>{formatCurrency(portfolioData.totalOutstanding)}</div>
                </div>
                <div style={cardStyle}>
                  <div style={cardLabelStyle}>Principal Outstanding</div>
                  <div style={cardValueStyle}>{formatCurrency(portfolioData.totalPrincipal)}</div>
                </div>
                <div style={cardStyle}>
                  <div style={cardLabelStyle}>Interest Outstanding</div>
                  <div style={cardValueStyle}>{formatCurrency(portfolioData.totalInterest)}</div>
                </div>
                <div style={cardStyle}>
                  <div style={cardLabelStyle}>Unpaid Fees</div>
                  <div style={cardValueStyle}>{formatCurrency(portfolioData.totalFees)}</div>
                </div>
              </div>

              {/* Loans Table */}
              <div style={tableContainerStyle}>
                <h3 style={tableTitleStyle}>Active Loans Detail</h3>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderStyle}>
                      <th style={thStyle}>Loan Number</th>
                      <th style={thStyle}>Client Name</th>
                      <th style={thStyle}>Principal</th>
                      <th style={thStyle}>Interest Rate</th>
                      <th style={thStyle}>Outstanding Balance</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioData.loans.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={emptyStyle}>No active loans found</td>
                      </tr>
                    ) : (
                      portfolioData.loans.map(loan => (
                        <tr key={loan.id} style={rowStyle}>
                          <td style={tdStyle}>{loan.loan_number}</td>
                          <td style={tdStyle}>{loan.client_name}</td>
                          <td style={tdStyle}>{formatCurrency(loan.outstanding_principal)}</td>
                          <td style={tdStyle}>{loan.annual_interest_rate}%</td>
                          <td style={tdStyle}><strong>{formatCurrency(loan.outstanding_balance)}</strong></td>
                          <td style={tdStyle}>
                            <span style={statusBadgeStyle}>{loan.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OVERDUE LOANS REPORT */}
          {activeReport === 'overdue' && (
            <div style={tableContainerStyle}>
              <h3 style={tableTitleStyle}>Overdue Loans</h3>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderStyle}>
                    <th style={thStyle}>Loan Number</th>
                    <th style={thStyle}>Client Name</th>
                    <th style={thStyle}>Due Date</th>
                    <th style={thStyle}>Days Overdue</th>
                    <th style={thStyle}>Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueLoans.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={emptyStyle}>No overdue loans found</td>
                    </tr>
                  ) : (
                    overdueLoans.map(loan => (
                      <tr key={loan.id} style={{ ...rowStyle, background: '#fff5f5' }}>
                        <td style={tdStyle}>{loan.loan_number}</td>
                        <td style={tdStyle}>{loan.client_name}</td>
                        <td style={{ ...tdStyle, color: '#c53030', fontWeight: 600 }}>
                          {formatDate(loan.next_payment_due_date)}
                        </td>
                        <td style={{ ...tdStyle, color: '#c53030', fontWeight: 600 }}>
                          {loan.days_overdue} days
                        </td>
                        <td style={tdStyle}><strong>{formatCurrency(loan.outstanding_balance)}</strong></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* COLLECTIONS REPORT */}
          {activeReport === 'collections' && (
            <div>
              {/* Date Range Filter */}
              <div style={filterContainerStyle}>
                <div style={filterGroupStyle}>
                  <label style={filterLabelStyle}>From Date:</label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    style={dateInputStyle}
                  />
                </div>
                <div style={filterGroupStyle}>
                  <label style={filterLabelStyle}>To Date:</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    style={dateInputStyle}
                  />
                </div>
              </div>

              {/* Collections Table */}
              <div style={tableContainerStyle}>
                <h3 style={tableTitleStyle}>Payments Received</h3>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderStyle}>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Loan Number</th>
                      <th style={thStyle}>Client Name</th>
                      <th style={thStyle}>Amount Paid</th>
                      <th style={thStyle}>Fees</th>
                      <th style={thStyle}>Interest</th>
                      <th style={thStyle}>Principal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionsData.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={emptyStyle}>No payments found in this date range</td>
                      </tr>
                    ) : (
                      collectionsData.map(txn => (
                        <tr key={txn.id} style={rowStyle}>
                          <td style={tdStyle}>{formatDate(txn.txn_date)}</td>
                          <td style={tdStyle}>{txn.loan_number}</td>
                          <td style={tdStyle}>{txn.client_name}</td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: '#2e7d32' }}>
                            {formatCurrency(txn.amount)}
                          </td>
                          <td style={tdStyle}>{formatCurrency(txn.fees_applied)}</td>
                          <td style={tdStyle}>{formatCurrency(txn.interest_applied)}</td>
                          <td style={tdStyle}>{formatCurrency(txn.principal_applied)}</td>
                        </tr>
                      ))
                    )}
                    {collectionsData.length > 0 && (
                      <tr style={{ ...tableHeaderStyle, background: '#0176d3', color: '#fff' }}>
                        <td colSpan="3" style={{ ...tdStyle, fontWeight: 700, color: '#fff' }}>TOTAL</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#fff' }}>
                          {formatCurrency(calculateCollectionsTotal())}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#fff' }}>
                          {formatCurrency(calculateCollectionsTotalByType('fees_applied'))}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#fff' }}>
                          {formatCurrency(calculateCollectionsTotalByType('interest_applied'))}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#fff' }}>
                          {formatCurrency(calculateCollectionsTotalByType('principal_applied'))}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Styles
const pageStyle = {
  padding: '1.5rem',
  background: '#f8f9fa',
  minHeight: '100vh'
};

const tabsContainerStyle = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '2rem',
  borderBottom: '2px solid #e1e4e8',
  background: '#fff',
  padding: '0.5rem 1rem',
  borderRadius: '8px 8px 0 0'
};

const tabStyle = {
  padding: '0.75rem 1.5rem',
  background: 'none',
  border: 'none',
  borderBottom: '3px solid transparent',
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: 500,
  color: '#666',
  transition: 'all 0.2s'
};

const activeTabStyle = {
  ...tabStyle,
  color: '#0176d3',
  borderBottom: '3px solid #0176d3',
  fontWeight: 600
};

const cardsContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  marginBottom: '2rem'
};

const cardStyle = {
  background: '#fff',
  padding: '1.5rem',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  border: '1px solid #e1e4e8'
};

const cardLabelStyle = {
  fontSize: '0.85rem',
  color: '#666',
  marginBottom: '0.5rem',
  fontWeight: 500
};

const cardValueStyle = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#181818'
};

const tableContainerStyle = {
  background: '#fff',
  borderRadius: '8px',
  padding: '1.5rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  border: '1px solid #e1e4e8',
  overflowX: 'auto'
};

const tableTitleStyle = {
  margin: '0 0 1rem 0',
  fontSize: '1.1rem',
  color: '#0176d3',
  fontWeight: 600
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem'
};

const tableHeaderStyle = {
  background: '#f8f9fa',
  borderBottom: '2px solid #e1e4e8'
};

const thStyle = {
  padding: '0.75rem',
  textAlign: 'left',
  fontWeight: 600,
  color: '#181818',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.03em'
};

const rowStyle = {
  borderBottom: '1px solid #f0f0f0',
  transition: 'background 0.2s'
};

const tdStyle = {
  padding: '0.75rem',
  color: '#333'
};

const emptyStyle = {
  padding: '2rem',
  textAlign: 'center',
  color: '#999',
  fontStyle: 'italic'
};

const statusBadgeStyle = {
  background: '#cdfbc8',
  color: '#1e7e34',
  padding: '0.25rem 0.6rem',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase'
};

const filterContainerStyle = {
  background: '#fff',
  padding: '1.5rem',
  borderRadius: '8px',
  marginBottom: '1.5rem',
  display: 'flex',
  gap: '2rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  border: '1px solid #e1e4e8'
};

const filterGroupStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const filterLabelStyle = {
  fontWeight: 600,
  color: '#181818',
  fontSize: '0.9rem'
};

const dateInputStyle = {
  padding: '0.5rem',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.9rem'
};

const loadingStyle = {
  textAlign: 'center',
  padding: '3rem',
  color: '#666',
  fontSize: '1.1rem'
};

const exportBtnStyle = {
  background: '#0176d3',
  color: '#fff',
  border: 'none',
  padding: '0.6rem 1.2rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 600,
  transition: 'background 0.2s'
};

export default Reports;
