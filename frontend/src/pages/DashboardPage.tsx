import { useState, useEffect, useMemo } from 'react';
import {
  fetchHCByDepartmentApi,
  fetchHCByStatusAndMonthApi,
  fetchHCByRecruiterApi,
  fetchHCByHrbpApi,
  fetchHCByMonthApi,
  fetchJobHCTrackingApi,
  ChartDataPoint,
  JobHCTracking,
} from '@/services/dashboardApi';
import { searchDepartmentsApi } from '@/services/departmentApi';
import { searchJobsApi } from '@/services/jobApi';
import { useHeader } from '@/contexts/HeaderContext';
import ToastContainer from '@/components/common/Toast';
import { useToast } from '@/hooks/useToast';

import FilterPanel, { DashboardFilters } from '@/components/dashboard/FilterPanel';
import DashboardTable from '@/components/dashboard/DashboardTable';
import MonthlyHCChart from '@/components/dashboard/MonthlyHCChart';
import StatusLineChart from '@/components/dashboard/StatusLineChart';
import DeptHCChart from '@/components/dashboard/DeptHCChart';

// Fixed row heights — tổng phải khớp với viewport content area
const ROW_1_H = 340; // px — top row (Filter + Tables + Monthly chart)
const ROW_2_H = 360; // px — bottom row (Status line + Dept chart + Job table)

