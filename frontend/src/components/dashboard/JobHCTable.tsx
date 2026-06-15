import { useMemo } from 'react';
import { JobHCTracking } from '@/services/dashboardApi';

interface JobHCTableProps {
  data: JobHCTracking[];
}

export default function JobHCTable({ data }: JobHCTableProps) {
  const summary = useMemo(() => {
    let rq = 0, closed = 0, open = 0;
    data.forEach((j) => { rq += j.candidate_required; closed += j.closed_count; open += j.open_count; });
    return { rq, closed, open };
  }, [data]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="grid grid-cols-4 px-3 py-2 bg-emerald-800 text-white text-[10px] font-black uppercase tracking-widest shrink-0">
        <span className="col-span-1">Job title</span>
        <span className="text-right"># RQ</span>
        <span className="text-right"># Closed</span>
        <span className="text-right"># Open</span>
      </div>

      {/* Scrollable body - min-h-0 is critical for flex overflow */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-slate-100">
            {data.map((job) => (
              <tr key={job.job_id} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-1.5 text-slate-700 font-medium">{job.job_title || '—'}</td>
                <td className="px-3 py-1.5 text-right text-slate-600">{job.candidate_required}</td>
                <td className="px-3 py-1.5 text-right text-emerald-600 font-bold">{job.closed_count}</td>
                <td className="px-3 py-1.5 text-right font-bold text-slate-800">{job.open_count}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-400">No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer total */}
      <div className="grid grid-cols-4 px-3 py-1.5 border-t border-slate-200 bg-slate-50 text-xs font-black text-slate-800 shrink-0">
        <span>Total</span>
        <span className="text-right">{summary.rq}</span>
        <span className="text-right text-emerald-700">{summary.closed}</span>
        <span className="text-right">{summary.open}</span>
      </div>
    </div>
  );
}
