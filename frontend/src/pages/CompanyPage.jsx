import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { searchCompaniesApi, createCompanyApi, deleteCompanyApi, updateCompanyApi } from '../services/companyApi';

const ITEMS_PER_PAGE = 10;

export const CompanyPage = () => {
  const { toasts, removeToast, toast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadCompanies = useCallback(async (page, search) => {
    setLoading(true);

    const result = await searchCompaniesApi({
      page,
      limit: ITEMS_PER_PAGE,
      search,
    });

    // If API succeeded, update companies and pagination
    if (result.success) {
      setCompanies(result.companies);
      setPagination(result.pagination);
    } else if (result.message) {
      toast.warning(result.message);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadCompanies(currentPage, searchQuery);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadCompanies(1, searchQuery);
  };

  const handleSearchKeyDown = (e) => {
    // If user presses Enter, trigger search
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    loadCompanies(1, '');
  };

  const handlePageChange = (page) => {
    // If page is within valid range, change to that page
    if (page >= 1 && pagination && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  const openCreateForm = () => {
    setEditingCompany(null);
    setFormData({ name: '', description: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (company) => {
    setEditingCompany(company);
    setFormData({ name: company.name, description: company.description });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCompany(null);
    setFormData({ name: '', description: '' });
    setFormError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // If company name is empty, show validation error
    if (!formData.name.trim()) {
      setFormError('Company name is required.');
      return;
    }

    setSaving(true);

    // If editing, call update API; otherwise call create API
    if (editingCompany) {
      const result = await updateCompanyApi(
        editingCompany.id,
        formData.name.trim(),
        formData.description.trim()
      );

      // If update succeeded, reload list and show success toast
      if (result.success) {
        toast.success(result.message || 'Company updated successfully.');
        closeForm();
        loadCompanies(currentPage, searchQuery);
      } else {
        toast.error(result.message);
      }
    } else {
      const result = await createCompanyApi(
        formData.name.trim(),
        formData.description.trim()
      );

      // If creation succeeded, reload list and show success toast
      if (result.success) {
        toast.success(result.message || 'Company created successfully.');
        closeForm();
        loadCompanies(currentPage, searchQuery);
      } else {
        toast.error(result.message);
      }
    }

    setSaving(false);
  };

  const handleDelete = async (company) => {
    // If user cancels the confirmation dialog, abort deletion
    if (!confirm(`Are you sure you want to delete "${company.name}"?`)) {
      return;
    }

    const result = await deleteCompanyApi(company.id);

    // If deletion succeeded, reload list and show success toast
    if (result.success) {
      toast.success(result.message || 'Company deleted.');
      loadCompanies(currentPage, searchQuery);
    } else {
      toast.error(result.message);
    }
  };

  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems || companies.length;

  const pageNumbers = [];
  // Loop to generate page number buttons based on total pages
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const s = {
    page: { maxWidth: '800px', margin: '0 auto', padding: '24px' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' },
    subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
    addBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    filterBar: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' },
    searchWrap: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', flex: 1, minWidth: '200px' },
    searchInput: { border: 'none', outline: 'none', fontSize: '14px', width: '100%', background: 'transparent' },
    searchBtn: { padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    clearBtn: { padding: '8px 14px', fontSize: '13px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' },
    filterInfo: { fontSize: '13px', color: '#64748b', marginBottom: '12px' },
    table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    th: { textAlign: 'left', padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#64748b', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
    td: { padding: '14px 16px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f1f5f9' },
    actionBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' },
    emptyRow: { textAlign: 'center', padding: '40px 16px', color: '#94a3b8', fontSize: '14px' },
    loadingRow: { textAlign: 'center', padding: '40px 16px', color: '#64748b', fontSize: '14px' },
    idBadge: { display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: '#f1f5f9', color: '#374151', border: '1px solid #e2e8f0' },
    paginationRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '12px 0' },
    paginationInfo: { fontSize: '13px', color: '#64748b' },
    paginationButtons: { display: 'flex', alignItems: 'center', gap: '4px' },
    pageBtn: (active) => ({ padding: '6px 12px', fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? '#fff' : '#374151', background: active ? '#2563eb' : '#fff', border: '1px solid ' + (active ? '#2563eb' : '#d1d5db'), borderRadius: '6px', cursor: 'pointer', minWidth: '36px', textAlign: 'center' }),
    navBtn: (disabled) => ({ padding: '6px 10px', fontSize: '13px', color: disabled ? '#cbd5e1' : '#374151', background: '#fff', border: '1px solid ' + (disabled ? '#e2e8f0' : '#d1d5db'), borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }),
    // Form modal
    backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '480px', overflow: 'hidden' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' },
    modalTitle: { fontSize: '17px', fontWeight: 700, color: '#1e293b', margin: 0 },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' },
    modalBody: { padding: '24px' },
    fieldGroup: { marginBottom: '16px' },
    label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
    input: { width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
    error: { background: '#fef2f2', color: '#dc2626', fontSize: '13px', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #fecaca' },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' },
    cancelBtn: { padding: '8px 20px', fontSize: '14px', fontWeight: 600, color: '#374151', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' },
    saveBtn: (disabled) => ({ padding: '8px 20px', fontSize: '14px', fontWeight: 600, color: '#fff', background: disabled ? '#93c5fd' : '#2563eb', border: 'none', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer' }),
  };

  return (
    <div style={s.page}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div style={s.headerRow}>
        <div>
          <h1 style={s.title}><Building2 size={28} /> Company Management</h1>
          <p style={s.subtitle}>Manage companies in the recruitment system.</p>
        </div>
        <button type="button" style={s.addBtn} onClick={openCreateForm}>
          <Plus size={16} /> Add Company
        </button>
      </div>

      {/* Search */}
      <div style={s.filterBar}>
        <div style={s.searchWrap}>
          <Search size={16} style={{ color: '#94a3b8' }} />
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search by company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <button type="button" style={s.searchBtn} onClick={handleSearch}>
          Search
        </button>
        {/* If search query is not empty, show clear button */}
        {searchQuery && (
          <button type="button" style={s.clearBtn} onClick={handleClearSearch}>
            Clear
          </button>
        )}
      </div>

      <p style={s.filterInfo}>
        Total: {totalItems} companies
        {searchQuery && ` • Search: "${searchQuery}"`}
        {pagination && ` • Page ${pagination.currentPage} of ${pagination.totalPages}`}
      </p>

      {/* Table */}
      <table style={s.table}>
        <thead>
          <tr>
            <th style={{ ...s.th, width: '80px' }}>ID</th>
            <th style={s.th}>Company Name</th>
            <th style={s.th}>Description</th>
            <th style={{ ...s.th, textAlign: 'center', width: '100px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* If still loading, show loading message */}
          {loading ? (
            <tr>
              <td colSpan={4} style={s.loadingRow}>Loading companies...</td>
            </tr>
          ) : companies.length === 0 ? (
            <tr>
              <td colSpan={4} style={s.emptyRow}>
                {searchQuery
                  ? `No companies match "${searchQuery}".`
                  : 'No companies yet. Click "Add Company" to create one.'}
              </td>
            </tr>
          ) : (
            // Loop through companies to render each row
            companies.map((c) => (
              <tr key={c.id}>
                <td style={s.td}>
                  <span style={s.idBadge}>{c.id}</span>
                </td>
                <td style={s.td}><strong>{c.name}</strong></td>
                <td style={{ ...s.td, color: '#64748b' }}>{c.description || '—'}</td>
                <td style={{ ...s.td, textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      style={{ ...s.actionBtn, color: '#3b82f6' }}
                      onClick={() => openEditForm(c)}
                      title="Edit company"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      style={{ ...s.actionBtn, color: '#ef4444' }}
                      onClick={() => handleDelete(c)}
                      title="Delete company"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={s.paginationRow}>
          <span style={s.paginationInfo}>
            Page {pagination.currentPage} of {pagination.totalPages} • {totalItems} companies
          </span>

          <div style={s.paginationButtons}>
            <button
              type="button"
              style={s.navBtn(currentPage <= 1)}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Loop through page numbers to render pagination buttons */}
            {pageNumbers.map((num) => (
              <button
                key={num}
                type="button"
                style={s.pageBtn(num === currentPage)}
                onClick={() => handlePageChange(num)}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              style={s.navBtn(currentPage >= totalPages)}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={s.backdrop}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>
                {editingCompany ? 'Edit Company' : 'Add New Company'}
              </h2>
              <button type="button" style={s.closeBtn} onClick={closeForm}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={s.modalBody}>
                {formError && <div style={s.error}>{formError}</div>}

                <div style={s.fieldGroup}>
                  <label style={s.label}>Company Name *</label>
                  <input
                    style={s.input}
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Molex Vietnam Co., Ltd."
                    disabled={saving}
                    autoFocus
                  />
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.label}>Description</label>
                  <textarea
                    style={s.textarea}
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="e.g. Manufacturing company in Hanoi"
                    rows={3}
                    disabled={saving}
                  />
                </div>
              </div>

              <div style={s.modalFooter}>
                <button type="button" style={s.cancelBtn} onClick={closeForm}>Cancel</button>
                <button type="submit" style={s.saveBtn(saving)} disabled={saving}>
                  {saving
                    ? (editingCompany ? 'Saving...' : 'Creating...')
                    : (editingCompany ? 'Save Changes' : 'Create Company')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};