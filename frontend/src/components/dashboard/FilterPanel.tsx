import { ChartDataPoint } from '@/services/dashboardApi';
import type { departmentModel } from '@/types/departmentModel';

export interface DashboardFilters {
  selectedSites: string[];
  selectedStatuses: string[];
  selectedDeptId: string;
  selectedJobId: string;
  dateFrom: string;
  dateTo: string;
}

export interface FilterPanelProps {
  filters: DashboardFilters;
  departments: departmentModel[];
  jobs: any[];
  totalHCRequested: number;
  onSiteToggle: (site: string) => void;
  onStatusToggle: (status: string) => void;
  onFilterChange: (key: keyof DashboardFilters, value: string) => void;
  onClearAll: () => void;
}

const SITE_OPTIONS = ['BU', 'MXHY', 'MXHY3', 'MXV', 'SYT'];
const STATUS_OPTIONS = ['In progress', 'Offered', 'Onboarded', 'Overdue'];

export default function FilterPanel({
  filters,
  departments,
  jobs,
  totalHCRequested,
  onSiteToggle,
  onStatusToggle,
  onFilterChange,
  onClearAll,
}: FilterPanelProps) {
  const hasActiveFilters =
    filters.selectedSites.length > 0 ||
    filters.selectedStatuses.length > 0 ||
    filters.selectedDeptId ||
    filters.selectedJobId ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Title banner */}
      <div className="bg-emerald-800 text-white rounded-xl shadow-md p-4">
        <h2 className="text-sm font-black tracking-widest uppercase text-white">IDL RECRUITMENT TRACKING</h2>
        <p className="text-[10px] text-emerald-300 mt-0.5 font-medium">Real-time Headcount Analytics</p>

        {/* KPI inline */}
        <div className="mt-3 border-t border-emerald-700 pt-3">
          <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider block">HC Requested</span>
          <span className="text-4xl font-black text-emerald-300 leading-none mt-1 block">{totalHCRequested}</span>
        </div>
      </div>

      {/* Filters card — flex-1 + min-h-0 so it fills remaining height and scrolls if needed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4">
        {/* SITE / STATUS side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">SITE</span>
            <div className="space-y-1">
              {SITE_OPTIONS.map((site) => (
                <label key={site} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.selectedSites.includes(site)}
                    onChange={() => onSiteToggle(site)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-600 group-hover:text-slate-900">{site}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">STATUS</span>
            <div className="space-y-1">
              {STATUS_OPTIONS.map((st) => (
                <label key={st} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.selectedStatuses.includes(st)}
                    onChange={() => onStatusToggle(st)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-600 group-hover:text-slate-900">{st}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* DEPT / JOB TITLE side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">DEPT.</span>
            <select
              value={filters.selectedDeptId}
              onChange={(e) => onFilterChange('selectedDeptId', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-800 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All</option>
              {departments.map((d: any) => (
                <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">JOB TITLE</span>
            <select
              value={filters.selectedJobId}
              onChange={(e) => onFilterChange('selectedJobId', e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-800 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All</option>
              {jobs.map((j: any) => (
                <option key={j.job_id} value={j.job_id}>{j.job_code}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expected onboard date */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block mb-1.5">
            Expected onboard date
          </span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFilterChange('dateFrom', e.target.value)}
              placeholder="mm/dd/yyyy"
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFilterChange('dateTo', e.target.value)}
              placeholder="mm/dd/yyyy"
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="w-full text-xs text-red-500 hover:text-red-700 font-bold pt-2 border-t text-center transition-colors"
          >
            ✕ Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
