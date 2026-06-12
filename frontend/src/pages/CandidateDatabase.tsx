import { useCallback, useEffect, useMemo, useState } from 'react';
import CandidateForm from '../components/common/CandidateForm';
import BulkCVUpload from '../components/common/BulkCVUpload';
import ExcelTable, { formatDate } from '../components/common/ExcelTable';
import { masterData } from '../services/mockData';
import ToastContainer from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import {
  createCandidateApi,
  createCandidateExtendedApi,
  searchCandidatesApi,
  deleteCandidateApi,
  updateCandidateApi,
  downloadValidationSheetApi,
  downloadDatabaseSheetApi,
} from '../services/candidateApi';
import { FileBadge, FilePreviewModal } from '../components/common/FilePreview';
import CandidateExcelImport from '../components/common/CandidateExcelImport';
import { downloadFullWorkbookApi } from '../services/jobApi';
import DatabaseHeader from '../components/candidate-database/DatabaseHeader';
import DatabaseFilters from '../components/candidate-database/DatabaseFilters';
import Modal from '../components/ui/Modal';

const statusClass = (status: string) =>
  `status-pill status-${String(status || '').toLowerCase().replace(/\s+/g, '-')}`;

const mapCandidateToRow = (c: any) => ({
  id: c.candidate_id,
  candidateCode: c.candidate_code || '',
  inputDate: c.create_at ? String(c.create_at).slice(0, 10) : '',
  name: c.candidate_name,
  email: c.candidate_email || '',
  phone: c.candidate_phone || '',
  recruiter: c.recruiter?.user_name || '',
  jobCode: c.job?.job_code || '',
  jobTitle: '',
  department: '',
  eeLevel: '',
  project: c.job?.project || '',
  hiringManager: '',
  dlIdl: 'IDL',
  status: c.status,
  onboardingDate: c.onboard_date ? String(c.onboard_date).slice(0, 10) : '',
  offerSentDate: c.offer_date ? String(c.offer_date).slice(0, 10) : '',
  source: c.platform?.platform_name || '',
  employeeId: '',
  referrerName: c.reference?.user_name || '',
  referrerDepartment: '',
  note: c.note || '',
  currentSalary: c.current_salary || '',
  expectedSalary: c.expected_salary || '',
  candidateResultFeedbackDate: c.feedback_date ? String(c.feedback_date).slice(0, 10) : '',
  headhuntAgency: c.agency || '',
  targetedCompany: !!c.targeted_company,
  targetedCompanyName: c.targeted_company?.company_name || '',
  file: c.file || null,
  _apiData: c,
});

export interface CandidateDatabasePageProps {
  candidates: any[];
  setCandidates: React.Dispatch<React.SetStateAction<any[]>>;
  jobs: any[];
}

