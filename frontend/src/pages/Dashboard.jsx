import React, { useState, useEffect } from 'react';
import { DashboardGrid } from '../components/StatCard';
import { CandidateTable } from '../components/CandidateTable';
import { mockDashboardStats, mockCandidates } from '../services/mockData';

export const DashboardPage = () => {
  const [stats, setStats] = useState(mockDashboardStats);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setRecentCandidates(mockCandidates.slice(0, 5));
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Overview</h2>
        <DashboardGrid stats={stats} />
      </section>

      {/* Recent Candidates */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Recent Candidates</h2>
          <a href="/candidates" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </a>
        </div>
        <CandidateTable candidates={recentCandidates} loading={loading} />
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Pending Interviews</h3>
          <p className="text-3xl font-bold text-orange-600">6</p>
          <p className="text-xs text-gray-500 mt-2">Next interview in 2 days</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Pending Offers</h3>
          <p className="text-3xl font-bold text-green-600">3</p>
          <p className="text-xs text-gray-500 mt-2">Awaiting candidate response</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Onboarding in Progress</h3>
          <p className="text-3xl font-bold text-blue-600">2</p>
          <p className="text-xs text-gray-500 mt-2">2 new hires this week</p>
        </div>
      </section>
    </div>
  );
};