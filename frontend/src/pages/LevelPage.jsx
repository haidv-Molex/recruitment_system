import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { searchLevelsApi, createLevelApi, deleteLevelApi, updateLevelApi } from '../services/levelApi';

const ITEMS_PER_PAGE = 10;

export const LevelPage = () => {
    const { toasts, removeToast, toast } = useToast();
    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [editingLevel, setEditingLevel] = useState(null);
    const [formData, setFormData] = useState({ code: '', name: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const loadLevels = useCallback(async (page, search) => {
        setLoading(true);
        try {
            const result = await searchLevelsApi({ page, limit: ITEMS_PER_PAGE, search });
            setLevels(result.data || []);
            if (result.pagination) setPagination(result.pagination);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed to load levels.');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadLevels(1, '');
    }, []);

    const handleSearch = () => {
        setCurrentPage(1);
        loadLevels(1, searchQuery);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setCurrentPage(1);
        loadLevels(1, '');
    };

    const handlePageChange = (page) => {
        if (page >= 1 && pagination && page <= pagination.total_pages) {
            setCurrentPage(page);
            loadLevels(page, searchQuery);
        }
    };

    const openCreateForm = () => {
        setEditingLevel(null);
        setFormData({ code: '', name: '', description: '' });
        setFormError('');
        setShowForm(true);
    };

    const openEditForm = (lvl) => {
        setEditingLevel(lvl);
        setFormData({ code: lvl.level_code || '', name: lvl.level_name, description: lvl.level_description || '' });
        setFormError('');
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingLevel(null);
        setFormData({ code: '', name: '', description: '' });
        setFormError('');
    };


    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!formData.code.trim()) {
            setFormError('Level Code is required.');
            return;
        }

        if (!formData.name.trim()) {
            setFormError('Level Name is required.');
            return;
        }

        setSaving(true);

        if (editingLevel) {
            try {
                await updateLevelApi(editingLevel.level_id, formData.code.trim(), formData.name.trim(), formData.description.trim());
                toast.success('Level updated successfully.');
                closeForm();
                loadLevels(currentPage, searchQuery);
            } catch (err) {
                toast.error(err.response?.data?.message || err.message || 'Update failed.');
            }
        } else {
            try {
                await createLevelApi(formData.code.trim(), formData.name.trim(), formData.description.trim());
                toast.success('Level created successfully.');
                closeForm();
                loadLevels(currentPage, searchQuery);
            } catch (err) {
                toast.error(err.response?.data?.message || err.message || 'Create failed.');
            }
        }

        setSaving(false);
    };

    const handleDelete = async (lvl) => {
        if (!confirm(`Are you sure you want to delete "${lvl.level_code} — ${lvl.level_name}"?`)) return;

        try {
            await deleteLevelApi(lvl.level_id);
            toast.success('Level deleted.');
            loadLevels(currentPage, searchQuery);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Delete failed.');
        }
    };

    const totalPages = pagination?.total_pages || 1;
    const totalItems = pagination?.total_items || levels.length;
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);

    const s = {
        page: { maxWidth: '900px', margin: '0 auto', padding: '24px' },
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
        codeBadge: { display: 'inline-block', padding: '3px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, background: '#faf5ff', color: '#7c3aed', border: '1px solid #e9d5ff', letterSpacing: '0.5px' },
        idBadge: { display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: '#f1f5f9', color: '#374151', border: '1px solid #e2e8f0' },
        paginationRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '12px 0' },
        paginationInfo: { fontSize: '13px', color: '#64748b' },
        paginationButtons: { display: 'flex', alignItems: 'center', gap: '4px' },
        pageBtn: (active) => ({ padding: '6px 12px', fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? '#fff' : '#374151', background: active ? '#2563eb' : '#fff', border: '1px solid ' + (active ? '#2563eb' : '#d1d5db'), borderRadius: '6px', cursor: 'pointer', minWidth: '36px', textAlign: 'center' }),
        navBtn: (disabled) => ({ padding: '6px 10px', fontSize: '13px', color: disabled ? '#cbd5e1' : '#374151', background: '#fff', border: '1px solid ' + (disabled ? '#e2e8f0' : '#d1d5db'), borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }),
        backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
        modal: { background: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '500px', overflow: 'hidden' },
        modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' },
        modalTitle: { fontSize: '17px', fontWeight: 700, color: '#1e293b', margin: 0 },
        closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' },
        modalBody: { padding: '24px' },
        fieldGroup: { marginBottom: '16px' },
        label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
        input: { width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' },
        textarea: { width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
        hint: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' },
        error: { background: '#fef2f2', color: '#dc2626', fontSize: '13px', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #fecaca' },
        row: { display: 'flex', gap: '12px' },
        half: { flex: 1 },
        modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' },
        cancelBtn: { padding: '8px 20px', fontSize: '14px', fontWeight: 600, color: '#374151', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' },
        saveBtn: (disabled) => ({ padding: '8px 20px', fontSize: '14px', fontWeight: 600, color: '#fff', background: disabled ? '#93c5fd' : '#2563eb', border: 'none', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer' }),
    };

    return (
        <div style={s.page}>
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div style={s.headerRow}>
                <div>
                    <h1 style={s.title}><Award size={28} /> Level Management</h1>
                    <p style={s.subtitle}>Manage employee levels / grades (Engineer, Manager, etc.)</p>
                </div>
                <button type="button" style={s.addBtn} onClick={openCreateForm}>
                    <Plus size={16} /> Add Level
                </button>
            </div>

            <div style={s.filterBar}>
                <div style={s.searchWrap}>
                    <Search size={16} style={{ color: '#94a3b8' }} />
                    <input style={s.searchInput} type="text" placeholder="Search by code or level name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} />
                </div>
                <button type="button" style={s.searchBtn} onClick={handleSearch}>Search</button>
                {searchQuery && <button type="button" style={s.clearBtn} onClick={handleClearSearch}>Clear</button>}
            </div>

            <p style={s.filterInfo}>
                Total: {totalItems} levels
                {searchQuery && ` • Search: "${searchQuery}"`}
                {pagination && ` • Page ${pagination.current_page} of ${pagination.total_pages}`}
            </p>

            <table style={s.table}>
                <thead>
                    <tr>
                        <th style={{ ...s.th, width: '60px' }}>ID</th>
                        <th style={{ ...s.th, width: '120px' }}>Code</th>
                        <th style={s.th}>Level Name</th>
                        <th style={s.th}>Description</th>
                        <th style={{ ...s.th, textAlign: 'center', width: '100px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={5} style={s.loadingRow}>Loading levels...</td></tr>
                    ) : levels.length === 0 ? (
                        <tr>
                            <td colSpan={5} style={s.emptyRow}>
                                {searchQuery ? `No levels match "${searchQuery}".` : 'No levels yet. Click "Add Level" to create one.'}
                            </td>
                        </tr>
                    ) : (
                        levels.map((lvl) => (
                            <tr key={lvl.level_id}>
                                <td style={s.td}><span style={s.idBadge}>{lvl.level_id}</span></td>
                                <td style={s.td}><span style={s.codeBadge}>{lvl.level_code}</span></td>
                                <td style={s.td}><strong>{lvl.level_name}</strong></td>
                                <td style={{ ...s.td, color: '#64748b' }}>{lvl.level_description || '—'}</td>
                                <td style={{ ...s.td, textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                        <button type="button" style={{ ...s.actionBtn, color: '#3b82f6' }} onClick={() => openEditForm(lvl)} title="Edit"><Edit2 size={16} /></button>
                                        <button type="button" style={{ ...s.actionBtn, color: '#ef4444' }} onClick={() => handleDelete(lvl)} title="Delete"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {pagination && pagination.total_pages > 1 && (
                <div style={s.paginationRow}>
                    <span style={s.paginationInfo}>Page {pagination.current_page} of {pagination.total_pages} • {totalItems} levels</span>
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
                            <h2 style={s.modalTitle}>{editingLevel ? 'Edit Level' : 'Add New Level'}</h2>
                            <button type="button" style={s.closeBtn} onClick={closeForm}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={s.modalBody}>
                                {formError && <div style={s.error}>{formError}</div>}
                                <div style={s.row}>
                                    <div style={{ ...s.fieldGroup, ...s.half }}>
                                        <label style={s.label}>Code *</label>
                                        <input style={s.input} name="code" value={formData.code} onChange={handleFormChange} placeholder="e.g. ENG" disabled={saving} autoFocus />
                                        <p style={s.hint}>Short code, e.g. ENG, MGR, DIR, VP</p>
                                    </div>
                                    <div style={{ ...s.fieldGroup, ...s.half }}>
                                        <label style={s.label}>Level Name *</label>
                                        <input style={s.input} name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g. Engineer" disabled={saving} />
                                    </div>
                                </div>
                                <div style={s.fieldGroup}>
                                    <label style={s.label}>Description</label>
                                    <textarea style={s.textarea} name="description" value={formData.description} onChange={handleFormChange} placeholder="e.g. Các kỹ sư nhà máy" rows={3} disabled={saving} />
                                </div>
                            </div>
                            <div style={s.modalFooter}>
                                <button type="button" style={s.cancelBtn} onClick={closeForm}>Cancel</button>
                                <button type="submit" style={s.saveBtn(saving)} disabled={saving}>
                                    {saving ? (editingLevel ? 'Saving...' : 'Creating...') : (editingLevel ? 'Save Changes' : 'Create Level')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};