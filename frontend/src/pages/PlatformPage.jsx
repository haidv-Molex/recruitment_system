import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { searchPlatformsApi, createPlatformApi, deletePlatformApi, updatePlatformApi } from '../services/platformApi';

const ITEMS_PER_PAGE = 10;

export const PlatformPage = () => {
  const { toasts, removeToast, toast } = useToast();
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadPlatforms = useCallback(async (page, search) => {
    setLoading(true);
    try {
      const result = await searchPlatformsApi({ page, limit: ITEMS_PER_PAGE, search });
      setPlatforms(result.data || []);
      if (result.pagination) setPagination(result.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load platforms.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPlatforms(1, '');
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    loadPlatforms(1, searchQuery);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    loadPlatforms(1, '');
  };

  const handlePageChange = (page) => {
    if (page >= 1 && pagination && page <= pagination.total_pages) {
      setCurrentPage(page);
      loadPlatforms(page, searchQuery);
    }
  };

  const openCreateForm = () => {
    setEditingPlatform(null);
    setFormData({ name: '', description: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (platform) => {
    setEditingPlatform(platform);
    setFormData({ name: platform.platform_name, description: platform.platform_description || '' });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPlatform(null);
    setFormData({ name: '', description: '' });
    setFormError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Platform name is required.');
      return;
    }

    setSaving(true);

    if (editingPlatform) {
      try {
        await updatePlatformApi(editingPlatform.platform_id, formData.name.trim(), formData.description.trim());
        toast.success('Platform updated successfully.');
        closeForm();
        loadPlatforms(currentPage, searchQuery);
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Update failed.');
      }
    } else {
      try {
        await createPlatformApi(formData.name.trim(), formData.description.trim());
        toast.success('Platform created successfully.');
        closeForm();
        loadPlatforms(currentPage, searchQuery);
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Create failed.');
      }
    }

    setSaving(false);
  };

  const handleDelete = async (platform) => {
    if (!confirm(`Are you sure you want to delete "${platform.platform_name}"?`)) return;

    try {
      await deletePlatformApi(platform.platform_id);
      toast.success('Platform deleted.');
      loadPlatforms(currentPage, searchQuery);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

  const totalPages = pagination?.total_pages || 1;
  const totalItems = pagination?.total_items || platforms.length;
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);

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

      <div style={s.headerRow}>
        <div>
          <h1 style={s.title}><Globe size={28} /> Platform Management</h1>
          <p style={s.subtitle}>Manage recruitment platforms (TopCV, LinkedIn, etc.)</p>
        </div>
        <button type="button" style={s.addBtn} onClick={openCreateForm}>
          <Plus size={16} /> Add Platform
        </button>
      </div>

      <div style={s.filterBar}>
        <div style={s.searchWrap}>
          <Search size={16} style={{ color: '#94a3b8' }} />
          <input style={s.searchInput} type="text" placeholder="Search by platform name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} />
        </div>
        <button type="button" style={s.searchBtn} onClick={handleSearch}>Search</button>
        {searchQuery && <button type="button" style={s.clearBtn} onClick={handleClearSearch}>Clear</button>}
      </div>

      <p style={s.filterInfo}>
        Total: {totalItems} platforms
        {searchQuery && ` • Search: "${searchQuery}"`}
        {pagination && ` • Page ${pagination.current_page} of ${pagination.total_pages}`}
      </p>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={{ ...s.th, width: '80px' }}>ID</th>
            <th style={s.th}>Platform Name</th>
            <th style={s.th}>Description</th>
            <th style={{ ...s.th, textAlign: 'center', width: '100px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} style={s.loadingRow}>Loading platforms...</td></tr>
          ) : platforms.length === 0 ? (
            <tr>
              <td colSpan={4} style={s.emptyRow}>
                {searchQuery ? `No platforms match "${searchQuery}".` : 'No platforms yet. Click "Add Platform" to create one.'}
              </td>
            </tr>
          ) : (
            platforms.map((p) => (
              <tr key={p.platform_id}>
                <td style={s.td}><span style={s.idBadge}>{p.platform_id}</span></td>
                <td style={s.td}><strong>{p.platform_name}</strong></td>
                <td style={{ ...s.td, color: '#64748b' }}>{p.platform_description || '—'}</td>
                <td style={{ ...s.td, textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button type="button" style={{ ...s.actionBtn, color: '#3b82f6' }} onClick={() => openEditForm(p)} title="Edit"><Edit2 size={16} /></button>
                    <button type="button" style={{ ...s.actionBtn, color: '#ef4444' }} onClick={() => handleDelete(p)} title="Delete"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && pagination.total_pages > 1 && (
        <div style={s.paginationRow}>
          <span style={s.paginationInfo}>Page {pagination.current_page} of {pagination.total_pages} • {totalItems} platforms</span>
          <div style={s.paginationButtons}>
            <button type="button" style={s.navBtn(currentPage <= 1)} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}><ChevronLeft size={16} /></button>
            {pageNumbers.map((num) => (
              <button key={num} type="button" style={s.pageBtn(num === currentPage)} onClick={() => handlePageChange(num)}>{num}</button>
            ))}
            <button type="button" style={s.navBtn(currentPage >= totalPages)} onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {showForm && (
        <div style={s.backdrop}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{editingPlatform ? 'Edit Platform' : 'Add New Platform'}</h2>
              <button type="button" style={s.closeBtn} onClick={closeForm}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={s.modalBody}>
                {formError && <div style={s.error}>{formError}</div>}
                <div style={s.fieldGroup}>
                  <label style={s.label}>Platform Name *</label>
                  <input style={s.input} name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g. TopCV, LinkedIn, VietnamWorks" disabled={saving} autoFocus />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Description</label>
                  <textarea style={s.textarea} name="description" value={formData.description} onChange={handleFormChange} placeholder="e.g. Nền tảng tuyển dụng hàng đầu Việt Nam" rows={3} disabled={saving} />
                </div>
              </div>
              <div style={s.modalFooter}>
                <button type="button" style={s.cancelBtn} onClick={closeForm}>Cancel</button>
                <button type="submit" style={s.saveBtn(saving)} disabled={saving}>
                  {saving ? (editingPlatform ? 'Saving...' : 'Creating...') : (editingPlatform ? 'Save Changes' : 'Create Platform')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};