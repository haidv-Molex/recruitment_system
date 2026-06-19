import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import CandidateForm from '@/components/candidate/CandidateForm';
import CVUploadModal from '@/components/candidate/CVUploadModal';
import CVParseResultModal from '@/components/candidate/CVParseResultModal';
import ExcelTable, { formatDate } from '@/components/ui/ExcelTable';
import Pagination from '@/components/ui/Pagination';
import { masterData } from '@/services/mockData';
import ToastContainer from '@/components/common/Toast';
import { useToast } from '@/hooks/useToast';
import {
  createCandidateApi,
  searchCandidatesApi,
  deleteCandidateApi,
  updateCandidateApi,
  downloadDatabaseSheetApi,
  batchImportCandidatesApi,
  parseCVApi,
} from '@/services/candidateApi';
import { mapParsedCandidatesToBatchPayload } from '@/services/candidateImportMapper';
import { FileBadge, FilePreviewModal } from '@/components/common/FilePreview';
import CandidateExcelImport from '@/components/candidate/CandidateExcelImport';
import { useHeader } from '@/contexts/HeaderContext';
import DatabaseFilters from '@/components/candidate-database/DatabaseFilters';
import { useItem, setItem } from '@/config/zustandStore';
import { FileUp, Download, Plus, Upload, Edit2, Trash2 } from 'lucide-react';
import { useConfirm } from '@/components/ui/ConfirmModal';
import Modal from '@/components/ui/Modal';

const statusClass = (status: string) =>
  `status-pill status-${String(status || '').toLowerCase().replace(/\s+/g, '-')}`;

