import React from 'react';
import { Users, Briefcase, CheckCircle, Clock } from 'lucide-react';

const colorClasses = {
  blue: 'bg-blue-50/50 border-blue-100 text-blue-700',
  green: 'bg-emerald-50/50 border-emerald-100 text-emerald-700',
  orange: 'bg-orange-50/50 border-orange-100 text-orange-700',
  purple: 'bg-purple-50/50 border-purple-100 text-purple-700',
};

const iconColorClasses = {
  blue: 'text-blue-500',
  green: 'text-emerald-500',
  orange: 'text-orange-500',
  purple: 'text-purple-500',
};

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
  trend?: number;
}

export function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  return (
    <div className={`border rounded-xl p-6 shadow-sm ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2 text-slate-800">{value}</p>
          {trend !== undefined && (
            <p className={`text-xs font-semibold mt-1.5 ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% this month
            </p>
          )}
        </div>
        <div className={`${iconColorClasses[color]} opacity-75 mt-1`}>{icon}</div>
      </div>
    </div>
  );
}

export interface DashboardGridProps {
  stats: {
    totalCandidates: number;
    totalRequests: number;
    openPositions: number;
    filledPositions: number;
  };
}

export function DashboardGrid({ stats }: DashboardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Candidates"
        value={stats.totalCandidates}
        icon={<Users size={28} />}
        color="blue"
        trend={12}
      />
      <StatCard
        title="Total Requests"
        value={stats.totalRequests}
        icon={<Briefcase size={28} />}
        color="green"
      />
      <StatCard
        title="Open Positions"
        value={stats.openPositions}
        icon={<Clock size={28} />}
        color="orange"
        trend={-5}
      />
      <StatCard
        title="Filled Positions"
        value={stats.filledPositions}
        icon={<CheckCircle size={28} />}
        color="purple"
        trend={25}
      />
    </div>
  );
}
