import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import PageHeader from '../components/PageHeader';
import Client360Modal from '../components/Client360Modal';
import EditClientModal from '../components/EditClientModal';
import NewClientModal from '../components/NewClientModal';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loansData, setLoansData] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClient360, setShowClient360] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Sorting
  const [sortBy, setSortBy] = useState('first_name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Load clients and loans on mount
  useEffect(() => {
    fetchClients();
    fetchLoans();
  }, []);

  // Filter and sort when data changes
  useEffect(() => {
    filterAndSortClients();
  }, [clients, loansData, search, statusFilter, sortBy, sortOrder, currentPage, pageSize]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('first_name');

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('id, client_id, loan_number, status');

      if (error) throw error;
      setLoansData(data || []);
    } catch (err) {
      console.error('Error fetching loans:', err);
    }
  };

  const getClientLoans = (clientId) => {
    return loansData.filter(l => l.client_id === clientId);
  };

  const getPrimaryLoan = (clientId) => {
    const clientLoans = getClientLoans(clientId);
    const activeLoan = clientLoans.find(l => l.status === 'active');
    return activeLoan || clientLoans[0];
  };

  const filterAndSortClients = () => {
    let result = [...clients];

    // Apply search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        (c.first_name && c.first_name.toLowerCase().includes(q)) ||
        (c.last_name && c.last_name.toLowerCase().includes(q)) ||
        (c.client_code && c.client_code.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.company_name && c.company_name.toLowerCase().includes(q))
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'first_name':
          aVal = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          bVal = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          break;
        case 'company_name':
          aVal = (a.company_name || '').toLowerCase();
          bVal = (b.company_name || '').toLowerCase();
          break;
        case 'region':
          aVal = (a.region || '').toLowerCase();
          bVal = (b.region || '').toLowerCase();
          break;
        case 'status':
          aVal = (a.status || '').toLowerCase();
          bVal = (b.status || '').toLowerCase();
          break;
        case 'loan_number':
          const aLoan = getPrimaryLoan(a.id);
          const bLoan = getPrimaryLoan(b.id);
          aVal = (aLoan?.loan_number || '').toLowerCase();
          bVal = (bLoan?.loan_number || '').toLowerCase();
          break;
        case 'loan_status':
          const aLoanStatus = getPrimaryLoan(a.id);
          const bLoanStatus = getPrimaryLoan(b.id);
          aVal = (aLoanStatus?.status || '').toLowerCase();
          bVal = (bLoanStatus?.status || '').toLowerCase();
          break;
        default:
          aVal = '';
          bVal = '';
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

    // Set total count and paginate
    setTotalCount(result.length);
    const startIdx = (currentPage - 1) * pageSize;
    const paginatedResult = result.slice(startIdx, startIdx + pageSize);

    setFilteredClients(paginatedResult);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return ' ⇅';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleExport = async (format) => {
    try {
      const exportData = filteredClients.map(c => {
        const primaryLoan = getPrimaryLoan(c.id);
        return {
          'First Name': c.first_name || '',
          'Last Name': c.last_name || '',
          'Client Code': c.client_code || '',
          'Company Name': c.company_name || '',
          'Email': c.email || '',
          'Phone': c.phone || '',
          'Mobile': c.mobile_phone || '',
          'Address': c.address || '',
          'City': c.city || '',
          'Region': c.region || '',
          'Postcode': c.postcode || '',
          'Status': c.status || '',
          'Loan No.': primaryLoan?.loan_number || '-',
          'Loan Status': primaryLoan?.status || '-'
        };
      });

      if (format === 'csv') {
        exportAsCSV(exportData);
      } else if (format === 'pdf') {
        exportAsPDF(exportData);
      }
    } catch (err) {
      console.error('Error exporting:', err);
      alert('Failed to export data');
    }
  };

  const exportAsCSV = (data) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    let csvContent = headers.join(',') + '\n';

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvContent += values.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clients_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportAsPDF = async (data) => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = await import('jspdf-autotable');

      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text('Clients Export', 14, 22);

      doc.setFontSize(10);
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, 32);
      doc.text(`Total Records: ${data.length}`, 14, 38);

      const headers = Object.keys(data[0]);
      const tableData = data.map(row => headers.map(header => row[header] || '-'));

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [0, 118, 211], textColor: 255, fontStyle: 'bold' },
        margin: { top: 45, right: 14, bottom: 14, left: 14 },
        didDrawPage: function(data) {
          const pageCount = doc.internal.pages.length - 1;
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }
      });

      doc.save(`clients_export_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('PDF generation not available. Please use CSV export instead.');
    }
  };

  const handleSave = async (updatedClient) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(updatedClient)
        .eq('id', updatedClient.id);

      if (error) throw error;

      if (selectedClient?.id === updatedClient.id) {
        setSelectedClient(updatedClient);
      }
      setShowEdit(false);
      fetchClients();
    } catch (err) {
      console.error('Error saving client:', err);
      alert('Failed to save client');
    }
  };

  const handleClientAdded = () => {
    fetchClients();
    setShowNew(false);
  };

  return (
    <div className="clients-page" style={{ borderTop: '4px solid #0176d3' }}>
      <PageHeader
        title="Clients"
        subtitle="Manage your loan clients"
        actions={
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            + New Client
          </button>
        }
      />

      {/* Controls */}
      <div className="clients-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="clients-search" style={{ maxWidth: '300px', flex: '0 0 300px' }}>
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: '100%' }}
          />
        </div>
        <div className="clients-filters" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <div className="status-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="status-label">Status:</span>
            {['All', 'Active', 'Inactive'].map(s => (
              <button
                key={s}
                className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter(s);
                  setCurrentPage(1);
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="export-group" style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            <button className="filter-btn" onClick={() => handleExport('csv')}>
              Export CSV
            </button>
            <button className="filter-btn" onClick={() => handleExport('pdf')}>
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-stats">
          Showing {filteredClients.length} of {totalCount} clients
          {totalCount > pageSize && ` (Page ${currentPage} of ${totalPages})`}
        </div>

        <table className="clients-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}><input type="checkbox" /></th>
              <th>Action</th>
              <th
                onClick={() => handleSort('first_name')}
                style={{ cursor: 'pointer' }}
              >
                Client Name{getSortIcon('first_name')}
              </th>
              <th>Address</th>
              <th
                onClick={() => handleSort('region')}
                style={{ cursor: 'pointer' }}
              >
                Region{getSortIcon('region')}
              </th>
              <th>Phone</th>
              <th>Email</th>
              <th
                onClick={() => handleSort('loan_number')}
                style={{ cursor: 'pointer' }}
              >
                Loan No.{getSortIcon('loan_number')}
              </th>
              <th
                onClick={() => handleSort('loan_status')}
                style={{ cursor: 'pointer' }}
              >
                Loan Status{getSortIcon('loan_status')}
              </th>
              <th
                onClick={() => handleSort('status')}
                style={{ cursor: 'pointer' }}
              >
                Status{getSortIcon('status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="loading-state">Loading...</td></tr>
            ) : filteredClients.length === 0 ? (
              <tr><td colSpan="10" className="empty-state">No clients found.</td></tr>
            ) : (
              filteredClients.map(client => {
                const primaryLoan = getPrimaryLoan(client.id);
                return (
                  <tr key={client.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div className="action-cell">
                        <button
                          className="btn-sm"
                          onClick={() => { setSelectedClient(client); setShowClient360(true); }}
                        >
                          View
                        </button>
                        <button
                          className="btn-sm"
                          onClick={() => { setSelectedClient(client); setShowEdit(true); }}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                    <td
                      className="client-link"
                      onClick={() => { setSelectedClient(client); setShowClient360(true); }}
                    >
                      {client.first_name} {client.last_name}
                    </td>
                    <td>{client.address || '-'}</td>
                    <td>{client.region || '-'}</td>
                    <td>{client.phone || '-'}</td>
                    <td>{client.email || '-'}</td>
                    <td>
                      {primaryLoan ? (
                        <button
                          className="loan-link"
                          onClick={() => { setSelectedClient(client); setShowClient360(true); }}
                        >
                          {primaryLoan.loan_number}
                        </button>
                      ) : '-'}
                    </td>
                    <td>
                      {primaryLoan && (
                        <span className={`status-badge ${primaryLoan.status?.toLowerCase() || ''}`}>
                          {primaryLoan.status}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${client.status?.toLowerCase() || ''}`}>
                        {client.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="pagination-controls">
          <div className="page-size-selector">
            <span>Show:</span>
            {[20, 50, 100].map(size => (
              <button
                key={size}
                className={`page-size-btn ${pageSize === size ? 'active' : ''}`}
                onClick={() => handlePageSizeChange(size)}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="pagination-nav">
            <button
              className="btn-pagination"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            >
              ← Previous
            </button>

            <div className="page-info">
              Page {currentPage} of {totalPages}
            </div>

            <button
              className="btn-pagination"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showClient360 && selectedClient && (
        <Client360Modal
          isOpen={showClient360}
          onClose={() => setShowClient360(false)}
          clientId={selectedClient.id}
        />
      )}

      {showEdit && selectedClient && (
        <EditClientModal
          client={selectedClient}
          onClose={() => setShowEdit(false)}
          onSave={handleSave}
        />
      )}

      {showNew && (
        <NewClientModal
          onClose={() => setShowNew(false)}
          reloadClients={handleClientAdded}
        />
      )}
    </div>
  );
};

export default Clients;