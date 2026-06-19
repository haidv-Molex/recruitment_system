import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import CandidateForm from '@/components/candidate/CandidateForm';
import CVUploadModal from '@/components/candidate/CVUploadModal';
import CVParseResultModal from '../components/candidate/CVParseResultModal';
import ParsedCVDisplay from '@/components/candidate/ParsedCVDisplay';
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
import { FileBadge, FilePreviewModal } from '@/components/common/FilePreview';
import CandidateExcelImport from '@/components/candidate/CandidateExcelImport';
import { useHeader } from '@/contexts/HeaderContext';
import DatabaseFilters from '@/components/candidate-database/DatabaseFilters';
import { useItem, setItem } from '@/config/zustandStore';
import { FileUp, Download, Plus, Upload, Edit2, Trash2, Eye, Mail, Phone, User } from 'lucide-react';
import { useConfirm } from '@/components/ui/ConfirmModal';
import Modal from '@/components/ui/Modal';

const statusClass = (status: string) =>
  `status-pill status-${String(status || '').toLowerCase().replace(/\s+/g, '-')}`;

type CandidateDetailTab = 'candidate-info' | 'recruitment-history' | 'interaction-history';

const candidateDetailTabs: { key: CandidateDetailTab; label: string }[] = [
  { key: 'candidate-info', label: 'Thông tin ứng viên' },
  { key: 'recruitment-history', label: 'Lịch sử tuyển' },
  { key: 'interaction-history', label: 'Lịch sử tương tác' },
];

const displayCandidateValue = (value: any): string => {
  if (Array.isArray(value)) {
    const text = value.filter(Boolean).join(', ');
    return text || 'None';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined || value === '') {
    return 'None';
  }

  return String(value);
};

const firstAvailable = (...values: any[]) => values.find((value) => {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== '';
});

const toRecord = (value: any): Record<string, any> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
};

const formatLinks = (links: any) => {
  const record = toRecord(links);
  const values = [
    record.github,
    record.linkedin,
    record.portfolio,
    ...(Array.isArray(record.other) ? record.other : []),
  ].filter(Boolean);

  return values;
};

const formatLanguageDetails = (languages: any) => {
  if (!Array.isArray(languages)) return [];

  return languages
    .map((language) => {
      if (typeof language === 'string') return language;
      const record = toRecord(language);
      return [record.language, record.proficiency].filter(Boolean).join(' - ');
    })
    .filter(Boolean);
};

const formatEducationDetails = (education: any) => {
  if (!Array.isArray(education)) return [];

  return education
    .map((item) => {
      const record = toRecord(item);
      const title = [record.institution, record.degree, record.field].filter(Boolean).join(' | ');
      const period = [record.start_date, record.end_date].filter(Boolean).join(' - ');
      return [title, period ? `(${period})` : ''].filter(Boolean).join(' ');
    })
    .filter(Boolean);
};

const formatWorkExperienceDetails = (experiences: any) => {
  if (!Array.isArray(experiences)) return [];

  return experiences
    .map((item) => {
      const record = toRecord(item);
      const title = [record.title, record.company].filter(Boolean).join(' @ ');
      const period = [record.start_date, record.is_current ? 'Hiện tại' : record.end_date].filter(Boolean).join(' - ');
      const responsibilities = Array.isArray(record.responsibilities)
        ? record.responsibilities.filter(Boolean).join(' ')
        : '';
      return [title, period ? `(${period})` : '', responsibilities].filter(Boolean).join(': ');
    })
    .filter(Boolean);
};

const formatFieldConfidences = (confidences: any) => {
  const record = toRecord(confidences);
  return Object.entries(record).map(([field, confidence]) => {
    const percent = typeof confidence === 'number' ? `${Math.round(confidence * 100)}%` : String(confidence);
    return `${field.replace(/_/g, ' ')}: ${percent}`;
  });
};

