import { useEffect, useState } from 'react';
import { searchJobsApi } from '@/services/jobApi';
import { searchPlatformsApi } from '@/services/platformApi';
import { searchCompaniesApi } from '@/services/companyApi';
import { fetchUsersApi } from '@/services/userApi';
import { FilePreviewModal } from '@/components/common/FilePreview';
import { fetchAgenciesApi, fetchStatusesApi } from '@/services/candidateApi';
import Modal from '@/components/ui/Modal';
import Button from '@/components/common/Button';
import BasicInfoSection from './CandidateForm/BasicInfoSection';
import ContactSection from './CandidateForm/ContactSection';
import SourcingSection from './CandidateForm/SourcingSection';
import DetailSection from './CandidateForm/DetailSection';
import TimelineSection from './CandidateForm/TimelineSection';
import NotesSection from './CandidateForm/NotesSection';
import {
  createEmptyCandidate,
  emptyCandidate,
  type CandidateFormChangeEvent,
  type CandidateFormOptions,
} from './CandidateForm/types';
import {
  dateInputValue,
  emailRegex,
  hasAnyValue,
  hasInvalidOptionalNumber,
  normalizeLinks,
  phoneRegex,
  toObjectList,
  toStringList,
} from './CandidateForm/utils';

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

  const [options, setOptions] = useState<CandidateFormOptions>({
    jobs: [],
    platforms: [],
    companies: [],
    users: [],
    agencies: [],
    statuses: [],
  });

  useEffect(() => {
    if (!candidate) {
      setFormData(createEmptyCandidate());
      setSelectedJob(null);
      setSelectedReference(null);
      setSelectedPlatform(null);
      setSelectedCompany(null);
      setSelectedAgency(null);
      setSelectedLevels([]);
      setShowDetailSection(false);
      return;
    }

    const detail = candidate.candidate_detail || {};
    const candidateLevels = Array.isArray(candidate.candidate_levels)
      ? candidate.candidate_levels
      : Array.isArray(candidate.candidateLevels)
        ? candidate.candidateLevels
        : [];
    const normalizedLevels = candidateLevels
      .map((level: any) => (typeof level === 'object' ? level : { level_id: level, level_name: String(level) }))
      .filter((level: any) => level.level_id !== undefined && level.level_id !== null);
    const targetedCompany = candidate.targeted_company;
    const targetedCompanyId = targetedCompany && typeof targetedCompany === 'object'
      ? targetedCompany.company_id
      : targetedCompany || '';

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
      currentSalary: detail.current_salary ?? '',
      expectedSalary: detail.expected_salary ?? '',
      status: candidate.status || 'CV Sent',
      note: candidate.note || '',
      platformId: candidate.platform?.platform_id || candidate.platform_id || '',
      jobId: candidate.job?.job_id || candidate.job_id || '',
      targetedCompanyId,
      targetedCompanyName: '',
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
        start_date: dateInputValue(item.start_date),
        end_date: dateInputValue(item.end_date),
      })),
      experienceYears: detail.experience_years || '',
      currentPosition: detail.current_position || '',
      currentLevel: detail.current_level || '',
      lastCompany: detail.last_company || '',
      workExperience: detail.work_experience || '',
      workExperienceDetails: toObjectList<any>(detail.work_experience_details).map((item) => ({
        title: item.title || '',
        company: item.company || '',
        start_date: dateInputValue(item.start_date),
        end_date: dateInputValue(item.end_date),
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
    setSelectedCompany(targetedCompany && typeof targetedCompany === 'object' ? targetedCompany : null);
    setSelectedAgency(candidate.agency ? { name: candidate.agency } : null);
    setSelectedLevels(normalizedLevels);
    setShowDetailSection(false);
  }, [candidate]);

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (formData.jobId && options.jobs.length > 0 && !selectedJob) {
      const found = options.jobs.find((job) => String(job.job_id) === String(formData.jobId));
      if (found) setSelectedJob(found);
    }
  }, [formData.jobId, options.jobs, selectedJob]);

  useEffect(() => {
    if (formData.referenceId && options.users.length > 0 && !selectedReference) {
      const found = options.users.find((user) => String(user.user_id) === String(formData.referenceId));
      if (found) setSelectedReference(found);
    }
  }, [formData.referenceId, options.users, selectedReference]);

  useEffect(() => {
    if (formData.platformId && options.platforms.length > 0 && !selectedPlatform) {
      const found = options.platforms.find((platform) => String(platform.platform_id) === String(formData.platformId));
      if (found) setSelectedPlatform(found);
    }
  }, [formData.platformId, options.platforms, selectedPlatform]);

  useEffect(() => {
    if (formData.targetedCompanyId && options.companies.length > 0 && !selectedCompany) {
      const found = options.companies.find((company) => String(company.company_id) === String(formData.targetedCompanyId));
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

  const handleChange = (event: CandidateFormChangeEvent) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const phoneValue = event.target.value.replace(/[^\d+.]/g, '').replace(/(?!^)\+/g, '');
    setFormData((prev) => ({ ...prev, candidatePhone: phoneValue }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  const getSubmitData = () => ({
    ...formData,
    candidateLevels: formData.candidateLevels.map(Number).filter(Number.isFinite),
    targetedCompanyId: formData.targetedCompanyId || '',
    targetedCompanyName: formData.targetedCompanyId ? '' : formData.targetedCompanyName.trim(),
    links: {
      github: formData.links.github.trim(),
      linkedin: formData.links.linkedin.trim(),
      portfolio: formData.links.portfolio.trim(),
      other: formData.links.other.map((item) => item.trim()).filter(Boolean),
    },
    skills: formData.skills.map((item) => item.trim()).filter(Boolean),
    languages: formData.languages.map((item) => item.trim()).filter(Boolean),
    languageDetails: formData.languageDetails
      .map((item) => ({ language: item.language.trim(), proficiency: item.proficiency.trim() }))
      .filter((item) => hasAnyValue([item.language, item.proficiency])),
    educationDetails: formData.educationDetails
      .map((item) => ({
        institution: item.institution.trim(),
        degree: item.degree.trim(),
        field: item.field.trim(),
        start_date: item.start_date,
        end_date: item.end_date,
      }))
      .filter((item) => hasAnyValue([item.institution, item.degree, item.field, item.start_date, item.end_date])),
    workExperienceDetails: formData.workExperienceDetails
      .map((item) => ({
        title: item.title.trim(),
        company: item.company.trim(),
        start_date: item.start_date,
        end_date: item.end_date,
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
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
    if (hasInvalidOptionalNumber(formData.currentSalary) || hasInvalidOptionalNumber(formData.expectedSalary)) {
      setError('Salary fields must be valid non-negative numbers.');
      return;
    }

    onSubmit(getSubmitData());
  };

  const statusOptions = [
    { value: '', label: 'Select Status' },
    ...options.statuses.map((status) => ({ value: status, label: status })),
  ];

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
              setPreviewFile({ file_name: fileToDisplay.name, file_path: fileUrl, file_url: fileUrl });
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
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={saving}>
            {saving ? 'Saving...' : candidate ? 'Save Candidate' : 'Create Candidate'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 text-red-600 text-xs px-3.5 py-2 rounded-lg border border-red-200">{error}</div>}
        {loadingOptions && <p className="text-xs text-slate-400">Loading form options from server...</p>}

        <BasicInfoSection
          formData={formData}
          setFormData={setFormData}
          statusOptions={statusOptions}
          selectedLevels={selectedLevels}
          setSelectedLevels={setSelectedLevels}
          handleChange={handleChange}
          handleFileChange={handleFileChange}
          saving={saving}
          candidate={candidate}
        />
        <ContactSection formData={formData} handleChange={handleChange} handlePhoneInput={handlePhoneInput} saving={saving} />
        <SourcingSection
          formData={formData}
          setFormData={setFormData}
          options={options}
          selectedJob={selectedJob}
          setSelectedJob={setSelectedJob}
          selectedReference={selectedReference}
          setSelectedReference={setSelectedReference}
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
          selectedAgency={selectedAgency}
          setSelectedAgency={setSelectedAgency}
          saving={saving}
        />
        <TimelineSection formData={formData} handleChange={handleChange} saving={saving} />
        <DetailSection
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          selectedCompany={selectedCompany}
          setSelectedCompany={setSelectedCompany}
          showDetailSection={showDetailSection}
          setShowDetailSection={setShowDetailSection}
          saving={saving}
        />
        <NotesSection formData={formData} handleChange={handleChange} saving={saving} />
      </form>
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
    </Modal>
  );
}

export { CandidateForm };
