import React, { useEffect, useState } from 'react';
import { searchJobsApi } from '@/services/jobApi';
import { searchPlatformsApi } from '@/services/platformApi';
import { searchCompaniesApi } from '@/services/companyApi';
import { fetchUsersApi } from '@/services/userApi';
import { searchLevelsApi } from '@/services/levelApi';
import { FilePreviewModal } from '@/components/common/FilePreview';
import { fetchAgenciesApi, fetchStatusesApi } from '@/services/candidateApi';
import Modal from '@/components/ui/Modal';
import InputField from '@/components/common/InputField';
import SelectField from '@/components/common/SelectField';
import Button from '@/components/common/Button';
import SingleSearchSelect from '@/components/ui/SingleSearchSelect';
import OutlookSearchSelect from '@/components/ui/OutlookSearchSelect';
import FileUploadField from '@/components/common/FileUploadField';
import { Plus, Trash2 } from 'lucide-react';

type LinkFormData = {
  github: string;
  linkedin: string;
  portfolio: string;
  other: string[];
};

type LanguageDetailFormData = {
  language: string;
  proficiency: string;
};

type EducationDetailFormData = {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
};

type WorkExperienceDetailFormData = {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  responsibilities: string[];
};

const emptyLinks = (): LinkFormData => ({
  github: '',
  linkedin: '',
  portfolio: '',
  other: [],
});

const emptyLanguageDetail = (): LanguageDetailFormData => ({
  language: '',
  proficiency: '',
});

const emptyEducationDetail = (): EducationDetailFormData => ({
  institution: '',
  degree: '',
  field: '',
  start_date: '',
  end_date: '',
});

const emptyWorkExperienceDetail = (): WorkExperienceDetailFormData => ({
  title: '',
  company: '',
  start_date: '',
  end_date: '',
  is_current: false,
  responsibilities: [],
});

const dateInputValue = (value: any) => (value ? String(value).slice(0, 10) : '');

const parseJsonValue = (value: any) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const toStringList = (value: any): string[] => {
  const parsed = parseJsonValue(value);
  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => String(item ?? '').trim())
      .filter(Boolean);
  }
  if (typeof parsed === 'string') {
    return parsed
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const toLineList = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const toObjectList = <T extends Record<string, any>>(value: any): T[] => {
  const parsed = parseJsonValue(value);
  return Array.isArray(parsed)
    ? parsed.filter((item) => item && typeof item === 'object')
    : [];
};

const normalizeLinks = (value: any): LinkFormData => {
  const parsed = parseJsonValue(value) || {};
  return {
    github: parsed.github || '',
    linkedin: parsed.linkedin || '',
    portfolio: parsed.portfolio || '',
    other: toStringList(parsed.other),
  };
};

const hasAnyValue = (values: Array<string | boolean | string[]>) =>
  values.some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    return Boolean(value.trim());
  });

const createEmptyCandidate = () => ({
  candidateCode: '',
  candidateName: '',
  candidateEmail: '',
  candidatePhone: '',
  agency: '',
  offerDate: '',
  onboardDate: '',
  expectedOnboardDate: '',
  feedbackDate: '',
  currentSalary: '',
  expectedSalary: '',
  status: 'CV Sent',
  note: '',
  platformId: '',
  jobId: '',
  targetedCompanyId: '',
  referenceId: '',
  candidateLevels: [] as number[],
  file: null as File | null,
  summary: '',
  dateOfBirth: '',
  gender: '',
  maritalStatus: '',
  nationality: '',
  location: '',
  links: emptyLinks(),
  skills: [] as string[],
  languages: [] as string[],
  languageDetails: [] as LanguageDetailFormData[],
  education: '',
  educationDetails: [] as EducationDetailFormData[],
  experienceYears: '',
  currentPosition: '',
  currentLevel: '',
  lastCompany: '',
  workExperience: '',
  workExperienceDetails: [] as WorkExperienceDetailFormData[],
  certifications: [] as string[],
  expectedPosition: '',
  expectedLevel: '',
  expectedWorkLocation: '',
  salaryCurrency: 'VND',
});

