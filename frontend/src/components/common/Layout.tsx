import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Database,
  Table2,
  Shield,
  FolderOpen,
  Building2,
  Layers,
  Globe,
  LayoutGrid,
  MapPin,
  Award,
  Mail,
  Menu,
  ChevronLeft,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import HeaderContext from '@/contexts/HeaderContext';
import { useContext } from 'react';

export interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, isAdmin } = useAuth() as any;
  const headerCtx = useContext(HeaderContext);
  const headerState = headerCtx?.headerState || { title: '' };
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [now, setNow] = useState(new Date());

  const configRoutes = ['/companies', '/departments', '/platforms', '/segments', '/sites', '/levels'];
  const [configOpen, setConfigOpen] = useState(() => configRoutes.includes(location.pathname));

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (configRoutes.includes(location.pathname)) {
      setConfigOpen(true);
    }
  }, [location.pathname]);

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const mainTabs = [
    { path: '/', label: 'Dashboard', icon: LayoutGrid },
    { path: '/job-tracking', label: 'Job Tracking', icon: Table2 },
    { path: '/open-position-requests', label: 'Open Requests', icon: FolderOpen },
    { path: '/candidates', label: 'Candidate Database', icon: Database },
    { path: '/email', label: 'Email', icon: Mail },
  ];

  const configTabs = [
    { path: '/companies', label: 'Companies', icon: Building2 },
    { path: '/departments', label: 'Departments', icon: Layers },
    { path: '/platforms', label: 'Platforms', icon: Globe },
    { path: '/segments', label: 'Segments', icon: LayoutGrid },
    { path: '/sites', label: 'Sites', icon: MapPin },
    { path: '/levels', label: 'Levels', icon: Award },
  ];

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));

  return (
    <div className="h-screen w-screen flex bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className={`bg-white text-slate-700 flex flex-col border-r border-slate-200 transition-all duration-300 ease-in-out z-30 shrink-0 ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 grid place-items-center font-extrabold text-sm text-white shadow-md">
              HR
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 tracking-wider leading-none">Molex Recruit</h1>
              <span className="text-[10px] text-emerald-600 font-medium">Tracking System</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto custom-scrollbar select-none">
          {mainTabs.map(({ path, label, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-600'
                    : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={active ? 'text-white' : 'text-slate-450'} />
                <span>{label}</span>
              </Link>
            );
          })}

          {/* Configuration Collapsible Group */}
          <div>
            <button
              onClick={() => setConfigOpen(!configOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                configRoutes.includes(location.pathname)
                  ? 'text-emerald-600 bg-emerald-50/50'
                  : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings size={18} className={configRoutes.includes(location.pathname) ? 'text-emerald-600' : 'text-slate-400'} />
                <span>Configuration</span>
              </div>
              {configOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
            </button>

            {/* Sub-menu items */}
            {configOpen && (
              <div className="mt-1 pl-4 space-y-0.5 border-l border-slate-250 ml-5 animate-fadeIn">
                {configTabs.map(({ path, label, icon: Icon }) => {
                  const active = isActive(path);
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                        active
                          ? 'text-emerald-600 font-bold bg-emerald-50'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <Icon size={14} className={active ? 'text-emerald-600' : 'text-slate-400'} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin tab (if admin) */}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/admin')
                  ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-600'
                  : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Shield size={18} className={isActive('/admin') ? 'text-white' : 'text-slate-400'} />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* Sidebar Footer */}
        <Link
          to="/profile"
          className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-2 hover:bg-slate-100 transition-colors select-none"
        >
          {user && (
            <div className="flex items-center gap-2.5 px-1 py-0.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 grid place-items-center text-xs font-bold text-emerald-400 border border-slate-700 shrink-0">
                {user.user_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">{user.user_name}</p>
                <p className="text-[10px] text-slate-500 capitalize">{user.user_role}</p>
              </div>
            </div>
          )}
        </Link>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-screen max-h-screen overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm shrink-0 z-20">
          <div className="flex items-center gap-4 min-w-0">
            {/* Sidebar toggle button (visible if sidebar is closed) */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all shadow-sm"
              >
                <Menu size={18} />
              </button>
            )}

            {/* Page Header (Title + Subtitle) */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-slate-800">
                {typeof headerState.title === 'string' ? (
                  <h1 className="text-lg font-bold tracking-tight truncate">{headerState.title}</h1>
                ) : (
                  headerState.title
                )}
              </div>
              {headerState.subTitle && (
                <div className="mt-0.5 text-xs text-slate-500 font-medium truncate">
                  {headerState.subTitle}
                </div>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Dynamic Actions */}
            {headerState.actions && (
              <div className="flex items-center gap-2">
                {headerState.actions}
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 overflow-auto bg-slate-50 w-full max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}

export { Layout };
