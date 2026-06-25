import React, { useEffect, useState } from 'react';
import { searchJobsApi } from '@/services/jobApi';
import { searchPlatformsApi } from '@/services/platformApi';
import { searchCompaniesApi } from '@/services/companyApi';
import { fetchUsersApi } from '@/services/userApi';
import { FilePreviewModal } from '@/components/common/FilePreview';
import { fetchAgenciesApi, fetchStatusesApi } from '@/services/candidateApi';
import Modal from '@/components/ui/Modal';
import InputField from '@/components/common/InputField';
import SelectField from '@/components/common/SelectField';
import Button from '@/components/common/Button';
import SingleSearchSelect from '@/components/ui/SingleSearchSelect';
import FileUploadField from '@/components/common/FileUploadField';
import NotesManager from '@/components/common/NotesManager';

const emptyCandidate = {
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
  file: null as File | null,
};

const EMPTY_NOTES: any[] = [];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?\d+(?:\.\d+)*$/;

const getPlatformLabel = (platform: any) => platform?.platform_code || platform?.platform_name || '';

export interface CandidateFormProps {
  candidate?: any;
  onSubmit: (data: typeof emptyCandidate) => void;
  onClose: () => void;
  saving: boolean;
}

export default function CandidateForm({ candidate, onSubmit, onClose, saving }: CandidateFormProps) {
  const [formData, setFormData] = useState(emptyCandidate);
  const [notesPayload, setNotesPayload] = useState<{ note_id: number | null; text: string }[]>([]);
  const [error, setError] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [selectedReference, setSelectedReference] = useState<any | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<any | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<any | null>(null);

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
      setFormData({
        candidateName: candidate.candidate_name || '',
        candidateEmail: candidate.candidate_email || '',
        candidatePhone: candidate.candidate_phone || '',
        agency: candidate.agency || '',
        offerDate: candidate.offer_date ? String(candidate.offer_date).slice(0, 10) : '',
        onboardDate: candidate.onboard_date ? String(candidate.onboard_date).slice(0, 10) : '',
        expectedOnboardDate: candidate.expected_onboard_date ? String(candidate.expected_onboard_date).slice(0, 10) : '',
        feedbackDate: candidate.feedback_date ? String(candidate.feedback_date).slice(0, 10) : '',
        currentSalary: candidate.current_salary || '',
        expectedSalary: candidate.expected_salary || '',
        status: candidate.status || 'CV Sent',
        note: candidate.note || '',
        platformId: candidate.platform?.platform_id || candidate.platform_id || '',
        jobId: candidate.job?.job_id || candidate.job_id || '',
        targetedCompanyId: candidate.targeted_company?.company_id || candidate.targeted_company || '',
        referenceId: candidate.reference?.user_id || candidate.reference || '',
        file: null,
      });
      setSelectedJob(candidate.job || null);
      setSelectedReference(candidate.reference || null);
      setSelectedPlatform(candidate.platform || null);
      setSelectedCompany(candidate.targeted_company || null);
      setSelectedAgency(candidate.agency ? { name: candidate.agency } : null);
    } else {
      setFormData(emptyCandidate);
      setSelectedJob(null);
      setSelectedReference(null);
      setSelectedPlatform(null);
      setSelectedCompany(null);
      setSelectedAgency(null);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.candidateEmail.trim() && !formData.candidatePhone.trim()) {
      setError('Phải cung cấp ít nhất Email hoặc Số điện thoại ứng viên.');
      return;
    }
    if (formData.candidateEmail.trim() && !emailRegex.test(formData.candidateEmail)) {
      setError('Email format is invalid.');
      return;
    }
    if (formData.candidatePhone && !phoneRegex.test(formData.candidatePhone)) {
      setError('Phone number must contain digits, optional dot separators, and may start with +.');
      return;
    }

    if (candidate) {
      // Edit candidate payload
      const { note, ...rest } = formData;
      onSubmit({
        ...rest,
        notes: notesPayload,
      } as any);
    } else {
      // Create candidate payload
      const noteTexts = notesPayload.map((n) => n.text).filter(Boolean);
      onSubmit({
        ...formData,
        note: noteTexts.join('\n'),
      });
    }
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
      maxWidthClass="max-w-4xl"
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
              label="Candidate Name (optional)"
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
          <div className="grid grid-cols-1 gap-4">
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
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Email *"
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

        {/* Section 4: Employment & Salary Details */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Employment & Salary Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="Current Salary"
              name="currentSalary"
              value={formData.currentSalary}
              onChange={handleChange}
              placeholder="e.g. 2200 USD"
              disabled={saving}
            />
            <InputField
              label="Expected Salary"
              name="expectedSalary"
              value={formData.expectedSalary}
              onChange={handleChange}
              placeholder="e.g. 2800 USD"
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

        {/* Section 5: Recruitment Timeline */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recruitment Timeline</h3>
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
              label="Onboard Date"
              type="date"
              name="onboardDate"
              value={formData.onboardDate}
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
              label="Feedback Date"
              type="date"
              name="feedbackDate"
              value={formData.feedbackDate}
              onChange={handleChange}
              disabled={saving}
            />
          </div>
        </div>

        {/* Section 6: Attachments & Notes */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attachments & Notes</h3>
          <NotesManager
            existingNotes={Array.isArray(candidate?.note) ? candidate.note : EMPTY_NOTES}
            onChange={setNotesPayload}
            disabled={saving}
          />
        </div>
      </form>
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
    </Modal>
  );
}
export { CandidateForm };
