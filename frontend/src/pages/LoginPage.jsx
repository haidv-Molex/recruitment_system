import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const result = login(username.trim(), password);

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
      transition: 'border-color 0.2s',
      boxSizing: 'border-box',
    },
    inputFocus: {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59,130,246,0.15)',
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
      transition: 'background 0.2s',
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
    hint: {
      marginTop: '24px',
      padding: '12px',
      background: '#f8fafc',
      borderRadius: '8px',
      fontSize: '12px',
      color: '#64748b',
      lineHeight: '1.6',
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>HR</div>
        <h1 style={styles.title}>Molex IDL Recruitment</h1>
        <p style={styles.subtitle}>Sign in to access the tracking system</p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

        <div style={styles.hint}>
          <strong>Demo accounts:</strong><br />
          admin / admin123<br />
          annie / annie123<br />
          hein / hein123<br />
          kim / kim123
        </div>
      </div>
    </div>
  );
};