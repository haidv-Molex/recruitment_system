import { useState, useEffect } from 'react';
import { DashboardGrid } from '../components/common/StatCard';
import { CandidateTable } from '../components/candidate/CandidateTable';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import { mockDashboardStats, mockCandidates } from '../services/mockData';
import { useHeader } from '../contexts/HeaderContext';

export const DashboardPage = () => {
  const [stats] = useState(mockDashboardStats);
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setRecentCandidates(mockCandidates.slice(0, 5));
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useHeader({
    title: '📊 Recruiting Dashboard',
    subTitle: 'Overview of key metrics and recent candidate actions.',
  }, []);

  return (
    <div className="space-y-8 p-1">
      {/* KPI Cards */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-4 tracking-tight">Overview</h2>
        <DashboardGrid stats={stats} />
      </section>

      {/* Recent Candidates */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Recent Candidates</h2>
          <a
            href="/candidates"
            className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold hover:underline transition-colors"
          >
            View All
          </a>
        </div>
        <CandidateTable candidates={recentCandidates} loading={loading} />
      </section>

      {/* Quick Stats */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-4 tracking-tight">Status Summary</h2>
        <DashboardSummary />
      </section>
    </div>
  );
};
