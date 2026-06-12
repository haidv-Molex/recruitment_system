import React from 'react';

export default function DashboardSummary() {
  const summaries = [
    {
      title: 'Pending Interviews',
      value: '6',
      desc: 'Next interview in 2 days',
      colorClass: 'text-amber-600',
      borderClass: 'border-amber-500',
    },
    {
      title: 'Pending Offers',
      value: '3',
      desc: 'Awaiting candidate response',
      colorClass: 'text-emerald-600',
      borderClass: 'border-emerald-500',
    },
    {
      title: 'Onboarding in Progress',
      value: '2',
      desc: '2 new hires this week',
      colorClass: 'text-blue-600',
      borderClass: 'border-blue-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {summaries.map((item, idx) => (
        <div
          key={idx}
          className={`bg-white rounded-xl shadow-sm border-l-4 ${item.borderClass} border-slate-100 p-6 hover:shadow-md transition-shadow`}
        >
          <h3 className="text-sm font-semibold text-slate-500 mb-2">{item.title}</h3>
          <p className={`text-3xl font-bold ${item.colorClass}`}>{item.value}</p>
          <p className="text-xs text-slate-400 mt-2 font-medium">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}
