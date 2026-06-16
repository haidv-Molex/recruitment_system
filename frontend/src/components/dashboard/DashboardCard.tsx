import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
}

export default function DashboardCard({ title, headerRight, children }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full font-sans">
      {/* Header */}
      <div className="px-4 py-2.5 dashboard-card-header flex justify-between items-center shrink-0">
        <h4 className="text-xs font-black uppercase tracking-widest text-white">
          {title}
        </h4>
        {headerRight && <div className="flex items-center">{headerRight}</div>}
      </div>

      {/* Body */}
      {children}
    </div>
  );
}
