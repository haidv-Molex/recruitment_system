import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const emptyUser = {
  username: '',
  account: '',
  password: '',
  description: '',
};

export const UserForm = ({ user, onSubmit, onClose, saving }) => {
  const [formData, setFormData] = useState(emptyUser);
  const [error, setError] = useState('');

  const isEditing = !!user;

  useEffect(() => {
    // If editing an existing user, populate form with their data
    if (user) {
      setFormData({
        username: user.displayName || '',
        account: user.account || user.username || '',
        password: '',
        description: user.description || '',
      });
    } else {
      setFormData(emptyUser);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // If display name is empty, show validation error
    if (!formData.username.trim()) {
      setError('Display Name is required.');
      return;
    }

    // If account is empty, show validation error
    if (!formData.account.trim()) {
      setError('Account is required.');
      return;
    }

    // If account contains whitespace, show validation error
    if (/\s/.test(formData.account)) {
      setError('Account cannot contain spaces.');
      return;
    }

    // If creating new account and password is empty, show validation error
    if (!isEditing && !formData.password.trim()) {
      setError('Password is required for new accounts.');
      return;
    }

    // If password is provided but less than 6 characters, show validation error
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    onSubmit(formData);
  };

  const styles = {
    backdrop: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      width: '100%',
      maxWidth: '480px',
      padding: '0',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      borderBottom: '1px solid #e2e8f0',
      background: '#f8fafc',
    },
    headerTitle: {
      fontSize: '17px',
      fontWeight: 700,
      color: '#1e293b',
      margin: 0,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#64748b',
      padding: '4px',
    },
    body: { padding: '24px' },
    fieldGroup: { marginBottom: '16px' },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: 600,
      color: '#374151',
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      fontSize: '14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      outline: 'none',
      boxSizing: 'border-box',
    },
    error: {
      background: '#fef2f2',
      color: '#dc2626',
      fontSize: '13px',
      padding: '10px 14px',
      borderRadius: '8px',
      marginBottom: '16px',
      border: '1px solid #fecaca',
    },
    hint: {
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '4px',
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      padding: '16px 24px',
      borderTop: '1px solid #e2e8f0',
      background: '#f8fafc',
    },
    cancelBtn: {
      padding: '8px 20px',
      fontSize: '14px',
      fontWeight: 600,
      color: '#374151',
      background: '#fff',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      cursor: 'pointer',
    },
    saveBtn: (disabled) => ({
      padding: '8px 20px',
      fontSize: '14px',
      fontWeight: 600,
      color: '#fff',
      background: disabled ? '#93c5fd' : '#2563eb',
      border: 'none',
      borderRadius: '8px',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }),
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>
            {isEditing ? 'Edit Account' : 'Create New HR Account'}
          </h2>
          <button type="button" style={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.body}>
            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Display Name *</label>
              <input
                style={styles.input}
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g. Nguyễn Văn A"
                disabled={saving}
              />
              <p style={styles.hint}>This name will be displayed throughout the system.</p>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Account (Login ID) *</label>
              <input
                style={styles.input}
                name="account"
                value={formData.account}
                onChange={handleChange}
                placeholder="e.g. hr02"
                disabled={isEditing || saving}
              />
              {/* If editing, show hint that account cannot be changed */}
              {isEditing && (
                <p style={styles.hint}>Account cannot be changed.</p>
              )}
              {!isEditing && (
                <p style={styles.hint}>Used to sign in. No spaces allowed.</p>
              )}
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                {isEditing ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
              <input
                style={styles.input}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isEditing ? 'Leave blank to keep current' : 'Min 6 characters'}
                disabled={saving}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Description</label>
              <input
                style={styles.input}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Recruiter phụ trách tuyển dụng nhà máy MXV"
                disabled={saving}
              />
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={styles.saveBtn(saving)} disabled={saving}>
              {saving
                ? (isEditing ? 'Saving...' : 'Creating...')
                : (isEditing ? 'Save Changes' : 'Create Account')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};