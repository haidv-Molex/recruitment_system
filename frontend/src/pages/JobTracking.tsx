import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Trash2, Users, FileUp, Download, Plus } from 'lucide-react';
import Pagination from '../components/ui/Pagination';
import ExcelTable from '../components/common/ExcelTable';
import JobForm from '../components/job/JobForm';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import {
  createJobApi,
  createJobExtendedApi,
  searchJobsApi,
  updateJobApi,
  deleteJobApi,
  downloadIdlTrackingSheetApi,
  downloadFullWorkbookApi,
  getJobApi,
  batchImportJobsApi,
} from '../services/jobApi';
import { FileBadge, FilePreviewModal } from '../components/common/FilePreview';
import JobExcelImport from '../components/job/JobExcelImport';
import JobConfirmDeleteModal from '../components/job/JobConfirmDeleteModal';
import { useHeader } from '../contexts/HeaderContext';

const statusClass = (status: string) =>
  `status-pill status-${String(status || '').toLowerCase().replace(/\s+/g, '-')}`;

// Map ExcelTable column-filter keys → API search params
const COLUMN_KEY_TO_API: Record<string, string> = {
  jobCode: 'job_code',
  project: 'project',
  department: 'department',
  jobTitle: 'job_title',
  eeLevel: 'ee_level',
  sites: 'site',
  projectSegment: 'segment',
  hiringManager: 'manager',
  hrbp: 'partner',
  note: 'note',
};

const mapApiJobToRow = (j: any) => ({
  id: j.job_id,
  jobCode: j.job_code,
  project: j.project,
  department: (j.departments || []).map((d: any) => d.department_code || d.department_name || '').filter(Boolean).join(', '),
  hcRequested: j.candidate_required,
  jobTitle: (j.titles || []).map((t: any) => t.level_name).join(', '),
  eeLevel: (j.employee_levels || []).map((el: any) => el.level_name).join(', '),
  sites: (j.sites || []).map((s: any) => s.site_code || s.site_name || '').filter(Boolean).join(', '),
  projectSegment: (j.segments || []).map((sg: any) => sg.segment_name).join(', '),
  hiringManager: (j.managers || []).map((m: any) => m.user_name).join(', '),
  hrbp: (j.partners || []).map((p: any) => p.user_name).join(', '),
  recruiter: '',
  myhrRequestDate: j.request_date ? String(j.request_date).slice(0, 10) : '',
  status: 'Searching',
  offerDate: '',
  note: j.note,
  departments: j.departments || [],
  segments: j.segments || [],
  sitesData: j.sites || [],
  titles: j.titles || [],
  employee_levels: j.employee_levels || [],
  partners: j.partners || [],
  managers: j.managers || [],
  file: j.file || null,
});

