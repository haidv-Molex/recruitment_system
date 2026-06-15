import { ChartDataPoint } from '@/services/dashboardApi';

interface PendingTableProps {
  title: string;
  data: ChartDataPoint[];
  total: number;
}

export default function PendingTable({ title, data, total }: PendingTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-emerald-800 text-white shrink-0">
        <span className="text-xs font-black uppercase tracking-widest">{title}</span>
        <span className="text-[10px] font-bold text-emerald-200">#Pending RQ</span>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-slate-100">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-1.5 text-slate-700 truncate max-w-[80px]">{item.label}</td>
                <td className="px-3 py-1.5 text-right font-bold text-slate-800 w-10">{item.value}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={2} className="px-3 py-4 text-center text-slate-400 text-xs">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer total */}
      <div className="px-3 py-1.5 border-t border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
        <span className="text-xs font-bold text-slate-700">Total</span>
        <span className="text-xs font-black text-slate-900">{total}</span>
      </div>
    </div>
  );
}
