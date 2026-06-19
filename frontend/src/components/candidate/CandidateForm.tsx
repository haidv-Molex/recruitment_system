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

const emptyCandidate = {
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
  file: null as File | null,
};

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
  const [error, setError] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [selectedReference, setSelectedReference] = useState<any | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<any | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<any | null>(null);
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
      setFormData({
        candidateCode: candidate.candidate_code || '',
        candidateName: candidate.candidate_name || '',
        candidateEmail: candidate.candidate_email || '',
        candidatePhone: candidate.candidate_phone || '',
        agency: candidate.agency || '',
        offerDate: detail.offer_date ? String(detail.offer_date).slice(0, 10) : '',
        onboardDate: detail.onboard_date ? String(detail.onboard_date).slice(0, 10) : '',
        expectedOnboardDate: detail.expected_onboard_date ? String(detail.expected_onboard_date).slice(0, 10) : '',
        feedbackDate: detail.feedback_date ? String(detail.feedback_date).slice(0, 10) : '',
        currentSalary: detail.current_salary || '',
        expectedSalary: detail.expected_salary || '',
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
      setShowDetailSection(false);
    } else {
      setFormData(emptyCandidate);
      setSelectedJob(null);
      setSelectedReference(null);
      setSelectedPlatform(null);
      setSelectedCompany(null);
      setSelectedAgency(null);
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

    onSubmit(formData);
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
            <div className="p-4 border-t border-slate-100 space-y-4">
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