const mapCandidateToRow = (c: any) => ({
  id: c.candidate_id,
  candidateCode: c.candidate_code || '',
  inputDate: c.create_at ? String(c.create_at).slice(0, 10) : '',
  name: c.candidate_name,
  email: c.candidate_email || '',
  phone: c.candidate_phone || '',
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
  source: c.platform?.platform_code || c.platform?.platform_name || '',
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
  const confirm = useConfirm();
  const { toasts, removeToast, toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any | null>(null);
  const [showCVUploadModal, setShowCVUploadModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [showExcelImport, setShowExcelImport] = useState(false);

  const [parsedCVInfo, setParsedCVInfo] = useState<{ data: any; file: File } | null>(null);

  const savedColumns = useItem('visibleCandidateColumns');
  const defaultVisible = savedColumns || [
    'candidateCode',
    'file',
    'inputDate',
    'name',
    'email',
    'phone',
    'jobCode',
    'status',
    'onboardingDate',
    'offerSentDate',
    'source',
    'currentSalary',
    'expectedSalary',
    'note',
  ];
  const handleVisibleColumnsChange = (cols: string[]) => {
    setItem('visibleCandidateColumns', cols);
  };


  // Pagination & Filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [activeSearchParams, setActiveSearchParams] = useState<Record<string, any>>({});
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const loadCandidatesFromApi = useCallback(async (
    page: number = 1,
    limit: number = pageSize,
    extraParams: Record<string, any> = {}
  ) => {
    setLoading(true);
    try {
      const result = await searchCandidatesApi({ page, limit, ...extraParams });
      setCandidates((result.data || []).map(mapCandidateToRow));
      setTotalItems(result.pagination?.total_items ?? result.data?.length ?? 0);
      setCurrentPage(page);
    } catch (err: any) {
      toast.error('Failed to load candidates.');
    }
    setLoading(false);
  }, [setCandidates, toast, pageSize]);

  useEffect(() => {
    loadCandidatesFromApi(1, pageSize, activeSearchParams);
  }, [pageSize]);

  const handlePageChange = (page: number) => {
    loadCandidatesFromApi(page, pageSize, activeSearchParams);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    loadCandidatesFromApi(1, newSize, activeSearchParams);
  };

  const handleTableSearch = useCallback((colFilters: Record<string, string>, globalSearch: string) => {
    const params: Record<string, any> = {};

    if (globalSearch.trim()) {
      params.search = globalSearch.trim();
    }

    if (colFilters.status) {
      params.status = colFilters.status;
    }

    // Map other filters to exact candidate query parameters
    if (colFilters.candidateCode) params.candidateCode = colFilters.candidateCode;
    if (colFilters.name) params.candidateName = colFilters.name;
    if (colFilters.email) params.candidateEmail = colFilters.email;
    if (colFilters.phone) params.candidatePhone = colFilters.phone;
    if (colFilters.jobCode) params.jobCode = colFilters.jobCode;
    if (colFilters.project) params.project = colFilters.project;
    if (colFilters.source) params.platform = colFilters.source;
    if (colFilters.headhuntAgency) params.agency = colFilters.headhuntAgency;
    if (colFilters.targetedCompanyName) params.company = colFilters.targetedCompanyName;
    if (colFilters.referrerName) params.reference = colFilters.referrerName;
    if (colFilters.note) params.note = colFilters.note;

    setActiveSearchParams(params);
    loadCandidatesFromApi(1, pageSize, params);
  }, [loadCandidatesFromApi, pageSize]);

  const handleSaveCandidate = async (formData: any) => {
    setSaving(true);

    try {
      if (editingCandidate) {
        await updateCandidateApi(editingCandidate.id, formData);
        toast.success('Candidate updated successfully.');
        setShowForm(false);
        setEditingCandidate(null);
        await loadCandidatesFromApi(currentPage, pageSize, activeSearchParams);
      } else {
        await createCandidateApi(formData);
        toast.success('Candidate created successfully.');
        setShowForm(false);
        await loadCandidatesFromApi(1, pageSize, activeSearchParams);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Save candidate failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCandidates = async (selectedCandidates: any[]) => {
    if (selectedCandidates.length === 0) return;
    const msg = selectedCandidates.length === 1
      ? `Bạn có chắc chắn muốn xóa 1 ứng viên không? Hành động này không thể hoàn tác.`
      : `Bạn có chắc chắn muốn xóa ${selectedCandidates.length} ứng viên đã chọn không? Hành động này không thể hoàn tác.`;

    const isConfirmed = await confirm(msg);
    if (!isConfirmed) return;

    try {
      const ids = selectedCandidates.map(c => c.id);
      await deleteCandidateApi(ids);
      toast.success(selectedCandidates.length === 1 ? 'Candidate deleted.' : 'Candidates deleted.');
      await loadCandidatesFromApi(currentPage, pageSize, activeSearchParams);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete candidate failed.');
    }
  };


  const handleExcelImportClose = () => {
    setShowExcelImport(false);
    loadCandidatesFromApi(currentPage, pageSize, activeSearchParams);
  };

  const handleImportCandidatesBatch = async (
    parsedCandidates: any[]
  ): Promise<{ success: boolean; importedCount: number; errors: any[] }> => {
    const { candidatesPayload, errors: validationErrors } = mapParsedCandidatesToBatchPayload(parsedCandidates);
    if (candidatesPayload.length === 0) {
      toast.error('No candidates imported. Please fix invalid email values in the sheet.');
      return {
        success: false,
        importedCount: 0,
        errors: validationErrors,
      };
    }

    try {
      const result = await batchImportCandidatesApi(candidatesPayload);
      const combinedErrors = [...validationErrors, ...(result.errors || [])];

      if (combinedErrors.length === 0) {
        toast.success(`Imported ${result.importedCount} candidates successfully!`);
      } else {
        toast.warning(`Imported ${result.importedCount} candidates, but encountered ${combinedErrors.length} error(s).`);
      }
      return {
        ...result,
        success: result.success && combinedErrors.length === 0,
        errors: combinedErrors,
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Batch import failed';
      toast.error('Batch import failed: ' + errMsg);
      return {
        success: false,
        importedCount: 0,
        errors: [
          ...validationErrors,
          ...candidatesPayload.map(c => ({ candidate_name: c.candidate_name, message: errMsg }))
        ]
      };
    }
  };


  const handleDownloadDatabase = useCallback(async () => {
    toast.info('Downloading database sheet...');
    try {
      await downloadDatabaseSheetApi();
      toast.success('Downloaded database sheet.');
    } catch (err: any) {
      toast.error(err.message || 'Download failed.');
    }
  }, [toast]);



  const columns = useMemo(
    () => [
      { key: 'candidateCode', label: 'Code', width: 140 },
      { key: 'inputDate', label: 'Input Date', width: 130, render: (_: any, value: any) => formatDate(value) },
      { key: 'name', label: 'Candidate Name', width: 190 },
      { key: 'email', label: 'Email', width: 220 },
      { key: 'phone', label: 'Phone Number', width: 150 },
      { key: 'jobCode', label: 'Job Code', width: 130 },
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
      {
        key: 'file',
        label: 'CV File',
        width: 160,
        disableFilter: true,
        render: (candidate: any) => (
          <FileBadge file={candidate.file} onClick={() => setPreviewFile(candidate.file)} />
        ),
      },
      { key: 'note', label: 'Note', width: 260 },
    ],
    []
  );

  const tableActions = [
    {
      label: 'Edit',
      icon: <Edit2 size={14} />,
      onClick: (candidate: any) => {
        setEditingCandidate(candidate);
        setShowForm(true);
      },
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} className="text-red-500" />,
      onClick: (candidate: any) => handleDeleteCandidates([candidate]),
      onBulkClick: (selectedRows: any[]) => handleDeleteCandidates(selectedRows),
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
        onClick={() => setShowCVUploadModal(true)}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 active:bg-slate-100 transition-all cursor-pointer"
      >
        <Upload size={14} />
        <span>Parse CV</span>
      </button>
      <button
        type="button"
        onClick={handleDownloadDatabase}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 active:bg-slate-100 transition-all cursor-pointer"
      >
        <Download size={14} />
        <span>Export DB</span>
      </button>
      <button
        type="button"
        onClick={() => {
          setEditingCandidate(null);
          setShowForm(true);
        }}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white active:bg-emerald-800 transition-all cursor-pointer"
      >
        <Plus size={14} />
        <span>Add Candidate</span>
      </button>
    </div>
  ), [handleDownloadDatabase]);

  useHeader({
    title: '📂 Candidate Database',
    subTitle: `Comprehensive resume repository. Total: ${totalItems} candidates`,
    actions: headerActions,
  }, [totalItems, headerActions]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />



      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-4">
        <ExcelTable
          title="Candidate Database Records"
          rows={candidates}
          columns={columns}
          actions={tableActions}
          defaultVisibleColumns={defaultVisible}
          onChangeVisibleColumns={handleVisibleColumnsChange}
          onSearch={handleTableSearch}
          isLoading={loading}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          itemLabel="candidates"
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {showForm && (
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
      )}

      {showCVUploadModal && (
        <CVUploadModal
          onParsed={(data, file) => {
            setShowCVUploadModal(false);
            setParsedCVInfo({ data, file });
          }}
          onClose={() => setShowCVUploadModal(false)}
        />
      )}

      {/* File Preview Modal */}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      {/* Excel Import Modal */}
      {showExcelImport && (
        <CandidateExcelImport
          onImportBatch={handleImportCandidatesBatch}
          onClose={handleExcelImportClose}
        />
      )}

      {/* Parse CV Result Modal */}
      {parsedCVInfo && (
        <CVParseResultModal
          parsedData={parsedCVInfo.data}
          file={parsedCVInfo.file}
          onClose={() => setParsedCVInfo(null)}
        />
      )}
    </div>
  );
};
export default CandidateDatabasePage;
