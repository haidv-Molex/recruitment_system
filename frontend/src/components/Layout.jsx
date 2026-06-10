import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, FileSpreadsheet, Table2, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Layout = ({ children }) => {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const tabs = [
    { path: '/', label: 'Job Tracking', icon: Table2 },
    { path: '/candidates', label: 'Candidate Database', icon: Database },
    { path: '/master-data', label: 'Master Data', icon: FileSpreadsheet },
  ];

  // If logged-in user has admin role, add the Admin tab to navigation
  if (isAdmin) {
    tabs.push({ path: '/admin', label: 'Admin', icon: Shield });
  }

  const isActive = (path) => location.pathname === path;

  const userBlockStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
    color: '#e2e8f0',
  };

  const logoutButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#e2e8f0',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  };

  return (
    <div className="app-shell">
      <header className="workbook-header">
        <div className="brand-block">
          <div className="excel-icon">HR</div>
          <div>
            <h1>Molex IDL Recruitment Tracking</h1>
            <p>Excel-style model front-end interface</p>
          </div>
        </div>
        <div className="header-meta">
          <span>Mode: Mock Frontend</span>
          <span>{formattedDate}</span>

          {user && (
            <div style={userBlockStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} />
                {user.displayName}
              </span>
              <button
                type="button"
                style={logoutButtonStyle}
                onClick={logout}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; }}
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <nav className="sheet-tabs">
        {/* Loop through all tabs to render navigation links */}
        {tabs.map(({ path, label, icon: Icon }) => (
          <Link key={path} to={path} className={`sheet-tab ${isActive(path) ? 'active' : ''}`}>
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <main className="workbook-body">{children}</main>
    </div>
  );
};