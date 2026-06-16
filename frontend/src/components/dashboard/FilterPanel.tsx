import { ChartDataPoint } from '@/services/dashboardApi';
import type { departmentModel } from '@/types/departmentModel';
import { searchDepartmentsApi } from '@/services/departmentApi';
import { searchJobsApi } from '@/services/jobApi';
import OutlookSearchSelect from '@/components/ui/OutlookSearchSelect';

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
  onStatusChange: (statuses: string[]) => void;
  onFilterChange: (key: keyof DashboardFilters, value: string) => void;
  onClearAll: () => void;
}

const STATUS_OPTIONS = ['In progress', 'Offered', 'Onboarded', 'Overdue'];

export default function FilterPanel({
  filters,
  departments,
  jobs,
  totalHCRequested,
  onStatusChange,
  onFilterChange,
  onClearAll,
}: FilterPanelProps) {
  const hasActiveFilters =
    filters.selectedStatuses.length > 0 ||
    filters.selectedDeptId ||
    filters.selectedJobId ||
    filters.dateFrom ||
    filters.dateTo;

  const selectedDeptItem = departments.find(
    (d: any) => d.department_id.toString() === filters.selectedDeptId
  );
  const selectedJobItem = jobs.find(
    (j: any) => j.job_id.toString() === filters.selectedJobId
  );

  return (
    <div className="flex gap-3 w-full shrink-0 items-stretch font-sans">
      {/* Title banner / KPI */}
      <div className="bg-excel-green-dark text-white rounded-xl shadow-md px-4 py-2 flex items-center gap-5 shrink-0">
        <div>
          <h2 className="text-xs font-black tracking-widest uppercase">IDL RECRUITMENT</h2>
          <p className="text-[9px] text-emerald-200 font-medium">Headcount Analytics</p>
        </div>
        <div className="border-l border-white/20 pl-4 py-0.5">
          <span className="text-[9px] text-emerald-200 uppercase font-bold tracking-wider block leading-none">Requested</span>
          <span className="text-xl font-black text-white leading-none mt-1 block">{totalHCRequested}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-3.5 py-2.5 flex-1 flex items-end justify-between gap-3">
        {/* <div className="w-[105px] shrink-0 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">Status</label>
          <select
            value={filters.selectedStatuses[0] || ''}
            onChange={(e) => {
              const val = e.target.value;
              onStatusChange(val ? [val] : []);
            }}
            className="w-full text-xs px-2 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-excel-green focus:border-excel-green h-[38px] transition-all focus:outline-none"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div> */}

        {/* Department Search (OutlookSearchSelect) */}
        <div className="flex-1 min-w-[150px]">
          <OutlookSearchSelect
            label="Dept."
            placeholder="Search dept..."
            initialItems={selectedDeptItem ? [selectedDeptItem] : []}
            searchApi={async (search) => {
              const res = await searchDepartmentsApi({ search, limit: 10 });
              return { data: res.data || [] };
            }}
            displayFn={(d: any) => d.department_name}
            chipDisplayFn={(d: any) => d.department_code || d.department_name}
            keyProp="department_id"
            onChange={(ids) => {
              const lastId = ids[ids.length - 1];
              onFilterChange('selectedDeptId', lastId ? lastId.toString() : '');
            }}
          />
        </div>

        {/* Job Title Search (OutlookSearchSelect) */}
        <div className="flex-1 min-w-[150px]">
          <OutlookSearchSelect
            label="Job Title"
            placeholder="Search job..."
            initialItems={selectedJobItem ? [selectedJobItem] : []}
            searchApi={async (search) => {
              const res = await searchJobsApi({ search, limit: 10 });
              return { data: res.data || [] };
            }}
            displayFn={(j: any) => j.job_title || j.job_code}
            chipDisplayFn={(j: any) => j.job_code}
            keyProp="job_id"
            onChange={(ids) => {
              const lastId = ids[ids.length - 1];
              onFilterChange('selectedJobId', lastId ? lastId.toString() : '');
            }}
          />
        </div>

        {/* Expected Onboard Date range */}
        <div className="w-[260px] shrink-0 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">Expected onboard date</label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFilterChange('dateFrom', e.target.value)}
              placeholder="mm/dd/yyyy"
              className="w-[115px] text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-1 focus:ring-excel-green focus:border-excel-green h-[38px] transition-all focus:outline-none"
            />
            <span className="text-slate-400 text-xs font-medium px-0.5">to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFilterChange('dateTo', e.target.value)}
              placeholder="mm/dd/yyyy"
              className="w-[115px] text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-1 focus:ring-excel-green focus:border-excel-green h-[38px] transition-all focus:outline-none"
            />
          </div>
        </div>

        {/* Clear all filters button */}
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-xs text-red-500 hover:text-red-700 font-bold px-3 py-2 border border-red-200 hover:border-red-400 rounded-lg bg-red-50/50 hover:bg-red-50 transition-colors h-[38px] shrink-0"
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}
