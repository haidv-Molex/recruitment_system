
export interface AdminStatsProps {
  total: number;
  admins: number;
  hrs: number;
  viewers: number;
}

export default function AdminStats({ total, admins, hrs, viewers }: AdminStatsProps) {
  const cards = [
    { label: 'Total Accounts', value: total, border: 'border-slate-300', text: 'text-slate-800' },
    { label: 'Administrators', value: admins, border: 'border-red-500', text: 'text-red-600' },
    { label: 'HR / Recruiters', value: hrs, border: 'border-blue-500', text: 'text-blue-600' },
    { label: 'Viewers', value: viewers, border: 'border-emerald-500', text: 'text-emerald-600' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`bg-white rounded-xl shadow-sm border-l-4 ${card.border} p-4 hover:shadow-md transition-shadow`}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
          <p className={`text-2xl font-bold mt-1 ${card.text}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
