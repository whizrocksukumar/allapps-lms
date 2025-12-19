import React, { useState, useEffect } from 'react';
import { useLoans } from '../hooks/useLoans';
import { supabase } from "../services/supabaseService";
import PageHeader from '../components/PageHeader';
import Client360Modal from '../components/Client360Modal';
import Loans360Modal from '../components/Loans360Modal';
import NewLoanModal from '../components/NewLoanModal';

export default function Loans() {
  const { loans, loading, error, refetch } = useLoans();
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);

  // Modals
  const [showClient360, setShowClient360] = useState(false);
  const [showLoan360, setShowLoan360] = useState(false);
  const [showNewLoan, setShowNewLoan] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedLoanForEdit, setSelectedLoanForEdit] = useState(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('loan_number');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Load products and clients on mount
  useEffect(() => {
    fetchProducts();
    fetchClients();
  }, []);

  // Filter and sort when data changes
  useEffect(() => {
    filterAndSortLoans();
  }, [loans, search, statusFilter, sortBy, sortOrder, currentPage, pageSize]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_products')
        .select('id, product_name, annual_interest_rate')
        .eq('status', 'active')
        .order('product_name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, company_name')
        .order('first_name');

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  // Fuzzy search function
  const fuzzyMatch = (str, pattern) => {
    if (!str || !pattern) return false;
    str = str.toLowerCase();
    pattern = pattern.toLowerCase();

    let patternIdx = 0;
    for (let strIdx = 0; strIdx < str.length; strIdx++) {
      if (str[strIdx] === pattern[patternIdx]) {
        patternIdx++;
      }
      if (patternIdx === pattern.length) {
        return true;
      }
    }
    return false;
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const filterAndSortLoans = () => {
    let result = [...loans];

    // Apply filters
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => {
        const loanNumber = l.loan_number || '';
        const clientFirstName = l.client_id?.first_name || '';
        const clientLastName = l.client_id?.last_name || '';
        const companyName = l.client_id?.company_name || '';
        const status = l.status || '';

        // Fuzzy match on all searchable fields
        return (
          fuzzyMatch(loanNumber, q) ||
          fuzzyMatch(clientFirstName, q) ||
          fuzzyMatch(clientLastName, q) ||
          fuzzyMatch(companyName, q) ||
          fuzzyMatch(status, q)
        );
      });
    }

    if (statusFilter !== 'All') {
      result = result.filter(l => l.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'loan_number':
          aVal = a.loan_number || '';
          bVal = b.loan_number || '';
          break;
        case 'client_name':
          aVal = `${a.client_id?.first_name || ''} ${a.client_id?.last_name || ''}`.trim();
          bVal = `${b.client_id?.first_name || ''} ${b.client_id?.last_name || ''}`.trim();
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'opened':
          aVal = a.start_date || '';
          bVal = b.start_date || '';
          break;
        default:
          aVal = '';
          bVal = '';
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

    // Set total count and paginate
    setTotalCount(result.length);
    const startIdx = (currentPage - 1) * pageSize;
    const paginatedResult = result.slice(startIdx, startIdx + pageSize);

    setFilteredLoans(paginatedResult);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort order if clicking same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return ' ⇅';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const openClient = (clientId) => {
    setSelectedClientId(clientId);
    setShowClient360(true);
  };

  const openLoan = (loan) => {
    setSelectedLoan(loan);
    setShowLoan360(true);
  };

  const handleEditLoan = (loan) => {
    setSelectedLoanForEdit(loan);
    setShowNewLoan(true);
  };

  return (
    <div className="loans-page">
      <PageHeader
        title="Loans"
        subtitle="Manage loan accounts"
        actions={
          <button
            className="btn-primary"
            onClick={() => {
              setSelectedLoanForEdit(null);
              setShowNewLoan(true);
            }}
          >
            + New Loan
          </button>
        }
      />

      {/* Controls */}
      <div className="loans-controls">
        <div className="loans-search">
          <input
            type="text"
            placeholder="Search by loan number, client name, company, or status..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="loans-filters">
          <div className="status-filter-group">
            <span className="status-label">Status:</span>
            {['All', 'active', 'pending', 'closed', 'written off'].map(s => (
              <button
                key={s}
                className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter(s);
                  setCurrentPage(1);
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-stats">
          Showing {filteredLoans.length} of {totalCount} loans
          {totalCount > pageSize && ` (Page ${currentPage} of ${totalPages})`}
        </div>

        <table className="loans-table">
          <thead>
            <tr>
              <th
                onClick={() => handleSort('loan_number')}
                style={{ cursor: 'pointer' }}
              >
                Loan No.{getSortIcon('loan_number')}
              </th>
              <th
                onClick={() => handleSort('client_name')}
                style={{ cursor: 'pointer' }}
              >
                Client Name{getSortIcon('client_name')}
              </th>
              <th>Principal</th>
              <th>Balance</th>
              <th>Rate</th>
              <th>Term</th>
              <th
                onClick={() => handleSort('status')}
                style={{ cursor: 'pointer' }}
              >
                Status{getSortIcon('status')}
              </th>
              <th
                onClick={() => handleSort('opened')}
                style={{ cursor: 'pointer' }}
              >
                Opened{getSortIcon('opened')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="loading-state">Loading...</td></tr>
            ) : filteredLoans.length === 0 ? (
              <tr><td colSpan="9" className="empty-state">No loans found.</td></tr>
            ) : (
              filteredLoans.map(loan => (
                <tr key={loan.id}>
                  <td>
                    <button
                      className="loan-link"
                      onClick={() => openLoan(loan)}
                    >
                      {loan.loan_number}
                    </button>
                  </td>
                  <td>
                    <button
                      className="client-link"
                      onClick={() => openClient(loan.client_id?.id)}
                    >
                      {loan.client_id?.first_name} {loan.client_id?.last_name}
                      {loan.client_id?.company_name && (
                        <div style={{ fontSize: '0.85em', color: '#706e6b' }}>
                          {loan.client_id.company_name}
                        </div>
                      )}
                    </button>
                  </td>
                  <td>${loan.loan_amount?.toFixed(2)}</td>
                  <td>${loan.current_outstanding_balance?.toFixed(2) || '0.00'}</td>
                  <td>{loan.annual_interest_rate}%</td>
                  <td>{loan.instalments_due} {loan.term === 'Weekly' ? 'wks' : loan.term === 'Fortnightly' ? 'fn' : 'mths'}</td>
                  <td>
                    <span className={`status-badge ${loan.status?.toLowerCase().replace(' ', '-') || ''}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td>{loan.start_date}</td>
                  <td>
                    <div className="action-cell">
                      {loan.status?.toLowerCase() === 'active' && (
                        <button
                          className="btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLoan(loan);
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
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

      {/* New Loan Modal */}
      {showNewLoan && (
        <NewLoanModal
          onClose={() => {
            setShowNewLoan(false);
            setSelectedLoanForEdit(null);
          }}
          reloadLoans={refetch}
          initialLoan={selectedLoanForEdit}
          initialMode={selectedLoanForEdit ? 'consolidation' : 'new'}
        />
      )}

      {showClient360 && (
        <Client360Modal
          isOpen={showClient360}
          onClose={() => setShowClient360(false)}
          clientId={selectedClientId}
        />
      )}

      {showLoan360 && (
        <Loans360Modal
          loan={selectedLoan}
          onClose={() => setShowLoan360(false)}
        />
      )}
    </div>
  );
}