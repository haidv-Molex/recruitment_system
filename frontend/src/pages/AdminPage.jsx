import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Trash2, Shield, User, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserForm } from '../components/UserForm';
import { useAuth } from '../contexts/AuthContext';

const ITEMS_PER_PAGE = 5;

const roleColors = {
  admin: { background: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  recruiter: { background: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
};

const roleIcons = {
  admin: Shield,
  recruiter: User,
};

export const AdminPage = () => {
  const { user: currentUser, fetchUsers, createUser, editUser, removeUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadUsers = () => {
    setUsers(fetchUsers());
  };

  useEffect(() => {
    loadUsers();
  }, [fetchUsers]);

  useEffect(() => {
    // If a message is displayed, auto-hide it after 3 seconds
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const filteredUsers = useMemo(() => {
    let result = users;

    // If search query is not empty, filter users by username or displayName
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          u.displayName.toLowerCase().includes(query)
      );
    }

    // If a role filter is selected, keep only users matching that role
    if (filterRole) {
      result = result.filter((u) => u.role === filterRole);
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

  const handleCreate = (formData) => {
    const result = createUser(formData);
    // If account creation succeeded, show success message and refresh list
    if (result.success) {
      setMessage({ text: `Account "${formData.username}" created successfully.`, type: 'success' });
      setShowForm(false);
      loadUsers();
    } else {
      setMessage({ text: result.message, type: 'error' });
    }
  };

  const handleEdit = (formData) => {
    const result = editUser(editingUser.id, formData);
    // If account update succeeded, show success message and refresh list
    if (result.success) {
      setMessage({ text: `Account "${formData.username}" updated successfully.`, type: 'success' });
      setShowForm(false);
      setEditingUser(null);
      loadUsers();
    } else {
      setMessage({ text: result.message, type: 'error' });
    }
  };

  const handleDelete = (userToDelete) => {
    // If trying to delete own account, show error
    if (userToDelete.id === currentUser.id) {
      setMessage({ text: 'You cannot delete your own account.', type: 'error' });
      return;
    }

    // If user cancels the confirmation dialog, abort deletion
    if (!confirm(`Are you sure you want to delete account "${userToDelete.username}"?`)) {
      return;
    }

    const result = removeUser(userToDelete.id);
    // If deletion succeeded, show success message and refresh list
    if (result.success) {
      setMessage({ text: `Account "${userToDelete.username}" deleted.`, type: 'success' });
      loadUsers();
    } else {
      setMessage({ text: result.message, type: 'error' });
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

  const styles = {
    page: { maxWidth: '900px', margin: '0 auto', padding: '24px' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
    subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
    addBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    message: (type) => ({ padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, marginBottom: '16px', background: type === 'success' ? '#f0fdf4' : '#fef2f2', color: type === 'success' ? '#16a34a' : '#dc2626', border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}` }),
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
  const adminCount = users.filter((u) => u.role === 'admin').length;
  // Filter users to count how many have recruiter role
  const recruiterCount = users.filter((u) => u.role === 'recruiter').length;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length);

  const pageNumbers = [];
  // Loop to generate page number buttons based on total pages
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>👤 Account Management</h1>
          <p style={styles.subtitle}>
            Manage HR user accounts. Only administrators can access this page.
          </p>
        </div>
        <button type="button" style={styles.addBtn} onClick={openCreateForm}>
          <Plus size={16} /> Create Account
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard('#3b82f6')}>
          <p style={styles.statNumber}>{totalUsers}</p>
          <p style={styles.statLabel}>Total Accounts</p>
        </div>
        <div style={styles.statCard('#dc2626')}>
          <p style={styles.statNumber}>{adminCount}</p>
          <p style={styles.statLabel}>Admins</p>
        </div>
        <div style={styles.statCard('#2563eb')}>
          <p style={styles.statNumber}>{recruiterCount}</p>
          <p style={styles.statLabel}>Recruiters</p>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div style={styles.message(message.type)}>{message.text}</div>
      )}

      {/* Search + Filter */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrap}>
          <Search size={16} style={{ color: '#94a3b8' }} />
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search by username or display name..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <select
          style={styles.filterSelect}
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="recruiter">Recruiter</option>
        </select>

        {/* If any filter is active, show the Clear button */}
        {(searchQuery || filterRole) && (
          <button type="button" style={styles.clearBtn} onClick={handleClearFilters}>
            Clear
          </button>
        )}
      </div>

      {/* Filter info */}
      <p style={styles.filterInfo}>
        Showing {filteredUsers.length} of {totalUsers} accounts
        {searchQuery && ` • Search: "${searchQuery}"`}
        {filterRole && ` • Role: ${filterRole}`}
      </p>

      {/* Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Username</th>
            <th style={styles.th}>Display Name</th>
            <th style={styles.th}>Role</th>
            <th style={{ ...styles.th, textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* If no users match the filter, show empty message */}
          {paginatedUsers.length === 0 ? (
            <tr>
              <td colSpan={4} style={styles.emptyRow}>
                No accounts found matching your search.
              </td>
            </tr>
          ) : (
            // Loop through paginated users to render each row
            paginatedUsers.map((u) => {
              const RoleIcon = roleIcons[u.role] || User;
              const isCurrentUser = currentUser && currentUser.id === u.id;

              return (
                <tr key={u.id}>
                  <td style={styles.td}>
                    <strong>{u.username}</strong>
                    {isCurrentUser && <span style={styles.youBadge}>(you)</span>}
                  </td>
                  <td style={styles.td}>{u.displayName}</td>
                  <td style={styles.td}>
                    <span style={styles.rolePill(u.role)}>
                      <RoleIcon size={12} />
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        style={{ ...styles.actionBtn, color: '#3b82f6' }}
                        onClick={() => openEditForm(u)}
                        title="Edit account"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        style={{
                          ...styles.actionBtn,
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
        <div style={styles.paginationRow}>
          <span style={styles.paginationInfo}>
            Showing {startIndex}–{endIndex} of {filteredUsers.length} accounts
          </span>

          <div style={styles.paginationButtons}>
            <button
              type="button"
              style={styles.navBtn(currentPage <= 1)}
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
                style={styles.pageBtn(num === currentPage)}
                onClick={() => setCurrentPage(num)}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              style={styles.navBtn(currentPage >= totalPages)}
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
          onSubmit={editingUser ? handleEdit : handleCreate}
          onClose={() => { setShowForm(false); setEditingUser(null); }}
        />
      )}
    </div>
  );
};