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
  recruiterId: '',
  jobId: '',
  targetedCompanyId: '',
  referenceId: '',
  file: null as File | null,
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
        candidateCode: candidate.candidate_code || '',
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
        recruiterId: candidate.recruiter?.user_id || candidate.recruiter || '',
        jobId: candidate.job?.job_id || candidate.job_id || '',
        targetedCompanyId: candidate.targeted_company?.company_id || candidate.targeted_company || '',
        referenceId: candidate.reference?.user_id || candidate.reference || '',
        file: null,
      });
      setSelectedJob(candidate.job || null);
    } else {
      setFormData(emptyCandidate);
      setSelectedJob(null);
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
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, candidatePhone: digitsOnly }));
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
    if (formData.candidatePhone && !/^\d+$/.test(formData.candidatePhone)) {
      setError('Phone number must contain numeric characters only.');
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
    ...options.platforms.map((p) => ({ value: p.platform_id, label: p.platform_name })),
  ];

  const recruiterOptions = [
    { value: '', label: 'Select Recruiter' },
    ...options.users.map((u) => ({ value: u.user_id, label: `${u.user_name} (${u.user_role})` })),
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
              placeholder="Numeric only"
              disabled={saving}
            />
          </div>
        </div>

        {/* Section 3: Sourcing & Assignment */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/80 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sourcing & Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Recruiter"
              name="recruiterId"
              value={formData.recruiterId}
              onChange={handleChange}
              options={recruiterOptions}
              disabled={saving}
            />
            <SelectField
              label="Reference (Internal User)"
              name="referenceId"
              value={formData.referenceId}
              onChange={handleChange}
              options={referenceOptions}
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Platform (Source)"
              name="platformId"
              value={formData.platformId}
              onChange={handleChange}
              options={platformOptions}
              disabled={saving}
            />
            <SelectField
              label="Agency"
              name="agency"
              value={formData.agency}
              onChange={handleChange}
              options={agencyOptions}
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
            <SelectField
              label="Targeted Company"
              name="targetedCompanyId"
              value={formData.targetedCompanyId}
              onChange={handleChange}
              options={companyOptions}
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
