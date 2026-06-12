import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Trash2, Users, FileUp, Download, Plus } from 'lucide-react';
import ExcelTable, { formatDate } from '../components/common/ExcelTable';
import JobForm from '../components/common/JobForm';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { calculatePipelineForJob } from '../services/mockData';
import {
  createJobApi,
  createJobExtendedApi,
  searchJobsApi,
  updateJobApi,
  deleteJobApi,
  downloadIdlTrackingSheetApi,
  downloadFullWorkbookApi,
} from '../services/jobApi';
import { FileBadge, FilePreviewModal } from '../components/common/FilePreview';
import JobExcelImport from '../components/common/JobExcelImport';
import { useHeader } from '../contexts/HeaderContext';
import Modal from '../components/ui/Modal';

const statusClass = (status: string) =>
  `status-pill status-${String(status || '').toLowerCase().replace(/\s+/g, '-')}`;

const mapApiJobToRow = (j: any) => ({
  id: j.job_id,
  jobCode: j.job_code,
  project: j.project,
  department: (j.departments || []).map((d: any) => d.department_code).join(', '),
  hcRequested: j.candidate_required,
  jobTitle: (j.titles || []).map((t: any) => t.level_name).join(', '),
  eeLevel: (j.employee_levels || []).map((el: any) => el.level_name).join(', '),
  sites: (j.sites || []).map((s: any) => s.site_code).join(', '),
  projectSegment: (j.segments || []).map((sg: any) => sg.segment_name).join(', '),
  hiringManager: (j.managers || []).map((m: any) => m.user_name).join(', '),
  hrbp: (j.partners || []).map((p: any) => p.user_name).join(', '),
  recruiter: '',
  myhrRequestDate: j.request_date ? String(j.request_date).slice(0, 10) : '',
  expectedOnboardDate: '',
  status: 'Searching',
  source: '',
  candidateName: '',
  onboardDate: '',
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

export const JobTrackingPage = ({ jobs, setJobs, candidates }: JobTrackingPageProps) => {
  const { toasts, removeToast, toast } = useToast();
  const [selectedJobCode, setSelectedJobCode] = useState('');
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoCalculate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [showExcelImport, setShowExcelImport] = useState(false);

  const loadJobsFromApi = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchJobsApi({ page: 1, limit: 100 });
      setJobs((result.data || []).map(mapApiJobToRow));
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load jobs.');
    }
    setLoading(false);
  }, [setJobs, toast]);

  useEffect(() => {
    loadJobsFromApi();
  }, []);

  const selectedJob = jobs.find((job) => job.jobCode === selectedJobCode);
  const selectedCandidates = selectedJobCode
    ? candidates.filter((candidate) => candidate.jobCode === selectedJobCode)
    : [];

  const rows = useMemo(() => {
    return jobs.map((job) => {
      const pipeline = calculatePipelineForJob(job.jobCode, candidates);
      const jobCandidates = candidates.filter((candidate) => candidate.jobCode === job.jobCode);
      const finalCandidate =
        jobCandidates.find((candidate) => candidate.status === 'Onboarded') ||
        jobCandidates.find((candidate) => candidate.status === 'Offer Accepted') ||
        jobCandidates.find((candidate) => candidate.status === 'Offered' || candidate.status === 'Offer');

      return {
        ...job,
        cvSent: autoCalculate ? pipeline.cvSent : job.cvSent || 0,
        interview: autoCalculate ? pipeline.interview : job.interview || 0,
        offered: autoCalculate ? pipeline.offered : job.offered || 0,
        offerAccepted: autoCalculate ? pipeline.offerAccepted : job.offerAccepted || 0,
        onboarded: autoCalculate ? pipeline.onboarded : job.onboarded || 0,
        offerRejected: autoCalculate ? pipeline.offerRejected : job.offerRejected || 0,
        candidateName: job.candidateName || finalCandidate?.name || '',
        onboardDate: job.onboardDate || finalCandidate?.onboardingDate || '',
        offerDate: job.offerDate || finalCandidate?.offerSentDate || '',
      };
    });
  }, [jobs, candidates, autoCalculate]);

  const handleSaveJob = async (formData: any) => {
    setSaving(true);

    const apiPayload = {
      job_code: formData.jobCode,
      project: formData.project,
      candidate_required: formData.candidateRequired,
      note: formData.note,
      request_date: formData.requestDate,
      file: formData.file,
      partners: formData.partners,
      departments: formData.departments,
      segments: formData.segments,
      sites: formData.sites,
      titles: formData.titles,
      managers: formData.managers,
      employee_levels: formData.employeeLevels,
    };

    if (editingJob) {
      try {
        await updateJobApi(editingJob.id, apiPayload);
        toast.success('Job updated successfully.');
        setShowJobForm(false);
        setEditingJob(null);
        await loadJobsFromApi();
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Update failed.');
      }
      setSaving(false);
      return;
    }

    try {
      await createJobApi(apiPayload);
      toast.success('Job created successfully.');
      setShowJobForm(false);
      await loadJobsFromApi();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Create failed.');
    }

    setSaving(false);
  };

  const handleDeleteJob = async (job: any) => {
    if (!confirm(`Delete job ${job.jobCode}?`)) return;

    try {
      await deleteJobApi(job.id);
      toast.success('Job deleted.');
      await loadJobsFromApi();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

  const handleImportJob = async (parsedJob: any): Promise<{ success: boolean; message?: string }> => {
    const splitByIdExists = (items: any[]) => {
      const ids: number[] = [];
      const names: string[] = [];
      (items || []).forEach((item) => {
        if (item.id !== null && item.id !== undefined) {
          ids.push(item.id);
        } else if (item.name) {
          names.push(item.name);
        }
      });
      return { ids, names };
    };

    const partners = splitByIdExists(parsedJob.partners);
    const managers = splitByIdExists(parsedJob.managers);
    const departments = splitByIdExists(parsedJob.departments);
    const segments = splitByIdExists(parsedJob.segments);
    const sites = splitByIdExists(parsedJob.sites);
    const titles = splitByIdExists(parsedJob.titles);
    const employeeLevels = splitByIdExists(parsedJob.employeeLevels);

    const formData = {
      job_code: parsedJob.jobCode,
      project: parsedJob.project,
      candidate_required: parsedJob.candidateRequired,
      note: parsedJob.note || '',
      request_date: parsedJob.requestDate || '',
      file: null,
      partners: partners.ids,
      departments: departments.ids,
      segments: segments.ids,
      sites: sites.ids,
      titles: titles.ids,
      managers: managers.ids,
      employee_levels: employeeLevels.ids,
      // Auto-create names
      new_partners: partners.names,
      new_managers: managers.names,
      new_departments: departments.names,
      new_segments: segments.names,
      new_sites: sites.names,
      new_titles: titles.names,
      new_employee_levels: employeeLevels.names,
    };

    try {
      await createJobExtendedApi(formData);
      toast.success(`Job Code ${parsedJob.jobCode} imported successfully.`);
      return { success: true };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Import failed';
      toast.error(`Import Job ${parsedJob.jobCode} failed: ` + errMsg);
      return { success: false, message: errMsg };
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

  const columns = useMemo(
    () => [
      { key: 'jobCode', label: 'Job Code', width: 110, frozen: true },
      { key: 'project', label: 'Project Name', width: 140, frozen: true },
      { key: 'department', label: 'Dept', width: 80 },
      { key: 'hcRequested', label: 'HC Req', width: 70, align: 'right' as const },
      { key: 'jobTitle', label: 'Job Title', width: 160 },
      { key: 'eeLevel', label: 'EE Level', width: 100 },
      { key: 'sites', label: 'Site', width: 80 },
      { key: 'projectSegment', label: 'Segment', width: 115 },
      { key: 'hiringManager', label: 'Manager', width: 130 },
      { key: 'hrbp', label: 'HRBP / Partner', width: 135 },
      { key: 'myhrRequestDate', label: 'Req Date', width: 95 },
      {
        key: 'cvSent',
        label: 'CV Sent',
        width: 70,
        align: 'right' as const,
        render: (_: any, v: any) => <span className="font-bold text-slate-800">{v}</span>,
      },
      {
        key: 'interview',
        label: 'Intvw',
        width: 65,
        align: 'right' as const,
        render: (_: any, v: any) => <span className="font-bold text-slate-800">{v}</span>,
      },
      {
        key: 'offered',
        label: 'Offer',
        width: 65,
        align: 'right' as const,
        render: (_: any, v: any) => <span className="font-bold text-slate-800">{v}</span>,
      },
      {
        key: 'offerAccepted',
        label: 'Accpt',
        width: 65,
        align: 'right' as const,
        render: (_: any, v: any) => <span className="font-bold text-emerald-600">{v}</span>,
      },
      {
        key: 'onboarded',
        label: 'Onb',
        width: 60,
        align: 'right' as const,
        render: (_: any, v: any) => <span className="font-bold text-emerald-600">{v}</span>,
      },
      {
        key: 'offerRejected',
        label: 'Rej',
        width: 60,
        align: 'right' as const,
        render: (_: any, v: any) => <span className="font-bold text-red-500">{v}</span>,
      },
      {
        key: 'status',
        label: 'Status',
        width: 100,
        render: (_: any, val: any) => <span className={statusClass(val)}>{val || 'Searching'}</span>,
      },
      { key: 'candidateName', label: 'Candidate Name', width: 160 },
      { key: 'onboardDate', label: 'Onboard Date', width: 105, render: (_: any, v: any) => formatDate(v) },
      { key: 'offerDate', label: 'Offer Date', width: 105, render: (_: any, v: any) => formatDate(v) },
      {
        key: 'file',
        label: 'JD File',
        width: 150,
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
      onClick: (row: any) => {
        setEditingJob(row);
        setShowJobForm(true);
      },
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} className="text-red-500" />,
      onClick: (row: any) => handleDeleteJob(row),
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
    subTitle: `Excel-like job tracking database. Total: ${jobs.length} job requests`,
    actions: headerActions,
  }, [jobs.length, headerActions]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-medium">Loading tracking data...</div>
        ) : (
          <ExcelTable
            title="Active Job Openings"
            rows={rows}
            columns={columns}
            actions={tableActions}
            selectedId={selectedJobCode}
            onSelectRow={(row: any) => setSelectedJobCode(row.jobCode === selectedJobCode ? '' : row.jobCode)}
            defaultVisibleColumns={[
              'jobCode',
              'project',
              'department',
              'hcRequested',
              'jobTitle',
              'eeLevel',
              'sites',
              'projectSegment',
              'cvSent',
              'interview',
              'offered',
              'offerAccepted',
              'onboarded',
              'status',
              'candidateName',
              'onboardDate',
              'file',
            ]}
          />
        )}
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
          onImport={handleImportJob}
          onClose={() => {
            setShowExcelImport(false);
            loadJobsFromApi();
          }}
        />
      )}

      {/* File Preview Modal */}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
    </div>
  );
};
export default JobTrackingPage;