const emptyCandidate = createEmptyCandidate();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?\d+(?:\.\d+)*$/;

const getPlatformLabel = (platform: any) => platform?.platform_code || platform?.platform_name || '';

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

function TextareaField({ label, id, className = '', disabled, ...props }: TextareaFieldProps) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-700">
        {label}
      </label>
      <textarea
        id={id}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all disabled:bg-slate-50 disabled:text-slate-400 text-slate-900 ${className}`}
        {...props}
      />
    </div>
  );
}

export interface CandidateFormProps {
  candidate?: any;
  onSubmit: (data: typeof emptyCandidate) => void;
  onClose: () => void;
  saving: boolean;
}

export default function CandidateForm({ candidate, onSubmit, onClose, saving }: CandidateFormProps) {
  const [formData, setFormData] = useState(createEmptyCandidate());
  const [error, setError] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [selectedReference, setSelectedReference] = useState<any | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<any | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<any | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<any[]>([]);
  const [showDetailSection, setShowDetailSection] = useState(false);

  const [options, setOptions] = useState({
    jobs: [] as any[],
    platforms: [] as any[],
    companies: [] as any[],
    users: [] as any[],
    agencies: [] as string[],
    statuses: [] as string[],
  });

  useEffect(() => {
    if (candidate) {
      const detail = candidate.candidate_detail || {};
      const candidateLevels = Array.isArray(candidate.candidate_levels)
        ? candidate.candidate_levels
        : Array.isArray(candidate.candidateLevels)
          ? candidate.candidateLevels
          : [];
      const normalizedLevels = candidateLevels
        .map((level: any) => (typeof level === 'object' ? level : { level_id: level, level_name: String(level) }))
        .filter((level: any) => level.level_id !== undefined && level.level_id !== null);
      setFormData({
        candidateCode: candidate.candidate_code || '',
        candidateName: candidate.candidate_name || '',
        candidateEmail: candidate.candidate_email || '',
        candidatePhone: candidate.candidate_phone || '',
        agency: candidate.agency || '',
        offerDate: dateInputValue(detail.offer_date || candidate.offer_date),
        onboardDate: dateInputValue(detail.onboard_date || candidate.onboard_date),
        expectedOnboardDate: dateInputValue(detail.expected_onboard_date || candidate.expected_onboard_date),
        feedbackDate: dateInputValue(detail.feedback_date || candidate.feedback_date),
        currentSalary: detail.current_salary || '',
        expectedSalary: detail.expected_salary || '',
        status: candidate.status || 'CV Sent',
        note: candidate.note || '',
        platformId: candidate.platform?.platform_id || candidate.platform_id || '',
        jobId: candidate.job?.job_id || candidate.job_id || '',
        targetedCompanyId: candidate.targeted_company?.company_id || candidate.targeted_company || '',
        referenceId: candidate.reference?.user_id || candidate.reference || '',
        candidateLevels: normalizedLevels.map((level: any) => Number(level.level_id)).filter(Number.isFinite),
        file: null,
        summary: detail.summary || '',
        dateOfBirth: dateInputValue(detail.date_of_birth),
        gender: detail.gender || '',
        maritalStatus: detail.marital_status || '',
        nationality: detail.nationality || '',
        location: detail.location || '',
        links: normalizeLinks(detail.links),
        skills: toStringList(detail.skills),
        languages: toStringList(detail.languages),
        languageDetails: toObjectList<any>(detail.language_details).map((item) => ({
          language: item.language || '',
          proficiency: item.proficiency || '',
        })),
        education: detail.education || '',
        educationDetails: toObjectList<any>(detail.education_details).map((item) => ({
          institution: item.institution || '',
          degree: item.degree || '',
          field: item.field || '',
          start_date: item.start_date || '',
          end_date: item.end_date || '',
        })),
        experienceYears: detail.experience_years || '',
        currentPosition: detail.current_position || '',
        currentLevel: detail.current_level || '',
        lastCompany: detail.last_company || '',
        workExperience: detail.work_experience || '',
        workExperienceDetails: toObjectList<any>(detail.work_experience_details).map((item) => ({
          title: item.title || '',
          company: item.company || '',
          start_date: item.start_date || '',
          end_date: item.end_date || '',
          is_current: Boolean(item.is_current),
          responsibilities: toStringList(item.responsibilities),
        })),
        certifications: toStringList(detail.certifications),
        expectedPosition: detail.expected_position || '',
        expectedLevel: detail.expected_level || '',
        expectedWorkLocation: detail.expected_work_location || '',
        salaryCurrency: detail.salary_currency || 'VND',
      });
      setSelectedJob(candidate.job || null);
      setSelectedReference(candidate.reference || null);
      setSelectedPlatform(candidate.platform || null);
      setSelectedCompany(candidate.targeted_company || null);
      setSelectedAgency(candidate.agency ? { name: candidate.agency } : null);
      setSelectedLevels(normalizedLevels);
      setShowDetailSection(false);
    } else {
      setFormData(createEmptyCandidate());
      setSelectedJob(null);
      setSelectedReference(null);
      setSelectedPlatform(null);
      setSelectedCompany(null);
      setSelectedAgency(null);
      setSelectedLevels([]);
      setShowDetailSection(false);
    }
  }, [candidate]);

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (formData.jobId && options.jobs.length > 0 && !selectedJob) {
      const found = options.jobs.find((j) => String(j.job_id) === String(formData.jobId));
      if (found) {
        setSelectedJob(found);
      }
    }
  }, [formData.jobId, options.jobs, selectedJob]);

  useEffect(() => {
    if (formData.referenceId && options.users.length > 0 && !selectedReference) {
      const found = options.users.find((u) => String(u.user_id) === String(formData.referenceId));
      if (found) setSelectedReference(found);
    }
  }, [formData.referenceId, options.users, selectedReference]);

  useEffect(() => {
    if (formData.platformId && options.platforms.length > 0 && !selectedPlatform) {
      const found = options.platforms.find((p) => String(p.platform_id) === String(formData.platformId));
      if (found) setSelectedPlatform(found);
    }
  }, [formData.platformId, options.platforms, selectedPlatform]);

  useEffect(() => {
    if (formData.targetedCompanyId && options.companies.length > 0 && !selectedCompany) {
      const found = options.companies.find((c) => String(c.company_id) === String(formData.targetedCompanyId));
      if (found) setSelectedCompany(found);
    }
  }, [formData.targetedCompanyId, options.companies, selectedCompany]);

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const [jobsRes, platformsRes, companiesRes, usersRes, agenciesRes, statusesRes] = await Promise.all([
        searchJobsApi({ page: 1, limit: 100 }),
        searchPlatformsApi({ page: 1, limit: 100 }),
        searchCompaniesApi({ page: 1, limit: 100 }),
        fetchUsersApi({ page: 1, limit: 100 }),
        fetchAgenciesApi(),
        fetchStatusesApi(),
      ]);

      setOptions({
        jobs: jobsRes.data || [],
        platforms: platformsRes.data || [],
        companies: companiesRes.data || [],
        users: usersRes.data || [],
        agencies: agenciesRes || [],
        statuses: statusesRes || [],
      });
    } catch (err) {
      console.error('Failed to load form options', err);
    }
    setLoadingOptions(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneValue = e.target.value.replace(/[^\d+.]/g, '').replace(/(?!^)\+/g, '');
    setFormData((prev) => ({ ...prev, candidatePhone: phoneValue }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleListChange = (
    name: 'skills' | 'languages' | 'certifications',
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [name]: toLineList(value) }));
  };

  const handleLinkChange = (name: 'github' | 'linkedin' | 'portfolio', value: string) => {
    setFormData((prev) => ({
      ...prev,
      links: {
        ...prev.links,
        [name]: value,
      },
    }));
  };

  const handleOtherLinksChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      links: {
        ...prev.links,
        other: toLineList(value),
      },
    }));
  };

  const addLanguageDetail = () => {
    setFormData((prev) => ({
      ...prev,
      languageDetails: [...prev.languageDetails, emptyLanguageDetail()],
    }));
  };

  const updateLanguageDetail = (index: number, field: keyof LanguageDetailFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      languageDetails: prev.languageDetails.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeLanguageDetail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      languageDetails: prev.languageDetails.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addEducationDetail = () => {
    setFormData((prev) => ({
      ...prev,
      educationDetails: [...prev.educationDetails, emptyEducationDetail()],
    }));
  };

  const updateEducationDetail = (index: number, field: keyof EducationDetailFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      educationDetails: prev.educationDetails.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeEducationDetail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      educationDetails: prev.educationDetails.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addWorkExperienceDetail = () => {
    setFormData((prev) => ({
      ...prev,
      workExperienceDetails: [...prev.workExperienceDetails, emptyWorkExperienceDetail()],
    }));
  };

  const updateWorkExperienceDetail = (
    index: number,
    field: keyof Omit<WorkExperienceDetailFormData, 'responsibilities' | 'is_current'>,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      workExperienceDetails: prev.workExperienceDetails.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const updateWorkExperienceCurrent = (index: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      workExperienceDetails: prev.workExperienceDetails.map((item, itemIndex) =>
        itemIndex === index ? { ...item, is_current: checked } : item
      ),
    }));
  };

  const updateWorkExperienceResponsibilities = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      workExperienceDetails: prev.workExperienceDetails.map((item, itemIndex) =>
        itemIndex === index ? { ...item, responsibilities: toLineList(value) } : item
      ),
    }));
  };

  const removeWorkExperienceDetail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      workExperienceDetails: prev.workExperienceDetails.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const getSubmitData = () => ({
    ...formData,
    candidateLevels: formData.candidateLevels.map(Number).filter(Number.isFinite),
    links: {
      github: formData.links.github.trim(),
      linkedin: formData.links.linkedin.trim(),
      portfolio: formData.links.portfolio.trim(),
      other: formData.links.other.map((item) => item.trim()).filter(Boolean),
    },
    skills: formData.skills.map((item) => item.trim()).filter(Boolean),
    languages: formData.languages.map((item) => item.trim()).filter(Boolean),
    languageDetails: formData.languageDetails
      .map((item) => ({
        language: item.language.trim(),
        proficiency: item.proficiency.trim(),
      }))
      .filter((item) => hasAnyValue([item.language, item.proficiency])),
    educationDetails: formData.educationDetails
      .map((item) => ({
        institution: item.institution.trim(),
        degree: item.degree.trim(),
        field: item.field.trim(),
        start_date: item.start_date.trim(),
        end_date: item.end_date.trim(),
      }))
      .filter((item) => hasAnyValue([item.institution, item.degree, item.field, item.start_date, item.end_date])),
    workExperienceDetails: formData.workExperienceDetails
      .map((item) => ({
        title: item.title.trim(),
        company: item.company.trim(),
        start_date: item.start_date.trim(),
        end_date: item.end_date.trim(),
        is_current: item.is_current,
        responsibilities: item.responsibilities.map((responsibility) => responsibility.trim()).filter(Boolean),
      }))
      .filter((item) => hasAnyValue([
        item.title,
        item.company,
        item.start_date,
        item.end_date,
        item.is_current,
        item.responsibilities,
      ])),
    certifications: formData.certifications.map((item) => item.trim()).filter(Boolean),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.candidateName.trim()) {
      setError('Candidate Name is required.');
      return;
    }
    if (formData.candidateEmail && !emailRegex.test(formData.candidateEmail)) {
      setError('Email format is invalid.');
      return;
    }
    if (formData.candidatePhone && !phoneRegex.test(formData.candidatePhone)) {
      setError('Phone number must contain digits, optional dot separators, and may start with +.');
      return;
    }

    onSubmit(getSubmitData());
  };

  const statusOptions = [
    { value: '', label: 'Select Status' },
    ...options.statuses.map((s) => ({ value: s, label: s })),
  ];

  const platformOptions = [
    { value: '', label: 'Select Platform' },
    ...options.platforms.map((p) => ({ value: p.platform_id, label: getPlatformLabel(p) })),
  ];

  const companyOptions = [
    { value: '', label: 'Select Company' },
    ...options.companies.map((c) => ({ value: c.company_id, label: c.company_name })),
  ];

  const referenceOptions = [
    { value: '', label: 'None' },
    ...options.users.map((u) => ({ value: u.user_id, label: u.user_name })),
  ];

  const agencyOptions = [
    { value: '', label: 'Select Agency' },
    ...options.agencies.map((a) => ({ value: a, label: a })),
  ];

  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  const maritalStatusOptions = [
    { value: '', label: 'Select Marital Status' },
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
  ];

  const getLevelLabel = (level: any) =>
    [level?.level_code, level?.level_name].filter(Boolean).join(' - ') || '';

  const fileToDisplay = formData.file || candidate?.file;

  const modalTitle = (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="font-semibold text-slate-800">
        {candidate ? 'Edit Candidate' : 'Add Candidate'}
      </span>
      {fileToDisplay && (
        <span
          onClick={() => {
            if (fileToDisplay instanceof File) {
              const fileUrl = URL.createObjectURL(fileToDisplay);
              setPreviewFile({
                file_name: fileToDisplay.name,
                file_path: fileUrl,
                file_url: fileUrl,
              });
            } else {
              setPreviewFile(fileToDisplay);
            }
          }}
          className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200 cursor-pointer transition-colors max-w-[240px] truncate"
          title="Click to preview CV File"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          CV: {fileToDisplay instanceof File ? fileToDisplay.name : (fileToDisplay.file_name || fileToDisplay.file_path?.split('/').pop() || 'File')}
        </span>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={modalTitle}
      maxWidthClass="max-w-6xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={saving}>
            {saving ? 'Saving...' : candidate ? 'Save Candidate' : 'Create Candidate'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 text-xs px-3.5 py-2 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {loadingOptions && (
          <p className="text-xs text-slate-400">Loading form options from server...</p>
        )}

        {/* Section 1: Required & Key Information */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required & Key Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="Candidate Name *"
              name="candidateName"
              value={formData.candidateName}
              onChange={handleChange}
              placeholder="e.g. Nguyễn Văn A"
              disabled={saving}
            />
            <SelectField
              label="Status *"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={statusOptions}
              disabled={saving}
            />
            <div>
              <FileUploadField
                label="CV File (optional)"
                fileName={
                  formData.file
                    ? formData.file.name
                    : candidate?.file
                      ? (candidate.file.file_name || candidate.file.file_path?.split('/').pop())
                      : null
                }
                placeholder="Click to select CV file..."
                onChange={handleFileChange}
                disabled={saving}
                accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.png"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SingleSearchSelect
              label="Job (Requisition)"
              placeholder="Type job code or project to search..."
              initialItem={selectedJob}
              searchApi={(search) => searchJobsApi({ search })}
              displayFn={(j: any) => `${j.job_code} — ${j.project}`}
              keyProp="job_id"
              onChange={(id, item) => {
                setFormData((prev) => ({ ...prev, jobId: id || '' }));
                setSelectedJob(item);
              }}
              disabled={saving}
            />
            <InputField
              label="Candidate Code"
              name="candidateCode"
              value={formData.candidateCode}
              onChange={handleChange}
              placeholder="e.g. CAND-001 (Optional)"
              disabled={saving}
            />
          </div>
          <OutlookSearchSelect
            label="Candidate Levels"
            placeholder="Search levels..."
            initialItems={selectedLevels}
            searchApi={(search) => searchLevelsApi({ search })}
            displayFn={getLevelLabel}
            chipDisplayFn={getLevelLabel}
            keyProp="level_id"
            allowCreation={false}
            onChange={(ids, items) => {
              setFormData((prev) => ({ ...prev, candidateLevels: ids.map(Number).filter(Number.isFinite) }));
              setSelectedLevels(items);
            }}
            disabled={saving}
          />
        </div>

        {/* Section 2: Contact Information */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Email"
              type="email"
              name="candidateEmail"
              value={formData.candidateEmail}
              onChange={handleChange}
              placeholder="e.g. email@example.com"
              disabled={saving}
            />
            <InputField
              label="Phone"
              type="tel"
              name="candidatePhone"
              value={formData.candidatePhone}
              onChange={handlePhoneInput}
              placeholder="e.g. +084.123.412"
              disabled={saving}
            />
          </div>
        </div>

        {/* Section 3: Sourcing & Assignment */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sourcing & Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SingleSearchSelect
              label="Reference (Internal User)"
              placeholder="Search reference user..."
              initialItem={selectedReference}
              searchApi={(search) => fetchUsersApi({ search })}
              displayFn={(u: any) => u.user_name || ''}
              keyProp="user_id"
              onChange={(id, item) => {
                setFormData((prev) => ({ ...prev, referenceId: id || '' }));
                setSelectedReference(item);
              }}
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SingleSearchSelect
              label="Platform (Source)"
              placeholder="Search platform..."
              initialItem={selectedPlatform}
              searchApi={(search) => searchPlatformsApi({ search })}
              displayFn={getPlatformLabel}
              keyProp="platform_id"
              onChange={(id, item) => {
                setFormData((prev) => ({ ...prev, platformId: id || '' }));
                setSelectedPlatform(item);
              }}
              disabled={saving}
            />
            <SingleSearchSelect
              label="Agency"
              placeholder="Search or enter agency..."
              initialItem={selectedAgency}
              searchApi={async (search) => {
                const filtered = options.agencies.filter((a) =>
                  a.toLowerCase().includes(search.toLowerCase())
                );
                return { data: filtered.map((a) => ({ name: a })) };
              }}
              displayFn={(a: any) => a.name || ''}
              keyProp="name"
              onChange={(name, item) => {
                setFormData((prev) => ({ ...prev, agency: name || '' }));
                setSelectedAgency(item);
              }}
              allowCreation={true}
              disabled={saving}
            />
          </div>
        </div>

        {/* Section 4: Candidate Detail / CV Data */}
        <div className="bg-slate-50/50 rounded-xl border border-slate-100/80 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDetailSection((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-100/60 transition-colors"
            disabled={saving}
          >
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Detail / CV Data</span>
            <span className="text-xs font-semibold text-emerald-700">{showDetailSection ? 'Hide' : 'Show'}</span>
          </button>

          {showDetailSection && (
            <div className="p-4 border-t border-slate-100 space-y-5">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profile</h4>
                <TextareaField
                  label="Summary"
                  name="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  rows={3}
                  disabled={saving}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="Date of Birth"
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <SelectField
                    label="Gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    options={genderOptions}
                    disabled={saving}
                  />
                  <SelectField
                    label="Marital Status"
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    options={maritalStatusOptions}
                    disabled={saving}
                  />
                  <InputField
                    label="Nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <InputField
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <InputField
                    label="Salary Currency"
                    name="salaryCurrency"
                    value={formData.salaryCurrency}
                    onChange={handleChange}
                    placeholder="VND"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Links & Skills</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="GitHub"
                    value={formData.links.github}
                    onChange={(e) => handleLinkChange('github', e.target.value)}
                    disabled={saving}
                  />
                  <InputField
                    label="LinkedIn"
                    value={formData.links.linkedin}
                    onChange={(e) => handleLinkChange('linkedin', e.target.value)}
                    disabled={saving}
                  />
                  <InputField
                    label="Portfolio"
                    value={formData.links.portfolio}
                    onChange={(e) => handleLinkChange('portfolio', e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextareaField
                    label="Other Links"
                    value={formData.links.other.join('\n')}
                    onChange={(e) => handleOtherLinksChange(e.target.value)}
                    rows={3}
                    disabled={saving}
                  />
                  <TextareaField
                    label="Skills"
                    value={formData.skills.join('\n')}
                    onChange={(e) => handleListChange('skills', e.target.value)}
                    rows={3}
                    disabled={saving}
                  />
                  <TextareaField
                    label="Languages"
                    value={formData.languages.join('\n')}
                    onChange={(e) => handleListChange('languages', e.target.value)}
                    rows={3}
                    disabled={saving}
                  />
                  <TextareaField
                    label="Certifications"
                    value={formData.certifications.join('\n')}
                    onChange={(e) => handleListChange('certifications', e.target.value)}
                    rows={3}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-xs font-semibold text-slate-700">Language Details</h5>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-2.5 py-1.5 text-xs"
                      icon={<Plus size={14} />}
                      onClick={addLanguageDetail}
                      disabled={saving}
                    >
                      Add
                    </Button>
                  </div>
                  {formData.languageDetails.map((item, index) => (
                    <div key={`language-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-500">Language {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          icon={<Trash2 size={14} />}
                          onClick={() => removeLanguageDetail(index)}
                          disabled={saving}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                          label="Language"
                          value={item.language}
                          onChange={(e) => updateLanguageDetail(index, 'language', e.target.value)}
                          disabled={saving}
                        />
                        <InputField
                          label="Proficiency"
                          value={item.proficiency}
                          onChange={(e) => updateLanguageDetail(index, 'proficiency', e.target.value)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Education</h4>
                <TextareaField
                  label="Education"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  rows={3}
                  disabled={saving}
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-xs font-semibold text-slate-700">Education Details</h5>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-2.5 py-1.5 text-xs"
                      icon={<Plus size={14} />}
                      onClick={addEducationDetail}
                      disabled={saving}
                    >
                      Add
                    </Button>
                  </div>
                  {formData.educationDetails.map((item, index) => (
                    <div key={`education-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-500">Education {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          icon={<Trash2 size={14} />}
                          onClick={() => removeEducationDetail(index)}
                          disabled={saving}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField
                          label="Institution"
                          value={item.institution}
                          onChange={(e) => updateEducationDetail(index, 'institution', e.target.value)}
                          disabled={saving}
                        />
                        <InputField
                          label="Degree"
                          value={item.degree}
                          onChange={(e) => updateEducationDetail(index, 'degree', e.target.value)}
                          disabled={saving}
                        />
                        <InputField
                          label="Field"
                          value={item.field}
                          onChange={(e) => updateEducationDetail(index, 'field', e.target.value)}
                          disabled={saving}
                        />
                        <InputField
                          label="Start Date"
                          value={item.start_date}
                          onChange={(e) => updateEducationDetail(index, 'start_date', e.target.value)}
                          disabled={saving}
                        />
                        <InputField
                          label="End Date"
                          value={item.end_date}
                          onChange={(e) => updateEducationDetail(index, 'end_date', e.target.value)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Experience</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="Experience Years"
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <InputField
                    label="Current Position"
                    name="currentPosition"
                    value={formData.currentPosition}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <InputField
                    label="Current Level"
                    name="currentLevel"
                    value={formData.currentLevel}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <InputField
                    label="Current Salary"
                    type="number"
                    step="0.01"
                    name="currentSalary"
                    value={formData.currentSalary}
                    onChange={handleChange}
                    placeholder="2200"
                    disabled={saving}
                  />
                  <InputField
                    label="Last Company"
                    name="lastCompany"
                    value={formData.lastCompany}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
                <TextareaField
                  label="Work Experience"
                  name="workExperience"
                  value={formData.workExperience}
                  onChange={handleChange}
                  rows={3}
                  disabled={saving}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-xs font-semibold text-slate-700">Work Experience Details</h5>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-2.5 py-1.5 text-xs"
                      icon={<Plus size={14} />}
                      onClick={addWorkExperienceDetail}
                      disabled={saving}
                    >
                      Add
                    </Button>
                  </div>
                  {formData.workExperienceDetails.map((item, index) => (
                    <div key={`work-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-500">Work Experience {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          icon={<Trash2 size={14} />}
                          onClick={() => removeWorkExperienceDetail(index)}
                          disabled={saving}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                          label="Title"
                          value={item.title}
                          onChange={(e) => updateWorkExperienceDetail(index, 'title', e.target.value)}
                          disabled={saving}
                        />
                        <InputField
                          label="Company"
                          value={item.company}
                          onChange={(e) => updateWorkExperienceDetail(index, 'company', e.target.value)}
                          disabled={saving}
                        />
                        <InputField
                          label="Start Date"
                          value={item.start_date}
                          onChange={(e) => updateWorkExperienceDetail(index, 'start_date', e.target.value)}
                          disabled={saving}
                        />
                        <InputField
                          label="End Date"
                          value={item.end_date}
                          onChange={(e) => updateWorkExperienceDetail(index, 'end_date', e.target.value)}
                          disabled={saving}
                        />
                      </div>
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={item.is_current}
                          onChange={(e) => updateWorkExperienceCurrent(index, e.target.checked)}
                          disabled={saving}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Current role
                      </label>
                      <TextareaField
                        label="Responsibilities"
                        value={item.responsibilities.join('\n')}
                        onChange={(e) => updateWorkExperienceResponsibilities(index, e.target.value)}
                        rows={3}
                        disabled={saving}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expectations</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="Expected Position"
                    name="expectedPosition"
                    value={formData.expectedPosition}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <InputField
                    label="Expected Level"
                    name="expectedLevel"
                    value={formData.expectedLevel}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <InputField
                    label="Expected Salary"
                    type="number"
                    step="0.01"
                    name="expectedSalary"
                    value={formData.expectedSalary}
                    onChange={handleChange}
                    placeholder="2800"
                    disabled={saving}
                  />
                  <InputField
                    label="Expected Work Location"
                    name="expectedWorkLocation"
                    value={formData.expectedWorkLocation}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <SingleSearchSelect
                    label="Targeted Company"
                    placeholder="Search company..."
                    initialItem={selectedCompany}
                    searchApi={(search) => searchCompaniesApi({ search })}
                    displayFn={(c: any) => c.company_name || ''}
                    keyProp="company_id"
                    onChange={(id, item) => {
                      setFormData((prev) => ({ ...prev, targetedCompanyId: id || '' }));
                      setSelectedCompany(item);
                    }}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recruitment Timeline</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <InputField
                    label="Offer Date"
                    type="date"
                    name="offerDate"
                    value={formData.offerDate}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <InputField
                    label="Expected Onboard Date"
                    type="date"
                    name="expectedOnboardDate"
                    value={formData.expectedOnboardDate}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <InputField
                    label="Onboard Date"
                    type="date"
                    name="onboardDate"
                    value={formData.onboardDate}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <InputField
                    label="Feedback Date"
                    type="date"
                    name="feedbackDate"
                    value={formData.feedbackDate}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 6: Attachments & Notes */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attachments & Notes</h3>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Note</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={3}
              disabled={saving}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>
        </div>
      </form>
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
    </Modal>
  );
}
export { CandidateForm };