export const DashboardPage = () => {
  const { toasts, removeToast, toast } = useToast();

  const [filters, setFilters] = useState<DashboardFilters>({
    selectedSites: [],
    selectedStatuses: [],
    selectedDeptId: '',
    selectedJobId: '',
    dateFrom: '',
    dateTo: '',
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  const [deptHCData, setDeptHCData] = useState<ChartDataPoint[]>([]);
  const [monthHCData, setMonthHCData] = useState<ChartDataPoint[]>([]);
  const [recruiterData, setRecruiterData] = useState<ChartDataPoint[]>([]);
  const [hrbpData, setHrbpData] = useState<ChartDataPoint[]>([]);
  const [jobTrackingData, setJobTrackingData] = useState<JobHCTracking[]>([]);
  const [inProgressData, setInProgressData] = useState<ChartDataPoint[]>([]);
  const [offeredData, setOfferedData] = useState<ChartDataPoint[]>([]);
  const [onboardedData, setOnboardedData] = useState<ChartDataPoint[]>([]);
  const [overdueData, setOverdueData] = useState<ChartDataPoint[]>([]);

  useHeader({ title: '📊 IDL Recruitment Dashboard', subTitle: 'Headcount, status & pipeline analytics.' }, []);

  useEffect(() => {
    Promise.all([
      searchDepartmentsApi({ limit: 1000 }),
      searchJobsApi({ limit: 1000 }),
    ]).then(([d, j]) => {
      setDepartments(d.data || []);
      setJobs(j.data || []);
    }).catch(() => toast.error('Failed to load filter options'));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const dateF: any = {};
        if (filters.dateFrom) dateF.from = filters.dateFrom;
        if (filters.dateTo) dateF.to = filters.dateTo;
        const deptFilter = filters.selectedDeptId ? Number(filters.selectedDeptId) : undefined;
        const jobFilter = filters.selectedJobId ? Number(filters.selectedJobId) : undefined;

        const [dr, mr, rr, hr, jtr, ip, off, onb, ovd] = await Promise.all([
          fetchHCByDepartmentApi(dateF),
          fetchHCByMonthApi({ department_id: deptFilter, ...dateF }),
          fetchHCByRecruiterApi({ department_id: deptFilter, job_id: jobFilter, ...dateF }),
          fetchHCByHrbpApi({ department_id: deptFilter, job_id: jobFilter, ...dateF }),
          fetchJobHCTrackingApi({ department_id: deptFilter }),
          fetchHCByStatusAndMonthApi('In progress', dateF),
          fetchHCByStatusAndMonthApi('Offered', dateF),
          fetchHCByStatusAndMonthApi('Onboarded', dateF),
          fetchHCByStatusAndMonthApi('Overdue', dateF),
        ]);

        setDeptHCData(dr); setMonthHCData(mr); setRecruiterData(rr); setHrbpData(hr);
        setJobTrackingData(jtr); setInProgressData(ip); setOfferedData(off);
        setOnboardedData(onb); setOverdueData(ovd);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to load dashboard');
      }
    }
    load();
  }, [filters.selectedDeptId, filters.selectedJobId, filters.dateFrom, filters.dateTo]);

  const totalHCRequested = useMemo(() => deptHCData.reduce((s, d) => s + d.value, 0), [deptHCData]);
  const totalHrbpPending = useMemo(() => hrbpData.reduce((s, d) => s + d.value, 0), [hrbpData]);
  const totalRecruiterPending = useMemo(() => recruiterData.reduce((s, d) => s + d.value, 0), [recruiterData]);

  const handleSiteToggle = (site: string) =>
    setFilters((p) => ({ ...p, selectedSites: p.selectedSites.includes(site) ? p.selectedSites.filter((s) => s !== site) : [...p.selectedSites, site] }));

  const handleStatusToggle = (status: string) =>
    setFilters((p) => ({ ...p, selectedStatuses: p.selectedStatuses.includes(status) ? p.selectedStatuses.filter((s) => s !== status) : [...p.selectedStatuses, status] }));

  const handleFilterChange = (key: keyof DashboardFilters, value: string) =>
    setFilters((p) => ({ ...p, [key]: value }));

  const handleClearAll = () =>
    setFilters({ selectedSites: [], selectedStatuses: [], selectedDeptId: '', selectedJobId: '', dateFrom: '', dateTo: '' });

  return (
    <div className="select-none space-y-3 pb-4">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/*
        ┌─────────────────────────────────────────────────────────────────────────┐
        │  GRID: 2 rows × fixed height                                            │
        │                                                                         │
        │  Row 1 (ROW_1_H px):  [FilterPanel] [HRBP] [Recruiter] [MonthlyChart] │
        │  Row 2 (ROW_2_H px):  [FilterPanel] [StatusLine]       [Dept] [JobTbl] │
        └─────────────────────────────────────────────────────────────────────────┘
        FilterPanel spans both rows via absolute positioning trick below.
      */}

      {/* Wrapper that creates the 2 rows side-by-side with the filter panel spanning both */}
      <div className="flex gap-3" style={{ height: ROW_1_H + ROW_2_H + 12 }}>

        {/* ── LEFT: Filter Panel spanning full height ── */}
        <div className="shrink-0 flex flex-col" style={{ width: 220 }}>
          <FilterPanel
            filters={filters}
            departments={departments}
            jobs={jobs}
            totalHCRequested={totalHCRequested}
            onSiteToggle={handleSiteToggle}
            onStatusToggle={handleStatusToggle}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
          />
        </div>

        {/* ── RIGHT: Two stacked rows ── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">

          {/* Row 1 */}
          <div className="flex gap-3 shrink-0" style={{ height: ROW_1_H }}>
            {/* HRBP */}
            <div className="flex flex-col" style={{ width: 160 }}>
              <DashboardTable
                data={hrbpData}
                rowKey={(item, idx) => idx}
                columns={[
                  {
                    header: 'HRBP',
                    renderCell: (item) => <span className="truncate max-w-[80px] block font-medium">{item.label}</span>,
                    cellClassName: 'px-2 py-1 text-slate-700',
                    renderFooter: () => <span className="text-xs font-bold text-slate-700">Total</span>,
                  },
                  {
                    header: 'Pending',
                    headerClassName: 'text-right',
                    renderCell: (item) => item.value,
                    cellClassName: 'px-2 py-1 text-right font-bold text-slate-800 w-10',
                    renderFooter: () => <span className="text-xs font-black text-slate-900">{totalHrbpPending}</span>,
                  },
                ]}
              />
            </div>
            {/* Recruiter */}
            <div className="flex flex-col" style={{ width: 160 }}>
              <DashboardTable
                data={recruiterData}
                rowKey={(item, idx) => idx}
                columns={[
                  {
                    header: 'Recruiter',
                    renderCell: (item) => <span className="truncate max-w-[80px] block font-medium">{item.label}</span>,
                    cellClassName: 'px-2 py-1 text-slate-700',
                    renderFooter: () => <span className="text-xs font-bold text-slate-700">Total</span>,
                  },
                  {
                    header: 'Pending',
                    headerClassName: 'text-right',
                    renderCell: (item) => item.value,
                    cellClassName: 'px-2 py-1 text-right font-bold text-slate-800 w-10',
                    renderFooter: () => <span className="text-xs font-black text-slate-900">{totalRecruiterPending}</span>,
                  },
                ]}
              />
            </div>
            {/* Monthly HC Chart */}
            <div className="flex-1 flex flex-col min-w-0">
              <MonthlyHCChart data={monthHCData} />
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex gap-3 shrink-0" style={{ height: ROW_2_H }}>
            {/* Status Line Chart */}
            <div className="flex-1 flex flex-col min-w-0">
              <StatusLineChart
                inProgressData={inProgressData}
                offeredData={offeredData}
                onboardedData={onboardedData}
                overdueData={overdueData}
              />
            </div>
            {/* Dept HC Chart */}
            <div className="flex flex-col" style={{ width: 220 }}>
              <DeptHCChart data={deptHCData} />
            </div>
            {/* Job HC Table */}
            <div className="flex flex-col" style={{ width: 300 }}>
              <DashboardTable
                data={jobTrackingData}
                rowKey={(item) => item.job_id}
                columns={[
                  {
                    header: 'Job title',
                    headerClassName: 'text-left',
                    cellClassName: 'px-2 py-1.5 text-slate-700 font-medium',
                    renderCell: (item) => item.job_title || '—',
                    renderFooter: () => <span className="text-xs font-bold text-slate-700">Total</span>,
                  },
                  {
                    header: 'RQ',
                    headerClassName: 'text-right',
                    cellClassName: 'px-2 py-1.5 text-right text-slate-600',
                    renderCell: (item) => item.candidate_required,
                    renderFooter: (items) => items.reduce((sum, item) => sum + item.candidate_required, 0),
                  },
                  {
                    header: 'Closed',
                    headerClassName: 'text-right',
                    cellClassName: 'px-2 py-1.5 text-right text-excel-green font-bold',
                    renderCell: (item) => item.closed_count,
                    renderFooter: (items) => (
                      <span className="text-excel-green-dark font-black">
                        {items.reduce((sum, item) => sum + item.closed_count, 0)}
                      </span>
                    ),
                  },
                  {
                    header: 'Open',
                    headerClassName: 'text-right',
                    cellClassName: 'px-2 py-1.5 text-right font-bold text-slate-800',
                    renderCell: (item) => item.open_count,
                    renderFooter: (items) => items.reduce((sum, item) => sum + item.open_count, 0),
                  },
                ]}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
