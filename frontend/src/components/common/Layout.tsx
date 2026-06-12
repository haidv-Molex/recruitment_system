import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Database,
  FileSpreadsheet,
  Table2,
  LogOut,
  User,
  Shield,
  FolderOpen,
  Building2,
  Layers,
  Globe,
  LayoutGrid,
  MapPin,
  Award,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth() as any;
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
    { path: '/jd-library', label: 'JD Library', icon: FolderOpen },
    { path: '/companies', label: 'Companies', icon: Building2 },
    { path: '/departments', label: 'Departments', icon: Layers },
    { path: '/platforms', label: 'Platforms', icon: Globe },
    { path: '/segments', label: 'Segments', icon: LayoutGrid },
    { path: '/sites', label: 'Sites', icon: MapPin },
    { path: '/levels', label: 'Levels', icon: Award },
    { path: '/master-data', label: 'Master Data', icon: FileSpreadsheet },
  ];

  if (isAdmin) {
    tabs.push({ path: '/admin', label: 'Admin', icon: Shield });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="min-h-[74px] bg-gradient-to-r from-[var(--excel-green-dark)] to-[var(--excel-green)] text-white flex items-center justify-between gap-6 px-6 py-3.5 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 grid place-items-center font-extrabold text-lg border border-white/30 tracking-wider shadow-inner">
            HR
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-wide">Molex IDL Recruitment Tracking</h1>
            <p className="text-xs text-white/80 mt-0.5 font-medium">Excel-style model front-end interface</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-white/95 font-medium">
          <span className="hidden sm:inline-block bg-white/10 px-2.5 py-1 rounded-md text-xs tracking-wider">
            Mode: Mock Frontend
          </span>
          <span className="hidden md:inline-block">{formattedDate}</span>

          {user && (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 active:bg-white/15 transition-all text-white hover:text-white"
              >
                <User size={14} />
                <span>{user.user_name}</span>
              </Link>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/15 border border-white/25 hover:bg-white/25 active:bg-white/30 transition-all cursor-pointer text-white shadow-sm"
                onClick={logout}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="flex items-end bg-white border-b border-slate-200 px-6 gap-1 overflow-x-auto select-none shadow-sm">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 outline-none whitespace-nowrap ${
                active
                  ? 'border-[var(--excel-green)] text-[var(--excel-green)] bg-emerald-50/50 shadow-inner'
                  : 'border-transparent text-slate-600 hover:text-[var(--excel-green)] hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
export { Layout };
