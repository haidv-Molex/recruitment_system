import { useState, useEffect, useMemo, useCallback } from 'react';
import { Download } from 'lucide-react';
import { downloadValidationSheetApi } from '@/services/candidateApi';
import { downloadFullWorkbookApi } from '@/services/jobApi';
import {
  fetchHCByDepartmentApi,
  fetchHCByStatusAndMonthApi,
  fetchHCByRecruiterApi,
  fetchHCByHrbpApi,
  fetchHCByMonthApi,
  fetchJobHCTrackingApi,
  fetchRecruitmentFunnelApi,
  fetchCandidatesByPlatformApi,
  ChartDataPoint,
  JobHCTracking,
} from '@/services/dashboardApi';
import { searchDepartmentsApi } from '@/services/departmentApi';
import { searchJobsApi } from '@/services/jobApi';
import { searchSitesApi } from '@/services/siteApi';
import { useHeader } from '@/contexts/HeaderContext';
import ToastContainer from '@/components/common/Toast';
import { useToast } from '@/hooks/useToast';

import FilterPanel, { DashboardFilters } from '@/components/dashboard/FilterPanel';
import DashboardTable from '@/components/dashboard/DashboardTable';
import MonthlyHCChart from '@/components/dashboard/MonthlyHCChart';
import StatusLineChart from '@/components/dashboard/StatusLineChart';
import DeptHCChart from '@/components/dashboard/DeptHCChart';
import CandidatesByDeptDonutChart from '@/components/dashboard/CandidatesByDeptDonutChart';
import RecruitmentFunnelChart from '@/components/dashboard/RecruitmentFunnelChart';

// Fixed row heights for the dashboard charts/tables
const ROW_1_H = 340; // px — top row
const ROW_2_H = 360; // px — bottom row