function CandidateInfoRow({ label, value }: { label: string; value: any }) {
  const displayValue = displayCandidateValue(value);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[240px_minmax(0,1fr)] gap-1 sm:gap-6 py-1.5 text-sm">
      <div className="font-semibold text-slate-800">{label}</div>
      <div className={displayValue === 'None' ? 'text-slate-400' : 'text-slate-700'}>{displayValue}</div>
    </div>
  );
}

function CandidateDetailModal({
  candidate,
  activeTab,
  onTabChange,
  onClose,
  onPreviewFile,
}: {
  candidate: any;
  activeTab: CandidateDetailTab;
  onTabChange: (tab: CandidateDetailTab) => void;
  onClose: () => void;
  onPreviewFile: (file: any) => void;
}) {
  const apiData = candidate?._apiData || candidate || {};
  const parsedCV = toRecord(firstAvailable(apiData.parsed_cv, apiData.parsedCV, apiData.cv_parse_result, apiData.cvParseResult, candidate?.parsed_cv, candidate?.parsedCV));
  const parsedField = (key: string, ...fallbackValues: any[]) => firstAvailable(parsedCV[key], apiData[key], candidate?.[key], ...fallbackValues);
  const candidateName = firstAvailable(apiData.candidate_name, candidate?.name, candidate?.fullName);
  const email = firstAvailable(apiData.candidate_email, candidate?.email);
  const phone = firstAvailable(apiData.candidate_phone, candidate?.phone);
  const parsedName = parsedField('name', candidateName);
  const parsedEmail = parsedField('email', email);
  const parsedPhone = parsedField('phone', phone);
  const parsedGender = parsedField('gender');
  const parsedSummary = parsedField('summary');
  const parsedLocation = parsedField('location');
  const parsedLinks = parsedField('links');
  const parsedSkills = parsedField('skills');
  const parsedLanguages = parsedField('languages');
  const parsedLanguageDetails = parsedField('language_details');
  const parsedExperienceYears = parsedField('experience_years');
  const parsedEducation = parsedField('education');
  const parsedEducationDetails = parsedField('education_details');
  const parsedCurrentPosition = parsedField('current_position', candidate?.jobTitle);
  const parsedWorkExperience = parsedField('work_experience');
  const parsedWorkExperienceDetails = parsedField('work_experience_details');
  const parsedReferences = parsedField('references');
  const parsedNationalId = parsedField('national_id');
  const parsedNationality = parsedField('nationality');
  const parsedDateOfBirth = parsedField('date_of_birth');
  const parsedQualityGrade = parsedField('quality_grade');
  const parsedCertifications = parsedField('certifications');
  const parsedDetectedLanguage = parsedField('detected_language');
  const parsedFieldConfidences = parsedField('field_confidences');
  const parsedExtractionWarnings = parsedField('extraction_warnings');
  const file = candidate?.file || apiData.file;
  const status = firstAvailable(apiData.status, candidate?.status);
  const source = firstAvailable(apiData.platform?.platform_name, candidate?.source);
  const jobCode = firstAvailable(apiData.job?.job_code, candidate?.jobCode);
  const recruiter = firstAvailable(apiData.recruiter?.user_name, candidate?.recruiter);
  const note = firstAvailable(apiData.note, candidate?.note);
  const feedbackDate = firstAvailable(apiData.feedback_date, candidate?.candidateResultFeedbackDate);
  const inputDate = firstAvailable(apiData.create_at, candidate?.inputDate);

  const candidateParsedCV = {
    name: displayCandidateValue(parsedName) === 'None' ? '' : String(parsedName),
    email: displayCandidateValue(parsedEmail) === 'None' ? '' : String(parsedEmail),
    phone: displayCandidateValue(parsedPhone) === 'None' ? '' : String(parsedPhone),
    gender: displayCandidateValue(parsedGender) === 'None' ? '' : String(parsedGender),
    summary: displayCandidateValue(parsedSummary) === 'None' ? '' : String(parsedSummary),
    location: displayCandidateValue(parsedLocation) === 'None' ? '' : String(parsedLocation),
    links: toRecord(parsedLinks),
    skills: Array.isArray(parsedSkills) ? parsedSkills : [],
    languages: Array.isArray(parsedLanguages) ? parsedLanguages : [],
    language_details: Array.isArray(parsedLanguageDetails) ? parsedLanguageDetails : [],
    experience_years: displayCandidateValue(parsedExperienceYears) === 'None' ? '' : String(parsedExperienceYears),
    education: displayCandidateValue(parsedEducation) === 'None' ? '' : String(parsedEducation),
    education_details: Array.isArray(parsedEducationDetails) ? parsedEducationDetails : [],
    current_position: displayCandidateValue(parsedCurrentPosition) === 'None' ? '' : String(parsedCurrentPosition),
    work_experience: displayCandidateValue(parsedWorkExperience) === 'None' ? '' : String(parsedWorkExperience),
    work_experience_details: Array.isArray(parsedWorkExperienceDetails) ? parsedWorkExperienceDetails : [],
    references: Array.isArray(parsedReferences) ? parsedReferences : [],
    national_id: displayCandidateValue(parsedNationalId) === 'None' ? '' : String(parsedNationalId),
    nationality: displayCandidateValue(parsedNationality) === 'None' ? '' : String(parsedNationality),
    date_of_birth: displayCandidateValue(parsedDateOfBirth) === 'None' ? '' : String(parsedDateOfBirth),
    quality_grade: displayCandidateValue(parsedQualityGrade) === 'None' ? '' : String(parsedQualityGrade),
    certifications: Array.isArray(parsedCertifications) ? parsedCertifications : [],
    detected_language: displayCandidateValue(parsedDetectedLanguage) === 'None' ? '' : String(parsedDetectedLanguage),
    field_confidences: toRecord(parsedFieldConfidences),
    extraction_warnings: Array.isArray(parsedExtractionWarnings) ? parsedExtractionWarnings : [],
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Candidate Profile"
      maxWidthClass="max-w-5xl"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-6 rounded-xl bg-white">
          <div className="flex md:block items-center gap-4 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-5">
            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <User className="h-12 w-12 text-slate-300" />
            </div>
            <div className="md:mt-4 space-y-3">
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                Hồ sơ {displayCandidateValue(source)}
              </span>
              <div className="text-xs text-slate-500">
                <div className="font-semibold text-slate-700">Cập nhật:</div>
                <div>{formatDate(inputDate)}</div>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{displayCandidateValue(parsedName)}</h2>
              <div className="mt-1 text-sm text-slate-500">{displayCandidateValue(parsedCurrentPosition)}</div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5"><Mail size={14} />{displayCandidateValue(parsedEmail)}</span>
              <span className="inline-flex items-center gap-1.5"><Phone size={14} />{displayCandidateValue(parsedPhone)}</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className={statusClass(status)}>{displayCandidateValue(status)}</span>
              {file && (
                <button
                  type="button"
                  onClick={() => onPreviewFile(file)}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Xem CV
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-wrap gap-1 border-b border-slate-100 px-4 pt-4">
            {candidateDetailTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'candidate-info' && (
              <ParsedCVDisplay parsedData={candidateParsedCV} showExtractionMetadata={false} />
            )}

            {activeTab === 'recruitment-history' && (
              <div className="space-y-1">
                <h3 className="mb-4 border-b border-slate-200 pb-2 text-base font-bold text-slate-900">Lịch sử tuyển</h3>
                <CandidateInfoRow label="Job Code" value={jobCode} />
                <CandidateInfoRow label="Project" value={candidate?.project} />
                <CandidateInfoRow label="Trạng thái" value={status} />
                <CandidateInfoRow label="Recruiter" value={recruiter} />
                <CandidateInfoRow label="Nguồn ứng viên" value={source} />
                <CandidateInfoRow label="Offer Sent Date" value={candidate?.offerSentDate ? formatDate(candidate.offerSentDate) : candidate?.offerSentDate} />
                <CandidateInfoRow label="Onboarding Date" value={candidate?.onboardingDate ? formatDate(candidate.onboardingDate) : candidate?.onboardingDate} />
              </div>
            )}

            {activeTab === 'interaction-history' && (
              <div className="space-y-1">
                <h3 className="mb-4 border-b border-slate-200 pb-2 text-base font-bold text-slate-900">Lịch sử tương tác</h3>
                <CandidateInfoRow label="Feedback Date" value={feedbackDate ? formatDate(feedbackDate) : feedbackDate} />
                <CandidateInfoRow label="Ghi chú" value={note} />
                <CandidateInfoRow label="Reference" value={candidate?.referrerName} />
                <CandidateInfoRow label="Agency" value={candidate?.headhuntAgency} />
                <CandidateInfoRow label="Targeted Company" value={candidate?.targetedCompanyName} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

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
  const confirm = useConfirm();
  const { toasts, removeToast, toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any | null>(null);
  const [showCVUploadModal, setShowCVUploadModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [selectedCandidateForView, setSelectedCandidateForView] = useState<any | null>(null);
  const [candidateDetailTab, setCandidateDetailTab] = useState<CandidateDetailTab>('candidate-info');

  const [parsedCVInfo, setParsedCVInfo] = useState<{ data: any; file: File } | null>(null);

  const savedColumns = useItem('visibleCandidateColumns');
  const defaultVisible = savedColumns || [
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
    if (colFilters.recruiter) params.recruiter = colFilters.recruiter;
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const formatApiDate = (val: any) => {
      if (!val) return '';
      try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().slice(0, 10);
      } catch {
        return '';
      }
    };

    const candidatesPayload = parsedCandidates.map((c) => {
      const validEmail = c.candidate_email && emailRegex.test(c.candidate_email) ? c.candidate_email : '';
      const recruiterId = c.recruiter?.user_id || null;
      const recruiterName = c.recruiter?.user_id === null ? (c.recruiter?.user_name || '') : '';
      const targetedCompanyName = c.targeted_company === 'Yes' ? (c.targeted_company_name || '') : '';

      return {
        candidate_name: c.candidate_name || '',
        status: c.status || '',
        candidate_code: c.employee_code || '',
        candidate_email: validEmail,
        candidate_phone: c.candidate_phone || '',
        agency: c.agency || '',
        offer_date: formatApiDate(c.offer_date),
        onboard_date: formatApiDate(c.onboard_date),
        expected_onboard_date: '',
        feedback_date: formatApiDate(c.feedback_date),
        current_salary: c.current_salary || '',
        expected_salary: c.expected_salary || '',
        note: c.note || '',
        recruiter: recruiterId,
        recruiter_name: recruiterName,
        targeted_company_name: targetedCompanyName,
        reference_name: c.reference_name || '',
        job_code: c.job_code || '',
        project: c.project || '',
      };
    });

    try {
      const result = await batchImportCandidatesApi(candidatesPayload);
      if (result.success) {
        toast.success(`Imported ${result.importedCount} candidates successfully!`);
      } else {
        toast.warning(`Imported ${result.importedCount} candidates, but encountered ${result.errors.length} error(s).`);
      }
      return result;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Batch import failed';
      toast.error('Batch import failed: ' + errMsg);
      return {
        success: false,
        importedCount: 0,
        errors: parsedCandidates.map(c => ({ candidate_name: c.candidate_name, message: errMsg }))
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
      { key: 'recruiter', label: 'Recruiter', width: 150 },
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
      label: 'View',
      icon: <Eye size={14} className="text-emerald-600" />,
      onClick: (candidate: any) => {
        setSelectedCandidateForView(candidate);
        setCandidateDetailTab('candidate-info');
      },
    },
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

      {/* Candidate Detail View Modal */}
      {selectedCandidateForView && (
        <CandidateDetailModal
          candidate={selectedCandidateForView}
          activeTab={candidateDetailTab}
          onTabChange={setCandidateDetailTab}
          onClose={() => setSelectedCandidateForView(null)}
          onPreviewFile={(file) => setPreviewFile(file)}
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