export interface JobTrackingPageProps {
  jobs: any[];
  setJobs: React.Dispatch<React.SetStateAction<any[]>>;
  candidates: any[];
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const JobTrackingPage = ({ jobs, setJobs, candidates }: JobTrackingPageProps) => {
  const { toasts, removeToast, toast } = useToast();
  const [selectedJobCode, setSelectedJobCode] = useState('');
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [showExcelImport, setShowExcelImport] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const loadJobsFromApi = useCallback(async (page: number = 1, limit: number = pageSize, extraParams: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const result = await searchJobsApi({ page, limit, ...extraParams });
      setJobs((result.data || []).map(mapApiJobToRow));
      setTotalItems(result.pagination?.total_items ?? result.data?.length ?? 0);
      setCurrentPage(page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load jobs.');
    }
    setLoading(false);
  }, [setJobs, toast, pageSize]);

  useEffect(() => {
    loadJobsFromApi(1, pageSize);
  }, []);

  const selectedJob = jobs.find((job) => job.jobCode === selectedJobCode);
  const selectedCandidates = selectedJobCode
    ? candidates.filter((candidate) => candidate.jobCode === selectedJobCode)
    : [];

  const handleSaveJob = async (formData: any) => {
    setSaving(true);

    const apiPayload = {
      job_code: formData.jobCode,
      project: formData.project,
      candidate_required: formData.candidateRequired,
      note: formData.note,
      request_date: formData.requestDate,
      file: formData.file,
      // Existing IDs
      partners: (formData.partners || []).filter((p: any) => typeof p === 'number' || !isNaN(Number(p))).map(Number),
      departments: (formData.departments || []).filter((d: any) => typeof d === 'number' || !isNaN(Number(d))).map(Number),
      segments: (formData.segments || []).filter((s: any) => typeof s === 'number' || !isNaN(Number(s))).map(Number),
      sites: (formData.sites || []).filter((s: any) => typeof s === 'number' || !isNaN(Number(s))).map(Number),
      titles: (formData.titles || []).filter((t: any) => typeof t === 'number' || !isNaN(Number(t))).map(Number),
      managers: (formData.managers || []).filter((m: any) => typeof m === 'number' || !isNaN(Number(m))).map(Number),
      employee_levels: (formData.employeeLevels || []).filter((el: any) => typeof el === 'number' || !isNaN(Number(el))).map(Number),

      // New Names to auto-create on backend
      partners_name: (formData.partners || []).filter((p: any) => typeof p === 'string' && isNaN(Number(p))),
      departments_name: (formData.departments || []).filter((d: any) => typeof d === 'string' && isNaN(Number(d))),
      segments_name: (formData.segments || []).filter((s: any) => typeof s === 'string' && isNaN(Number(s))),
      sites_name: (formData.sites || []).filter((s: any) => typeof s === 'string' && isNaN(Number(s))),
      titles_name: (formData.titles || []).filter((t: any) => typeof t === 'string' && isNaN(Number(t))),
      managers_name: (formData.managers || []).filter((m: any) => typeof m === 'string' && isNaN(Number(m))),
      employee_levels_name: (formData.employeeLevels || []).filter((el: any) => typeof el === 'string' && isNaN(Number(el))),
    };

    try {
      if (editingJob) {
        await updateJobApi(editingJob.job_id || editingJob.id, apiPayload);
        toast.success('Job updated successfully.');
        setShowJobForm(false);
        setEditingJob(null);
        await loadJobsFromApi(currentPage, pageSize);
      } else {
        await createJobExtendedApi(apiPayload);
        toast.success('Job created successfully.');
        setShowJobForm(false);
        await loadJobsFromApi(1, pageSize);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  // Active search params must be declared before handlers that reload data
  const [activeSearchParams, setActiveSearchParams] = useState<Record<string, any>>({});

  const [confirmDeleteState, setConfirmDeleteState] = useState<{
    isOpen: boolean;
    jobIds: number[];
    message: string;
  }>({
    isOpen: false,
    jobIds: [],
    message: '',
  });

  const requestDeleteJobs = (ids: number[], message: string) => {
    setConfirmDeleteState({
      isOpen: true,
      jobIds: ids,
      message,
    });
  };

  const handleConfirmDelete = async () => {
    const ids = confirmDeleteState.jobIds;
    setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
    if (ids.length === 0) return;

    try {
      await deleteJobApi(ids);
      toast.success(ids.length === 1 ? 'Job deleted successfully.' : `Successfully deleted ${ids.length} jobs.`);
      const newTotal = totalItems - ids.length;
      const newMaxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = currentPage > newMaxPage ? newMaxPage : currentPage;
      await loadJobsFromApi(targetPage, pageSize, activeSearchParams);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

  const handleTableSearch = useCallback(
    (colFilters: Record<string, string>, globalSearch: string) => {
      const params: Record<string, any> = {};
      if (globalSearch.trim()) params.search = globalSearch.trim();
      Object.entries(colFilters).forEach(([key, val]) => {
        if (val.trim() && COLUMN_KEY_TO_API[key]) {
          params[COLUMN_KEY_TO_API[key]] = val.trim();
        }
      });
      setActiveSearchParams(params);
      loadJobsFromApi(1, pageSize, params);
    },
    [loadJobsFromApi, pageSize]
  );

  const handleImportJobsBatch = async (
    parsedJobs: any[]
  ): Promise<{ success: boolean; importedCount: number; errors: any[] }> => {
    const splitByIdExists = (items: any[]) => {
      const ids: number[] = [];
      const names: string[] = [];
      (items || []).forEach((item) => {
        const idVal = item.id !== null && item.id !== undefined ? item.id
                    : item.department_id !== null && item.department_id !== undefined ? item.department_id
                    : item.site_id !== null && item.site_id !== undefined ? item.site_id
                    : item.segment_id !== null && item.segment_id !== undefined ? item.segment_id
                    : item.level_id !== null && item.level_id !== undefined ? item.level_id
                    : item.user_id !== null && item.user_id !== undefined ? item.user_id
                    : null;

        if (idVal !== null && idVal !== undefined) {
          ids.push(idVal);
        } else if (item.name || item.department_name || item.site_name || item.segment_name || item.level_name || item.user_name) {
          names.push(item.name || item.department_name || item.site_name || item.segment_name || item.level_name || item.user_name);
        }
      });
      return { ids, names };
    };

    const jobsPayload = parsedJobs.map((parsedJob) => {
      const partners = splitByIdExists(parsedJob.partners);
      const managers = splitByIdExists(parsedJob.managers);
      const departments = splitByIdExists(parsedJob.departments);
      const segments = splitByIdExists(parsedJob.segments);
      const sites = splitByIdExists(parsedJob.sites);
      const titles = splitByIdExists(parsedJob.titles);
      const employeeLevels = splitByIdExists(parsedJob.employeeLevels);

      return {
        job_code: parsedJob.jobCode,
        project: parsedJob.project,
        candidate_required: parsedJob.candidateRequired,
        note: parsedJob.note || '',
        request_date: parsedJob.requestDate || '',
        partners: partners.ids,
        departments: departments.ids,
        segments: segments.ids,
        sites: sites.ids,
        titles: titles.ids,
        managers: managers.ids,
        employee_levels: employeeLevels.ids,
        partners_name: partners.names,
        managers_name: managers.names,
        departments_name: departments.names,
        segments_name: segments.names,
        sites_name: sites.names,
        titles_name: titles.names,
        employee_levels_name: employeeLevels.names,
      };
    });

    try {
      const result = await batchImportJobsApi(jobsPayload);
      if (result.success) {
        toast.success(`Imported ${result.importedCount} jobs successfully!`);
      } else {
        toast.warn(`Imported ${result.importedCount} jobs, but encountered ${result.errors.length} error(s).`);
      }
      return result;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Batch import failed';
      toast.error('Batch import failed: ' + errMsg);
      return {
        success: false,
        importedCount: 0,
        errors: parsedJobs.map(j => ({ job_code: j.jobCode, message: errMsg }))
      };
    }
  };

  const handleExportIDL = async () => {
    try {
      await downloadIdlTrackingSheetApi();
      toast.success('Downloaded IDL tracking sheet.');
    } catch (err: any) {
      toast.error('Download IDL sheet failed: ' + err.message);
    }
  };

  const handleExportWorkbook = async () => {
    try {
      await downloadFullWorkbookApi();
      toast.success('Downloaded Full Workbook.');
    } catch (err: any) {
      toast.error('Download Full Workbook failed: ' + err.message);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    loadJobsFromApi(page, pageSize, activeSearchParams);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    loadJobsFromApi(1, newSize, activeSearchParams);
  };

  const columns = useMemo(
    () => [
      { key: 'jobCode', label: 'Job Code', width: 110 },
      { key: 'project', label: 'Project Name', width: 150 },
      { key: 'department', label: 'Dept', width: 90 },
      { key: 'hcRequested', label: 'HC Req', width: 70, align: 'right' as const, disableFilter: true },
      { key: 'jobTitle', label: 'Job Title', width: 160 },
      { key: 'eeLevel', label: 'EE Level', width: 100 },
      { key: 'sites', label: 'Site', width: 80 },
      { key: 'projectSegment', label: 'Segment', width: 120 },
      { key: 'hiringManager', label: 'Manager', width: 130 },
      { key: 'hrbp', label: 'HRBP / Partner', width: 135 },
      { key: 'myhrRequestDate', label: 'Req Date', width: 100, disableFilter: true },
      {
        key: 'status',
        label: 'Status',
        width: 110,
        disableTruncate: true,
        disableFilter: true,
        render: (_: any, val: any) => <span className={statusClass(val)}>{val || 'Searching'}</span>,
      },
      {
        key: 'file',
        label: 'JD File',
        width: 150,
        disableTruncate: true,
        disableFilter: true,
        render: (_: any, file: any) =>
          file ? (
            <FileBadge file={file} onClick={() => setPreviewFile(file)} />
          ) : (
            <span className="text-slate-400 font-medium">—</span>
          ),
      },
      { key: 'note', label: 'Note', width: 200 },
    ],
    []
  );

  const tableActions = [
    {
      label: 'Edit',
      icon: <Edit2 size={14} />,
      onClick: async (row: any) => {
        try {
          const fullJob = await getJobApi(row.id);
          setEditingJob(fullJob);
          setShowJobForm(true);
        } catch (err: any) {
          toast.error(err.response?.data?.message || err.message || 'Failed to load job details.');
        }
      },
      // onBulkClick omitted → disabled for multi-select
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} className="text-red-500" />,
      onClick: (row: any) =>
        requestDeleteJobs(
          [row.id],
          `Bạn có chắc chắn muốn xóa công việc ${row.jobCode} không? Hành động này không thể hoàn tác.`
        ),
      onBulkClick: (selectedRows: any[]) =>
        requestDeleteJobs(
          selectedRows.map((r) => r.id),
          `Bạn có chắc chắn muốn xóa ${selectedRows.length} công việc đã chọn không? Hành động này không thể hoàn tác.`
        ),
    },
  ];

  const headerActions = useMemo(() => (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setShowExcelImport(true)}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 active:bg-slate-100 transition-all cursor-pointer"
      >
        <FileUp size={14} />
        <span>Import Excel</span>
      </button>
      <button
        type="button"
        onClick={handleExportIDL}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 active:bg-slate-100 transition-all cursor-pointer"
      >
        <Download size={14} />
        <span>Export IDL</span>
      </button>
      <button
        type="button"
        onClick={handleExportWorkbook}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 active:bg-slate-100 transition-all cursor-pointer"
      >
        <Download size={14} />
        <span>Export Workbook</span>
      </button>
      <button
        type="button"
        onClick={() => {
          setEditingJob(null);
          setShowJobForm(true);
        }}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white active:bg-emerald-800 transition-all cursor-pointer"
      >
        <Plus size={14} />
        <span>Add Job</span>
      </button>
    </div>
  ), [handleExportIDL, handleExportWorkbook]);

  useHeader({
    title: '📊 Job Tracking Sheet',
    subTitle: `Excel-like job tracking database. Total: ${totalItems} job requests`,
    actions: headerActions,
  }, [totalItems, headerActions]);

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <ExcelTable
            title="Active Job Openings"
            rows={jobs}
            columns={columns}
            actions={tableActions}
            selectedId={selectedJobCode}
            onSelectRow={(row: any) => setSelectedJobCode(row.jobCode === selectedJobCode ? '' : row.jobCode)}
            onSearch={handleTableSearch}
            isLoading={loading}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            itemLabel="jobs"
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
      </div>

      {/* Selected Job candidates details drawer */}
      {selectedJob && (
        <section className="bg-slate-50 rounded-xl border border-slate-200/60 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <Users className="text-emerald-600" size={20} />
                Candidates applying for Job code: {selectedJobCode}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Current active pipeline applying for this requisition.
              </p>
            </div>
            <button
              onClick={() => setSelectedJobCode('')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 px-2.5 py-1 rounded"
            >
              Hide Pipeline
            </button>
          </div>

          {selectedCandidates.length === 0 ? (
            <p className="text-sm text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg p-6 text-center font-medium">
              No candidates are currently applying for this job.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedCandidates.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all"
                >
                  <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Status:{' '}
                    <span className="font-semibold text-emerald-600 capitalize">{c.status}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Source: {c.source || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Modal - Job Edit / Add form */}
      {showJobForm && (
        <JobForm
          job={editingJob}
          onSubmit={handleSaveJob}
          onClose={() => setShowJobForm(false)}
          saving={saving}
        />
      )}

      {/* Excel Import Modal */}
      {showExcelImport && (
        <JobExcelImport
          onImportBatch={handleImportJobsBatch}
          onClose={() => {
            setShowExcelImport(false);
            loadJobsFromApi(currentPage, pageSize);
          }}
        />
      )}

      {/* File Preview Modal */}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      {/* Confirm Delete Modal */}
      <JobConfirmDeleteModal
        isOpen={confirmDeleteState.isOpen}
        message={confirmDeleteState.message}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
export default JobTrackingPage;
