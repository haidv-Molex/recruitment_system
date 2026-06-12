import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Trash2, Shield, User, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserForm } from '../components/UserForm';
import { ToastContainer } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { createHRApi, fetchUsersApi, deleteUserApi } from '../services/userApi';

const ITEMS_PER_PAGE = 5;

const roleColors = {
  admin: { background: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  hr: { background: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  recruiter: { background: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  viewer: { background: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
};

const roleIcons = {
  admin: Shield,
  hr: User,
  recruiter: User,
  viewer: Eye,
};

export const AdminPage = () => {
  const { user: currentUser } = useAuth();
  const { toasts, removeToast, toast } = useToast();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadUsers = async () => {
    try {
      const response = await fetchUsersApi({ page: 1, limit: 100 });
      setUsers(response.data);
    } catch (err) {
      toast.error('Failed to load users.');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let result = users;

    // If search query is not empty, filter users by user_name
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (u) =>
          (u.user_name || '').toLowerCase().includes(query) ||
          (u.user_account || '').toLowerCase().includes(query)
      );
    }

    // If a role filter is selected, keep only users matching that role
    if (filterRole) {
      result = result.filter((u) => u.user_role === filterRole);
    }

    return result;
  }, [users, searchQuery, filterRole]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));

  useEffect(() => {
    // If current page exceeds total pages after filtering, reset to page 1
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredUsers, totalPages, currentPage]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleCreate = async (formData) => {
    setSaving(true);
    try {
      const newUser = await createHRApi({
        username: formData.username,
        account: formData.account,
        password: formData.password,
        description: formData.description || undefined,
      });
      toast.success(`Account "${formData.account}" created successfully.`);
      setShowForm(false);
      setUsers((prev) => [...prev, newUser]);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Create account failed.');
    }
    setSaving(false);
  };

  const handleEdit = (formData) => {
    toast.warning('Edit account — waiting for backend API.');
    setShowForm(false);
    setEditingUser(null);
  };

  const handleDelete = async (userToDelete) => {
    if (currentUser && userToDelete.user_id === currentUser.user_id) {
      toast.error('You cannot delete your own account.');
      return;
    }

    if (!confirm(`Are you sure you want to delete account "${userToDelete.user_name || userToDelete.user_account}"?`)) {
      return;
    }

    try {
      await deleteUserApi(userToDelete.user_id);
      toast.success(`Account "${userToDelete.user_name || userToDelete.user_account}" deleted.`);
      setUsers((prev) => prev.filter((u) => u.user_id !== userToDelete.user_id));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Delete user failed.');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterRole('');
    setCurrentPage(1);
  };

  const openCreateForm = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const openEditForm = (u) => {
    setEditingUser(u);
    setShowForm(true);
  };

  const s = {
    page: { maxWidth: '900px', margin: '0 auto', padding: '24px' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
    subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
    addBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    th: { textAlign: 'left', padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#64748b', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
    td: { padding: '14px 16px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f1f5f9' },
    rolePill: (role) => ({ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: roleColors[role]?.background || '#f1f5f9', color: roleColors[role]?.color || '#64748b', border: `1px solid ${roleColors[role]?.border || '#e2e8f0'}` }),
    actionBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'background 0.2s' },
    youBadge: { fontSize: '11px', color: '#94a3b8', marginLeft: '6px', fontStyle: 'italic' },
    statsRow: { display: 'flex', gap: '16px', marginBottom: '24px' },
    statCard: (color) => ({ flex: 1, padding: '16px 20px', background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}` }),
    statNumber: { fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: '0' },
    statLabel: { fontSize: '13px', color: '#64748b', margin: '4px 0 0' },
    filterBar: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' },
    searchWrap: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', flex: '1', minWidth: '200px' },
    searchInput: { border: 'none', outline: 'none', fontSize: '14px', width: '100%', background: 'transparent' },
    filterSelect: { padding: '8px 14px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', outline: 'none', minWidth: '140px' },
    clearBtn: { padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' },
    filterInfo: { fontSize: '13px', color: '#64748b', marginBottom: '8px' },
    paginationRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '12px 0' },
    paginationInfo: { fontSize: '13px', color: '#64748b' },
    paginationButtons: { display: 'flex', alignItems: 'center', gap: '4px' },
    pageBtn: (active) => ({ padding: '6px 12px', fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? '#fff' : '#374151', background: active ? '#2563eb' : '#fff', border: '1px solid ' + (active ? '#2563eb' : '#d1d5db'), borderRadius: '6px', cursor: 'pointer', minWidth: '36px', textAlign: 'center' }),
    navBtn: (disabled) => ({ padding: '6px 10px', fontSize: '13px', color: disabled ? '#cbd5e1' : '#374151', background: '#fff', border: '1px solid ' + (disabled ? '#e2e8f0' : '#d1d5db'), borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }),
    emptyRow: { textAlign: 'center', padding: '40px 16px', color: '#94a3b8', fontSize: '14px' },
  };

  const totalUsers = users.length;
  // Filter users to count how many have admin role
  const adminCount = users.filter((u) => u.user_role === 'admin').length;
  // Filter users to count how many have hr role
  const hrCount = users.filter((u) => u.user_role === 'hr' || u.user_role === 'recruiter').length;
  // Filter users to count how many have viewer role
  const viewerCount = users.filter((u) => u.user_role === 'viewer').length;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length);

  const pageNumbers = [];
  // Loop to generate page number buttons based on total pages
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div style={s.page}>
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div style={s.headerRow}>
        <div>
          <h1 style={s.title}>👤 Account Management</h1>
          <p style={s.subtitle}>Manage HR user accounts. Only administrators can access this page.</p>
        </div>
        <button type="button" style={s.addBtn} onClick={openCreateForm}>
          <Plus size={16} /> Create HR Account
        </button>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        <div style={s.statCard('#3b82f6')}>
          <p style={s.statNumber}>{totalUsers}</p>
          <p style={s.statLabel}>Total Accounts</p>
        </div>
        <div style={s.statCard('#dc2626')}>
          <p style={s.statNumber}>{adminCount}</p>
          <p style={s.statLabel}>Admins</p>
        </div>
        <div style={s.statCard('#2563eb')}>
          <p style={s.statNumber}>{hrCount}</p>
          <p style={s.statLabel}>HR</p>
        </div>
        <div style={s.statCard('#16a34a')}>
          <p style={s.statNumber}>{viewerCount}</p>
          <p style={s.statLabel}>Viewers</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={s.filterBar}>
        <div style={s.searchWrap}>
          <Search size={16} style={{ color: '#94a3b8' }} />
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search by name or account..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <select
          style={s.filterSelect}
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="hr">HR</option>
          <option value="viewer">Viewer</option>
        </select>

        {/* If any filter is active, show the Clear button */}
        {(searchQuery || filterRole) && (
          <button type="button" style={s.clearBtn} onClick={handleClearFilters}>Clear</button>
        )}
      </div>

      <p style={s.filterInfo}>
        Showing {filteredUsers.length} of {totalUsers} accounts
        {searchQuery && ` • Search: "${searchQuery}"`}
        {filterRole && ` • Role: ${filterRole}`}
      </p>

      {/* Table */}
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Account</th>
            <th style={s.th}>Display Name</th>
            <th style={s.th}>Description</th>
            <th style={s.th}>Role</th>
            <th style={{ ...s.th, textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* If no users match the filter, show empty message */}
          {paginatedUsers.length === 0 ? (
            <tr>
              <td colSpan={5} style={s.emptyRow}>No accounts found.</td>
            </tr>
          ) : (
            // Loop through paginated users to render each row
            paginatedUsers.map((u) => {
              const RoleIcon = roleIcons[u.user_role] || User;
              const isCurrentUser = currentUser && currentUser.user_id === u.user_id;

              return (
                <tr key={u.user_id}>
                  <td style={s.td}>
                    <strong>{u.user_account || u.user_name}</strong>
                    {isCurrentUser && <span style={s.youBadge}>(you)</span>}
                  </td>
                  <td style={s.td}>{u.user_name}</td>
                  <td style={{ ...s.td, color: '#64748b', fontSize: '13px' }}>
                    {u.user_description || '—'}
                  </td>
                  <td style={s.td}>
                    <span style={s.rolePill(u.user_role)}>
                      <RoleIcon size={12} />
                      {(u.user_role || '').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        style={{ ...s.actionBtn, color: '#3b82f6' }}
                        onClick={() => openEditForm(u)}
                        title="Edit account"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        style={{
                          ...s.actionBtn,
                          color: isCurrentUser ? '#cbd5e1' : '#ef4444',
                          cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                        }}
                        onClick={() => !isCurrentUser && handleDelete(u)}
                        title={isCurrentUser ? 'Cannot delete yourself' : 'Delete account'}
                        disabled={isCurrentUser}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <div style={s.paginationRow}>
          <span style={s.paginationInfo}>
            Showing {startIndex}–{endIndex} of {filteredUsers.length} accounts
          </span>

          <div style={s.paginationButtons}>
            <button
              type="button"
              style={s.navBtn(currentPage <= 1)}
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
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
                onClick={() => setCurrentPage(num)}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              style={s.navBtn(currentPage >= totalPages)}
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <UserForm
          user={editingUser}
          saving={saving}
          onSubmit={editingUser ? handleEdit : handleCreate}
          onClose={() => { setShowForm(false); setEditingUser(null); }}
        />
      )}
    </div>
  );
};