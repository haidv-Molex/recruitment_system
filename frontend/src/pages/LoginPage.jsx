import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage = () => {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // If account or password is empty, show validation error
    if (!account.trim() || !password.trim()) {
      setError('Please enter both account and password.');
      return;
    }

    setLoading(true);

    const result = await login(account.trim(), password);

    // If login succeeded, redirect to home page
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const styles = {
    wrapper: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #467ab3 100%)',
      padding: '16px',
    },
    card: {
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      padding: '40px',
      width: '100%',
      maxWidth: '420px',
    },
    logo: {
      width: '56px',
      height: '56px',
      background: '#1e3a5f',
      color: '#fff',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '20px',
      margin: '0 auto 16px',
    },
    title: {
      textAlign: 'center',
      fontSize: '22px',
      fontWeight: 700,
      color: '#1e293b',
      margin: '0 0 4px',
    },
    subtitle: {
      textAlign: 'center',
      fontSize: '14px',
      color: '#64748b',
      margin: '0 0 28px',
    },
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
    fieldGroup: {
      marginBottom: '18px',
    },
    button: {
      width: '100%',
      padding: '12px',
      fontSize: '15px',
      fontWeight: 600,
      color: '#fff',
      background: loading ? '#93c5fd' : '#2563eb',
      border: 'none',
      borderRadius: '8px',
      cursor: loading ? 'not-allowed' : 'pointer',
      marginTop: '8px',
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
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logo}>HR</div>
        <h1 style={styles.title}>Molex IDL Recruitment</h1>
        <p style={styles.subtitle}>Sign in to access the tracking system</p>

        <form onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Account</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Enter your account"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              autoFocus
              disabled={loading}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};