export const CandidateDatabasePage = ({
  candidates,
  setCandidates,
  jobs,
}: CandidateDatabasePageProps) => {
  const { toasts, removeToast, toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const jobCodes = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.jobCode).filter(Boolean))),
    [jobs]
  );
  const recruiters = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.recruiter).filter(Boolean))),
    [candidates]
  );

  const loadCandidatesFromApi = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchCandidatesApi({ page: 1, limit: 100 });
      setCandidates((result.data || []).map(mapCandidateToRow));
    } catch (err: any) {
      toast.error('Failed to load candidates.');
    }
    setLoading(false);
  }, [setCandidates, toast]);

  useEffect(() => {
    loadCandidatesFromApi();
  }, []);

  const handleSaveCandidate = async (formData: any) => {
    setSaving(true);

    try {
      if (editingCandidate) {
        await updateCandidateApi(editingCandidate.id, formData);
        toast.success('Candidate updated successfully.');
        setShowForm(false);
        setEditingCandidate(null);
        await loadCandidatesFromApi();
      } else {
        await createCandidateApi(formData);
        toast.success('Candidate created successfully.');
        setShowForm(false);
        await loadCandidatesFromApi();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Save candidate failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCandidate = async (candidate: any) => {
    if (!confirm(`Delete candidate ${candidate.name}?`)) return;

    try {
      await deleteCandidateApi(candidate.id);
      toast.success('Candidate deleted.');
      await loadCandidatesFromApi();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete candidate failed.');
    }
  };

  const handleBulkUpload = (fileArray: any[]) => {
    alert(
      `${fileArray.length} CV file(s) uploaded successfully.\n\nNote: Files are stored in memory. Backend integration needed for permanent storage.`
    );
    setShowBulkUpload(false);
  };

  const handleImportCandidate = async (parsedCandidate: any) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmail =
      parsedCandidate.candidateEmail && emailRegex.test(parsedCandidate.candidateEmail)
        ? parsedCandidate.candidateEmail
        : '';

    const formData = {
      candidateCode: '',
      candidateName: parsedCandidate.candidateName,
      candidateEmail: validEmail,
      candidatePhone: parsedCandidate.candidatePhone,
      agency: parsedCandidate.agency,
      offerDate: parsedCandidate.offerDate,
      onboardDate: parsedCandidate.onboardDate,
      expectedOnboardDate: '',
      feedbackDate: parsedCandidate.feedbackDate,
      currentSalary: parsedCandidate.currentSalary,
      expectedSalary: parsedCandidate.expectedSalary,
      status: parsedCandidate.status,
      note: parsedCandidate.note,
      file: null,
      platformId: '',
      recruiterId: parsedCandidate.recruiter?.id || '',
      jobId: '',
      targetedCompanyId: '',
      referenceId: '',
      platformName: parsedCandidate.source || '',
      recruiterName: parsedCandidate.recruiter?.id === null ? parsedCandidate.recruiter.name : '',
      targetedCompanyName:
        parsedCandidate.targetedCompany === 'Yes' ? parsedCandidate.targetedCompanyName : '',
      referenceName: parsedCandidate.referenceName || '',
    };

    try {
      await createCandidateExtendedApi(formData);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Import failed' };
    }
  };

  const handleExcelImportClose = () => {
    setShowExcelImport(false);
    loadCandidatesFromApi();
  };

  const handleDownloadTemplate = async () => {
    toast.info('Downloading template...');
    try {
      await downloadValidationSheetApi();
      toast.success('Downloaded template.');
    } catch (err: any) {
      toast.error(err.message || 'Download failed.');
    }
  };

  const handleDownloadDatabase = async () => {
    toast.info('Downloading database sheet...');
    try {
      await downloadDatabaseSheetApi();
      toast.success('Downloaded database sheet.');
    } catch (err: any) {
      toast.error(err.message || 'Download failed.');
    }
  };

  const handleDownloadFullWorkbook = async () => {
    toast.info('Downloading full workbook...');
    try {
      await downloadFullWorkbookApi();
      toast.success('Downloaded full workbook.');
    } catch (err: any) {
      toast.error(err.message || 'Download failed.');
    }
  };

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return candidates;
    const query = searchQuery.toLowerCase().trim();
    return candidates.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(query) ||
        (c.email || '').toLowerCase().includes(query) ||
        (c.phone || '').toLowerCase().includes(query)
    );
  }, [candidates, searchQuery]);

  const columns = useMemo(
    () => [
      { key: 'candidateCode', label: 'Code', width: 140 },
      {
        key: 'file',
        label: 'CV File',
        width: 160,
        disableFilter: true,
        render: (candidate: any) => (
          <FileBadge file={candidate.file} onClick={() => setPreviewFile(candidate.file)} />
        ),
      },
      { key: 'inputDate', label: 'Input Date', width: 130, render: (_: any, value: any) => formatDate(value) },
      { key: 'name', label: 'Candidate Name', width: 190 },
      { key: 'email', label: 'Email', width: 220 },
      { key: 'phone', label: 'Phone Number', width: 150 },
      { key: 'recruiter', label: 'Recruiter', width: 150, filterOptions: recruiters },
      { key: 'jobCode', label: 'Job Code', width: 130, filterOptions: jobCodes },
      { key: 'project', label: 'Project', width: 170 },
      {
        key: 'status',
        label: 'Status',
        width: 150,
        filterOptions: masterData.status,
        render: (_: any, value: any) => <span className={statusClass(value)}>{value}</span>,
      },
      {
        key: 'onboardingDate',
        label: 'Onboarding Date',
        width: 150,
        render: (_: any, value: any) => formatDate(value),
      },
      {
        key: 'offerSentDate',
        label: 'Offer Sent Date',
        width: 150,
        render: (_: any, value: any) => formatDate(value),
      },
      { key: 'source', label: 'Source', width: 190 },
      { key: 'currentSalary', label: 'Current Salary', width: 150 },
      { key: 'expectedSalary', label: 'Expected Salary', width: 150 },
      { key: 'headhuntAgency', label: 'Agency', width: 170 },
      { key: 'targetedCompanyName', label: 'Targeted Company', width: 180 },
      { key: 'referrerName', label: 'Reference', width: 160 },
      { key: 'note', label: 'Note', width: 260 },
    ],
    [recruiters, jobCodes]
  );

  const tableActions = [
    {
      label: 'Edit',
      onClick: (candidate: any) => {
        setEditingCandidate(candidate);
        setShowForm(true);
      },
    },
    {
      label: 'Delete',
      onClick: (candidate: any) => handleDeleteCandidate(candidate),
    },
  ];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <DatabaseHeader
        total={filteredRows.length}
        onDownloadTemplate={handleDownloadTemplate}
        onDownloadDatabase={handleDownloadDatabase}
        onDownloadFullWorkbook={handleDownloadFullWorkbook}
        onBulkUpload={() => setShowBulkUpload(true)}
        onImportExcel={() => setShowExcelImport(true)}
        onAddCandidate={() => {
          setEditingCandidate(null);
          setShowForm(true);
        }}
      />

      <DatabaseFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-medium">Loading candidate data...</div>
        ) : (
          <ExcelTable
            title="Candidate Database Records"
            rows={filteredRows}
            columns={columns}
            actions={tableActions}
            defaultVisibleColumns={[
              'candidateCode',
              'file',
              'inputDate',
              'name',
              'email',
              'phone',
              'recruiter',
              'jobCode',
              'status',
              'onboardingDate',
              'offerSentDate',
              'source',
              'currentSalary',
              'expectedSalary',
              'note',
            ]}
          />
        )}
      </div>

      {showForm && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowForm(false);
            setEditingCandidate(null);
          }}
          title={editingCandidate ? '✏️ Edit Candidate' : '👤 Add Candidate'}
        >
          <CandidateForm
            candidate={
              editingCandidate?._apiData || (editingCandidate?.id ? editingCandidate : null)
            }
            saving={saving}
            onSubmit={handleSaveCandidate}
            onClose={() => {
              setShowForm(false);
              setEditingCandidate(null);
            }}
          />
        </Modal>
      )}

      {showBulkUpload && (
        <Modal isOpen={true} onClose={() => setShowBulkUpload(false)} title="📁 Bulk CV Upload">
          <BulkCVUpload onUpload={handleBulkUpload} onClose={() => setShowBulkUpload(false)} />
        </Modal>
      )}

      {/* File Preview Modal */}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      {/* Excel Import Modal */}
      {showExcelImport && (
        <Modal isOpen={true} onClose={handleExcelImportClose} title="📂 Import Candidates from Excel" maxWidthClass="max-w-4xl">
          <CandidateExcelImport onImport={handleImportCandidate} onClose={handleExcelImportClose} />
        </Modal>
      )}
    </div>
  );
};
export default CandidateDatabasePage;
