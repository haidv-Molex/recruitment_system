import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, FileSpreadsheet, Table2 } from 'lucide-react';

export const Layout = ({ children }) => {
  const location = useLocation();
  const [now, setNow] = useState(new Date());

  
useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000); // cập nhật mỗi 60 giây
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

  const isActive = (path) => location.pathname === path;

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
          </div>
      </header>

      <nav className="sheet-tabs">
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
