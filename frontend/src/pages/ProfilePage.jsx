import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Save, Lock, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();

  const [profileData, setProfileData] = useState({
    username: '',
    description: '',
    department: '',
  });
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // If user data is available, populate the profile form
    if (user) {
      setProfileData({
        username: user.username || '',
        description: user.description || '',
        department: user.department || '',
      });
    }
  }, [user]);

  useEffect(() => {
    // If profile message is displayed, auto-hide after 3 seconds
    if (profileMessage.text) {
      const timer = setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileMessage]);

  useEffect(() => {
    // If password message is displayed, auto-hide after 3 seconds
    if (passwordMessage.text) {
      const timer = setTimeout(() => setPasswordMessage({ text: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [passwordMessage]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();

    // If username is empty, show validation error
    if (!profileData.username.trim()) {
      setProfileMessage({ text: 'Username is required.', type: 'error' });
      return;
    }

    // Check if username contains any whitespace characters
    if (/\s/.test(profileData.username)) {
      setProfileMessage({ text: 'Username cannot contain spaces.', type: 'error' });
      return;
    }

    const result = updateProfile(profileData);
    // If profile update succeeded, show success message
    if (result.success) {
      setProfileMessage({ text: 'Profile updated successfully.', type: 'success' });
    } else {
      setProfileMessage({ text: result.message, type: 'error' });
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    // If any password field is empty, show validation error
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordMessage({ text: 'All password fields are required.', type: 'error' });
      return;
    }

    // If new password is less than 6 characters, show validation error
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }

    // If new password and confirm password do not match, show error
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ text: 'New password and confirm password do not match.', type: 'error' });
      return;
    }

    // If new password is the same as old password, show error
    if (passwordData.oldPassword === passwordData.newPassword) {
      setPasswordMessage({ text: 'New password must be different from current password.', type: 'error' });
      return;
    }

    const result = changePassword(passwordData.oldPassword, passwordData.newPassword);
    // If password change succeeded, clear form and show success
    if (result.success) {
      setPasswordMessage({ text: 'Password changed successfully.', type: 'success' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } else {
      setPasswordMessage({ text: result.message, type: 'error' });
    }
  };

  const s = {
    page: { maxWidth: '700px', margin: '0 auto', padding: '24px' },
    headerRow: { marginBottom: '28px' },
    title: { fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' },
    subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
    card: { background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px', overflow: 'hidden' },
    cardHeader: { padding: '18px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' },
    cardTitle: { fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 },
    cardBody: { padding: '24px' },
    fieldGroup: { marginBottom: '18px' },
    label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
    input: { width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
    passwordWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
    passwordInput: { width: '100%', padding: '10px 44px 10px 14px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' },
    eyeBtn: { position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', display: 'flex', alignItems: 'center' },
    message: (type) => ({ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, marginBottom: '16px', background: type === 'success' ? '#f0fdf4' : '#fef2f2', color: type === 'success' ? '#16a34a' : '#dc2626', border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}` }),
    saveBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '8px' },
    hint: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' },
    infoPill: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' },
    infoRow: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.headerRow}>
        <h1 style={s.title}><UserCircle size={28} /> My Profile</h1>
        <p style={s.subtitle}>View and update your account information.</p>
      </div>

      {/* Read-only info */}
      <div style={s.infoRow}>
        <span style={s.infoPill}>Role: {user?.role}</span>
        <span style={s.infoPill}>Display Name: {user?.displayName}</span>
      </div>

      {/* ═══ Profile Info Card ═══ */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <UserCircle size={18} style={{ color: '#2563eb' }} />
          <h2 style={s.cardTitle}>Profile Information</h2>
        </div>
        <div style={s.cardBody}>
          <form onSubmit={handleProfileSubmit}>
            {profileMessage.text && (
              <div style={s.message(profileMessage.type)}>{profileMessage.text}</div>
            )}

            <div style={s.fieldGroup}>
              <label style={s.label}>Username</label>
              <input
                style={s.input}
                name="username"
                value={profileData.username}
                onChange={handleProfileChange}
                placeholder="Your login username"
              />
              <p style={s.hint}>This is used to sign in. Changing it will affect your next login.</p>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Description</label>
              <textarea
                style={s.textarea}
                name="description"
                value={profileData.description}
                onChange={handleProfileChange}
                placeholder="e.g. Senior HR Recruiter with 5 years experience in manufacturing"
                rows={3}
              />
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Department</label>
              <input
                style={s.input}
                name="department"
                value={profileData.department}
                onChange={handleProfileChange}
                placeholder="e.g. Human Resources"
              />
            </div>

            <button type="submit" style={s.saveBtn}>
              <Save size={16} /> Save Profile
            </button>
          </form>
        </div>
      </div>

      {/* ═══ Change Password Card ═══ */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <Lock size={18} style={{ color: '#dc2626' }} />
          <h2 style={s.cardTitle}>Change Password</h2>
        </div>
        <div style={s.cardBody}>
          <form onSubmit={handlePasswordSubmit}>
            {passwordMessage.text && (
              <div style={s.message(passwordMessage.type)}>{passwordMessage.text}</div>
            )}

            {/* Current Password */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Current Password</label>
              <div style={s.passwordWrap}>
                <input
                  style={s.passwordInput}
                  type={showOldPassword ? 'text' : 'password'}
                  name="oldPassword"
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  style={s.eyeBtn}
                  onClick={() => setShowOldPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div style={s.fieldGroup}>
              <label style={s.label}>New Password</label>
              <div style={s.passwordWrap}>
                <input
                  style={s.passwordInput}
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  style={s.eyeBtn}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Confirm New Password</label>
              <div style={s.passwordWrap}>
                <input
                  style={s.passwordInput}
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  style={s.eyeBtn}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" style={{ ...s.saveBtn, background: '#dc2626' }}>
              <Lock size={16} /> Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};