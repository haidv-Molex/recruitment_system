import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { searchJobsApi } from '../services/jobApi';
import { searchPlatformsApi } from '../services/platformApi';
import { searchCompaniesApi } from '../services/companyApi';
import { fetchUsersApi } from '../services/userApi';
import { FileLink, FilePreviewModal } from './FilePreview';
import { fetchAgenciesApi, fetchStatusesApi } from '../services/candidateApi';

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
  file: null,
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CandidateForm = ({ candidate, onSubmit, onClose, saving }) => {
  const [formData, setFormData] = useState(emptyCandidate);
  const [error, setError] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

  // Dropdown options from APIs
  const [options, setOptions] = useState({
    jobs: [],
    platforms: [],
    companies: [],
    users: [],
    agencies: [],
    statuses: [],
  });

  useEffect(() => {
    // If editing, populate form with candidate data; otherwise reset
    if (candidate) {
      setFormData({
        candidateCode: candidate.code || candidate.candidateCode || '',
        candidateName: candidate.name || candidate.candidateName || '',
        candidateEmail: candidate.email || candidate.candidateEmail || '',
        candidatePhone: candidate.phone || candidate.candidatePhone || '',
        agency: candidate.agency || '',
        offerDate: candidate.offerDate ? candidate.offerDate.slice(0, 10) : '',
        onboardDate: candidate.onboardDate ? candidate.onboardDate.slice(0, 10) : '',
        expectedOnboardDate: candidate.expectedOnboardDate ? candidate.expectedOnboardDate.slice(0, 10) : '',
        feedbackDate: candidate.feedbackDate ? candidate.feedbackDate.slice(0, 10) : '',
        currentSalary: candidate.currentSalary || '',
        expectedSalary: candidate.expectedSalary || '',
        status: candidate.status || 'CV Sent',
        note: candidate.note || '',
        platformId: candidate.platform?.id || '',
        recruiterId: candidate.recruiter?.id || '',
        jobId: candidate.job?.id || '',
        targetedCompanyId: candidate.targetedCompany?.id || '',
        referenceId: candidate.reference?.id || '',
        file: null,
      });
    } else {
      setFormData(emptyCandidate);
    }
  }, [candidate]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    setLoadingOptions(true);

    const [jobsRes, platformsRes, companiesRes, usersRes, agenciesRes, statusesRes] = await Promise.all([
      searchJobsApi({ page: 1, limit: 100 }),
      searchPlatformsApi({ page: 1, limit: 100 }),
      searchCompaniesApi({ page: 1, limit: 100 }),
      fetchUsersApi(),
      fetchAgenciesApi(),
      fetchStatusesApi(),
    ]);

    setOptions({
      jobs: jobsRes.success ? jobsRes.jobs : [],
      platforms: platformsRes.success ? platformsRes.platforms : [],
      companies: companiesRes.success ? companiesRes.companies : [],
      users: usersRes.success ? usersRes.users : [],
      agencies: agenciesRes.success ? agenciesRes.agencies : [],
      statuses: statusesRes.success ? statusesRes.statuses : [],
    });

    setLoadingOptions(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneInput = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, candidatePhone: digitsOnly }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.candidateCode.trim()) {
      setError('Candidate Code is required.');
      return;
    }
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

  const selectStyle = {
    width: '100%',
    padding: '6px 8px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    background: '#fff',
  };

  const fileInputStyle = {
    width: '100%',
    padding: '6px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    background: '#fff',
  };

  return (
    <div className="modal-backdrop">
      <div className="excel-modal wide" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2>{candidate ? 'Edit Candidate' : 'Add Candidate'}</h2>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="excel-form" style={{ overflowY: 'auto', flex: 1 }}>
          {error && <div className="form-error">{error}</div>}
          {loadingOptions && <p style={{ fontSize: '12px', color: '#94a3b8' }}>Loading options from server...</p>}

          <div className="form-grid three">
            <label>
              Candidate Code *
              <input name="candidateCode" value={formData.candidateCode} onChange={handleChange} placeholder="e.g. CAND-001" disabled={saving} />
            </label>
            <label>
              Candidate Name *
              <input name="candidateName" value={formData.candidateName} onChange={handleChange} placeholder="e.g. Nguyễn Văn A" disabled={saving} />
            </label>
            <label>
              Email
              <input type="email" name="candidateEmail" value={formData.candidateEmail} onChange={handleChange} placeholder="e.g. email@example.com" disabled={saving} />
            </label>
            <label>
              Phone
              <input type="tel" name="candidatePhone" value={formData.candidatePhone} onChange={handlePhoneInput} placeholder="Numeric only" disabled={saving} />
            </label>
            <label>
              Job *
              <select name="jobId" value={formData.jobId} onChange={handleChange} style={selectStyle} disabled={saving}>
                <option value="">Select Job</option>
                {options.jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.code} — {j.project}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="status" value={formData.status} onChange={handleChange} style={selectStyle} disabled={saving}>
                <option value="">Select Status</option>
                {options.statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Platform (Source)
              <select name="platformId" value={formData.platformId} onChange={handleChange} style={selectStyle} disabled={saving}>
                <option value="">Select Platform</option>
                {options.platforms.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label>
              Recruiter
              <select name="recruiterId" value={formData.recruiterId} onChange={handleChange} style={selectStyle} disabled={saving}>
                <option value="">Select Recruiter</option>
                {options.users.map((u) => (
                  <option key={u.id} value={u.id}>{u.displayName} ({u.role})</option>
                ))}
              </select>
            </label>
            <label>
              Targeted Company
              <select name="targetedCompanyId" value={formData.targetedCompanyId} onChange={handleChange} style={selectStyle} disabled={saving}>
                <option value="">Select Company</option>
                {options.companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label>
              Reference (User)
              <select name="referenceId" value={formData.referenceId} onChange={handleChange} style={selectStyle} disabled={saving}>
                <option value="">None</option>
                {options.users.map((u) => (
                  <option key={u.id} value={u.id}>{u.displayName}</option>
                ))}
              </select>
            </label>
            <label>
              Agency
              <select name="agency" value={formData.agency} onChange={handleChange} style={selectStyle} disabled={saving}>
                <option value="">Select Agency</option>
                {options.agencies.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </label>
            <label>
              Current Salary
              <input name="currentSalary" value={formData.currentSalary} onChange={handleChange} placeholder="e.g. 2200 USD" disabled={saving} />
            </label>
            <label>
              Expected Salary
              <input name="expectedSalary" value={formData.expectedSalary} onChange={handleChange} placeholder="e.g. 2800 USD" disabled={saving} />
            </label>
            <label>
              Offer Date
              <input type="date" name="offerDate" value={formData.offerDate} onChange={handleChange} disabled={saving} />
            </label>
            <label>
              Onboard Date
              <input type="date" name="onboardDate" value={formData.onboardDate} onChange={handleChange} disabled={saving} />
            </label>
            <label>
              Expected Onboard Date
              <input type="date" name="expectedOnboardDate" value={formData.expectedOnboardDate} onChange={handleChange} disabled={saving} />
            </label>
            <label>
              Feedback Date
              <input type="date" name="feedbackDate" value={formData.feedbackDate} onChange={handleChange} disabled={saving} />
            </label>
            <label>
              CV File (optional)
              {/* If candidate has existing file, show link */}
              {candidate?.file && (
                <FileLink
                  file={candidate.file}
                  onClick={() => setPreviewFile(candidate.file)}
                />
              )}
              <input style={fileInputStyle} type="file" onChange={handleFileChange} disabled={saving} accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.png" />
              {formData.file && (
                <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>New file selected: {formData.file.name}</p>
              )}
            </label>
          </div>

          <label>
            Note
            <textarea name="note" value={formData.note} onChange={handleChange} rows={3} disabled={saving} />
          </label>

          <div className="modal-actions">
            <button type="button" className="excel-button secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="excel-button primary" disabled={saving}>
              {saving ? 'Saving...' : (candidate ? 'Save Candidate' : 'Create Candidate')}
            </button>
          </div>
        </form>
      </div>
      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};