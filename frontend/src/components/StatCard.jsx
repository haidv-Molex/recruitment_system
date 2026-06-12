import React from 'react';
import { Users, Briefcase, CheckCircle, Clock } from 'lucide-react';

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
};

const iconColorClasses = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  purple: 'text-purple-500',
};

export const StatCard = ({ title, value, icon, color, trend }) => {
  return (
    <div className={`border rounded-lg p-6 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend !== undefined && (
            <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% this month
            </p>
          )}
        </div>
        <div className={`${iconColorClasses[color]} opacity-75`}>{icon}</div>
      </div>
    </div>
  );
};

export const DashboardGrid = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Candidates"
        value={stats.totalCandidates}
        icon={<Users size={32} />}
        color="blue"
        trend={12}
      />
      <StatCard
        title="Total Requests"
        value={stats.totalRequests}
        icon={<Briefcase size={32} />}
        color="green"
      />
      <StatCard
        title="Open Positions"
        value={stats.openPositions}
        icon={<Clock size={32} />}
        color="orange"
        trend={-5}
      />
      <StatCard
        title="Filled Positions"
        value={stats.filledPositions}
        icon={<CheckCircle size={32} />}
        color="purple"
        trend={25}
      />
    </div>
  );
};