export const DashboardPage = () => {
  const { toasts, removeToast, toast } = useToast();

  const [filters, setFilters] = useState<DashboardFilters>({
    selectedSiteId: '',
    selectedStatuses: [],
    selectedDeptId: '',
    selectedJobId: '',
    dateFrom: '',
    dateTo: '',
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  const [deptHCData, setDeptHCData] = useState<ChartDataPoint[]>([]);
  const [monthHCData, setMonthHCData] = useState<ChartDataPoint[]>([]);
  const [recruiterData, setRecruiterData] = useState<ChartDataPoint[]>([]);
  const [hrbpData, setHrbpData] = useState<ChartDataPoint[]>([]);
  const [jobTrackingData, setJobTrackingData] = useState<JobHCTracking[]>([]);
  const [inProgressData, setInProgressData] = useState<ChartDataPoint[]>([]);
  const [offeredData, setOfferedData] = useState<ChartDataPoint[]>([]);
  const [onboardedData, setOnboardedData] = useState<ChartDataPoint[]>([]);
  const [overdueData, setOverdueData] = useState<ChartDataPoint[]>([]);
  const [funnelData, setFunnelData] = useState<ChartDataPoint[]>([]);
  const [candidatesByPlatformData, setCandidatesByPlatformData] = useState<ChartDataPoint[]>([]);

  const handleDownloadTemplate = useCallback(async () => {
    toast.info('Downloading template...');
    try {
      await downloadValidationSheetApi();
      toast.success('Downloaded template.');
    } catch (err: any) {
      toast.error(err.message || 'Download failed.');
    }
  }, [toast]);

  const handleDownloadFullWorkbook = useCallback(async () => {
    toast.info('Downloading full workbook...');
    try {
      await downloadFullWorkbookApi();
      toast.success('Downloaded full workbook.');
    } catch (err: any) {
      toast.error(err.message || 'Download failed.');
    }
  }, [toast]);

  const headerActions = useMemo(() => (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleDownloadTemplate}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 active:bg-slate-100 transition-all cursor-pointer"
        title="Download Validation Template"
      >
        <Download size={14} />
        <span>Template</span>
      </button>
      <button
        type="button"
        onClick={handleDownloadFullWorkbook}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 active:bg-slate-100 transition-all cursor-pointer"
        title="Download Full Workbook"
      >
        <Download size={14} />
        <span>Full Workbook</span>
      </button>
    </div>
  ), [handleDownloadTemplate, handleDownloadFullWorkbook]);

  useHeader({
    title: '📊 IDL Recruitment Dashboard',
    subTitle: 'Headcount, status & pipeline analytics.',
    actions: headerActions,
  }, [headerActions]);

  useEffect(() => {
    Promise.all([
      searchDepartmentsApi({ limit: 1000 }),
      searchJobsApi({ limit: 1000 }),
      searchSitesApi({ limit: 1000 }),
    ]).then(([d, j, s]) => {
      setDepartments(d.data || []);
      setJobs(j.data || []);
      setSites(s.data || []);
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
        const siteFilter = filters.selectedSiteId ? Number(filters.selectedSiteId) : undefined;

        const siteIds = siteFilter !== undefined ? [siteFilter] : undefined;
        const jobIds = jobFilter !== undefined ? [jobFilter] : undefined;
        const deptIds = deptFilter !== undefined ? [deptFilter] : undefined;

        const [dr, mr, rr, hr, jtr, ip, off, onb, ovd, fun, cbp] = await Promise.all([
          fetchHCByDepartmentApi({ job_id: jobFilter, ...dateF }),
          fetchHCByMonthApi({ department_id: deptFilter, ...dateF }),
          fetchHCByRecruiterApi({ department_id: deptFilter, job_id: jobFilter, ...dateF }),
          fetchHCByHrbpApi({ department_id: deptFilter, job_id: jobFilter, ...dateF }),
          fetchJobHCTrackingApi({ department_id: deptFilter }),
          fetchHCByStatusAndMonthApi('In progress', dateF),
          fetchHCByStatusAndMonthApi('Offered', dateF),
          fetchHCByStatusAndMonthApi('Onboarded', dateF),
          fetchHCByStatusAndMonthApi('Overdue', dateF),
          fetchRecruitmentFunnelApi({ site_id: siteIds, job_id: jobIds, department_id: deptIds }),
          fetchCandidatesByPlatformApi({
            status: filters.selectedStatuses.length > 0 ? filters.selectedStatuses : ['Offer Accepted', 'Offer accepted'],
            department_id: deptIds,
            job_id: jobIds,
          }),
        ]);

        setDeptHCData(dr); setMonthHCData(mr); setRecruiterData(rr); setHrbpData(hr);
        setJobTrackingData(jtr); setInProgressData(ip); setOfferedData(off);
        setOnboardedData(onb); setOverdueData(ovd);
        setFunnelData(fun); setCandidatesByPlatformData(cbp);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to load dashboard');
      }
    }
    load();
  }, [filters.selectedDeptId, filters.selectedJobId, filters.selectedSiteId, filters.selectedStatuses, filters.dateFrom, filters.dateTo]);

  const totalHCRequested = useMemo(() => deptHCData.reduce((s, d) => s + d.value, 0), [deptHCData]);
  const totalHrbpPending = useMemo(() => hrbpData.reduce((s, d) => s + d.value, 0), [hrbpData]);
  const totalRecruiterPending = useMemo(() => recruiterData.reduce((s, d) => s + d.value, 0), [recruiterData]);

  // Frontend local filters based on status selection
  const filteredInProgressData = useMemo(() => {
    if (filters.selectedStatuses.length > 0 && !filters.selectedStatuses.includes('In progress')) return [];
    return inProgressData;
  }, [inProgressData, filters.selectedStatuses]);

  const filteredOfferedData = useMemo(() => {
    if (filters.selectedStatuses.length > 0 && !filters.selectedStatuses.includes('Offered')) return [];
    return offeredData;
  }, [offeredData, filters.selectedStatuses]);

  const filteredOnboardedData = useMemo(() => {
    if (filters.selectedStatuses.length > 0 && !filters.selectedStatuses.includes('Onboarded')) return [];
    return onboardedData;
  }, [onboardedData, filters.selectedStatuses]);

  const filteredOverdueData = useMemo(() => {
    if (filters.selectedStatuses.length > 0 && !filters.selectedStatuses.includes('Overdue')) return [];
    return overdueData;
  }, [overdueData, filters.selectedStatuses]);

  // Frontend local filters based on department selection
  const filteredDeptHCData = useMemo(() => {
    if (!filters.selectedDeptId) return deptHCData;
    const deptIdNum = Number(filters.selectedDeptId);
    const deptObj = departments.find((d) => d.department_id === deptIdNum);
    if (!deptObj) return deptHCData;
    return deptHCData.filter((d) => d.label === deptObj.department_name);
  }, [deptHCData, filters.selectedDeptId, departments]);

  // Frontend local filters based on job title selection
  const filteredJobTrackingData = useMemo(() => {
    if (!filters.selectedJobId) return jobTrackingData;
    const jobIdNum = Number(filters.selectedJobId);
    return jobTrackingData.filter((j) => j.job_id === jobIdNum);
  }, [jobTrackingData, filters.selectedJobId]);

  const handleStatusChange = (statuses: string[]) =>
    setFilters((p) => ({ ...p, selectedStatuses: statuses }));

  const handleFilterChange = (key: keyof DashboardFilters, value: string) =>
    setFilters((p) => ({ ...p, [key]: value }));

  const handleClearAll = () =>
    setFilters({ selectedSiteId: '', selectedStatuses: [], selectedDeptId: '', selectedJobId: '', dateFrom: '', dateTo: '' });

  return (
    <div className="select-none space-y-3 pb-4">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Wrapper that stacks FilterPanel horizontally and then the 3 rows of charts/tables */}
      <div className="flex flex-col gap-3">
        {/* Filter Panel (Horizontal at the top) */}
        <FilterPanel
          filters={filters}
          departments={departments}
          jobs={jobs}
          sites={sites}
          totalHCRequested={totalHCRequested}
          onStatusChange={handleStatusChange}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAll}
        />

        {/* Row 1 */}
        <div className="flex gap-3 shrink-0" style={{ height: ROW_1_H }}>
          {/* HRBP */}
          <div className="flex flex-col" style={{ width: 220 }}>
            <DashboardTable
              data={hrbpData}
              rowKey={(item, idx) => idx}
              columns={[
                {
                  header: 'HRBP',
                  width: '140px',
                  renderCell: (item) => <span className="font-medium">{item.label}</span>,
                  cellClassName: 'px-2 py-1 text-slate-700',
                  renderFooter: () => <span className="text-xs font-bold text-slate-700">Total</span>,
                },
                {
                  header: 'Pending',
                  width: '60px',
                  headerClassName: 'text-right',
                  renderCell: (item) => item.value,
                  cellClassName: 'px-2 py-1 text-right font-bold text-slate-800',
                  renderFooter: () => <span className="text-xs font-black text-slate-900">{totalHrbpPending}</span>,
                },
              ]}
            />
          </div>
          {/* Recruiter */}
          <div className="flex flex-col" style={{ width: 220 }}>
            <DashboardTable
              data={recruiterData}
              rowKey={(item, idx) => idx}
              columns={[
                {
                  header: 'Recruiter',
                  width: '140px',
                  renderCell: (item) => <span className="font-medium">{item.label}</span>,
                  cellClassName: 'px-2 py-1 text-slate-700',
                  renderFooter: () => <span className="text-xs font-bold text-slate-700">Total</span>,
                },
                {
                  header: 'candidate',
                  width: '60px',
                  headerClassName: 'text-right',
                  renderCell: (item) => item.value,
                  cellClassName: 'px-2 py-1 text-right font-bold text-slate-800',
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
              inProgressData={filteredInProgressData}
              offeredData={filteredOfferedData}
              onboardedData={filteredOnboardedData}
              overdueData={filteredOverdueData}
            />
          </div>
          {/* Dept HC Chart */}
          <div className="flex flex-col" style={{ width: 220 }}>
            <DeptHCChart data={filteredDeptHCData} />
          </div>
          {/* Job HC Table */}
          <div className="flex flex-col" style={{ width: 320 }}>
            <DashboardTable
              data={filteredJobTrackingData}
              rowKey={(item) => item.job_id}
              columns={[
                {
                  header: 'Job title',
                  width: '140px',
                  headerClassName: 'text-left',
                  cellClassName: 'px-2 py-1.5 text-slate-700 font-medium',
                  renderCell: (item) => item.job_title || '—',
                  renderFooter: () => <span className="text-xs font-bold text-slate-700">Total</span>,
                },
                {
                  header: 'RQ',
                  width: '50px',
                  headerClassName: 'text-right',
                  cellClassName: 'px-2 py-1.5 text-right text-slate-600',
                  renderCell: (item) => item.candidate_required,
                  renderFooter: (items) => items.reduce((sum, item) => sum + item.candidate_required, 0),
                },
                {
                  header: 'Closed',
                  width: '60px',
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
                  width: '60px',
                  headerClassName: 'text-right',
                  cellClassName: 'px-2 py-1.5 text-right font-bold text-slate-800',
                  renderCell: (item) => item.open_count,
                  renderFooter: (items) => items.reduce((sum, item) => sum + item.open_count, 0),
                },
              ]}
            />
          </div>
        </div>

        {/* Row 3 (New Funnel & Source widgets) */}
        <div className="flex gap-3 shrink-0" style={{ height: ROW_1_H }}>
          {/* Recruitment Source Donut Chart */}
          <div className="flex-1 flex flex-col min-w-0">
            <CandidatesByDeptDonutChart data={candidatesByPlatformData} />
          </div>
          {/* Recruitment Funnel Chart */}
          <div className="flex-1 flex flex-col min-w-0">
            <RecruitmentFunnelChart data={funnelData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
