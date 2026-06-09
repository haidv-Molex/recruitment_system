import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { masterData } from '../services/mockData';

const emptyCandidate = {
  inputDate: new Date().toISOString().slice(0, 10),
  department: '',
  name: '',
  email: '',
  phone: '',
  recruiter: '',
  jobCode: '',
  jobTitle: '',
  eeLevel: '',
  project: '',
  hiringManager: '',
  dlIdl: 'IDL',
  status: 'CV Sent',
  onboardingDate: '',
  offerSentDate: '',
  source: '',
  employeeId: '',
  referrerName: '',
  referrerDepartment: '',
  note: '',
  currentSalary: '',
  expectedSalary: '',
  candidateResultFeedbackDate: '',
  headhuntAgency: '',
  targetedCompany: false,
  targetedCompanyName: '',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CandidateForm = ({ candidate, jobs, onSubmit, onClose, duplicateError }) => {
  const [formData, setFormData] = useState(emptyCandidate);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(candidate ? { ...emptyCandidate, ...candidate } : emptyCandidate);
  }, [candidate]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.jobCode === formData.jobCode),
    [jobs, formData.jobCode]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const next = { ...prev, [name]: nextValue };
      if (name === 'jobCode') {
        const job = jobs.find((item) => item.jobCode === value);
        if (job) {
          next.department = job.department;
          next.jobTitle = job.jobTitle;
          next.eeLevel = job.eeLevel;
          next.project = job.project;
          next.hiringManager = job.hiringManager;
          next.recruiter = job.recruiter;
        }
      }
      return next;
    });
  };

  const handlePhoneInput = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, phone: digitsOnly }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.jobCode.trim()) {
      setError('Name, Email, Phone Number and Job Code are required.');
      return;
    }

    if (!emailRegex.test(formData.email)) {
      setError('Email format is invalid.');
      return;
    }

    if (!/^\d+$/.test(formData.phone)) {
      setError('Phone number must contain numeric characters only.');
      return;
    }

    if (!selectedJob) {
      setError('Job Code must exist in Job Tracking.');
      return;
    }

    const normalized = {
      ...formData,
      id: candidate?.id || `cand-${Date.now()}`,
      currentSalary: formData.currentSalary === '' ? '' : Number(formData.currentSalary),
      expectedSalary: formData.expectedSalary === '' ? '' : Number(formData.expectedSalary),
    };

    const duplicateMessage = duplicateError?.(normalized, candidate?.id);
    if (duplicateMessage) {
      setError(duplicateMessage);
      return;
    }

    onSubmit(normalized);
  };

  return (
    <div className="modal-backdrop">
      <div className="excel-modal wide">
        <div className="modal-header">
          <h2>{candidate ? 'Edit Candidate' : 'Add Candidate'}</h2>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="excel-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-grid three">
            <label>
              Input Date
              <input type="date" name="inputDate" value={formData.inputDate} onChange={handleChange} />
            </label>
            <label>
              Candidate Name *
              <input name="name" value={formData.name} onChange={handleChange} />
            </label>
            <label>
              Email *
              <input type="email" name="email" value={formData.email} onChange={handleChange} />
            </label>
            <label>
              Phone Number *
              <input type="tel" name="phone" value={formData.phone} onChange={handlePhoneInput} placeholder="Numeric only" />
            </label>
            <label>
              Job Code *
              <select name="jobCode" value={formData.jobCode} onChange={handleChange}>
                <option value="">Select Job Code</option>
                {jobs.map((job) => <option key={job.jobCode} value={job.jobCode}>{job.jobCode}</option>)}
              </select>
            </label>
            <label>
              Job Title
              <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} />
            </label>
            <label>
              Department
              <select name="department" value={formData.department} onChange={handleChange}>
                <option value="">Select</option>
                {masterData.department.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>
              EE Level
              <select name="eeLevel" value={formData.eeLevel} onChange={handleChange}>
                <option value="">Select</option>
                {masterData.eeLevel.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Project
              <input name="project" value={formData.project} onChange={handleChange} />
            </label>
            <label>
              Hiring Manager
              <input name="hiringManager" value={formData.hiringManager} onChange={handleChange} />
            </label>
            <label>
              Recruiter
              <input name="recruiter" value={formData.recruiter} onChange={handleChange} />
            </label>
            <label>
              DL/IDL
              <select name="dlIdl" value={formData.dlIdl} onChange={handleChange}>
                {masterData.dlIdl.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Status
              <select name="status" value={formData.status} onChange={handleChange}>
                {masterData.status.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Source
              <select name="source" value={formData.source} onChange={handleChange}>
                <option value="">Select</option>
                {masterData.source.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Offer Sent Date
              <input type="date" name="offerSentDate" value={formData.offerSentDate} onChange={handleChange} />
            </label>
            <label>
              Onboarding Date
              <input type="date" name="onboardingDate" value={formData.onboardingDate} onChange={handleChange} />
            </label>
            <label>
              Employee ID
              <input name="employeeId" value={formData.employeeId} onChange={handleChange} />
            </label>
            <label>
              Referrer Name
              <input name="referrerName" value={formData.referrerName} onChange={handleChange} />
            </label>
            <label>
              Referrer Department
              <input name="referrerDepartment" value={formData.referrerDepartment} onChange={handleChange} />
            </label>
            <label>
              Current Salary (million VND)
              <input type="number" name="currentSalary" value={formData.currentSalary} onChange={handleChange} />
            </label>
            <label>
              Expected Salary (million VND)
              <input type="number" name="expectedSalary" value={formData.expectedSalary} onChange={handleChange} />
            </label>
            <label>
              Result Feedback Date
              <input type="date" name="candidateResultFeedbackDate" value={formData.candidateResultFeedbackDate} onChange={handleChange} />
            </label>
            <label>
              Headhunt Agency
              <select name="headhuntAgency" value={formData.headhuntAgency} onChange={handleChange}>
                <option value="">None</option>
                {masterData.headhuntAgency.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" name="targetedCompany" checked={formData.targetedCompany} onChange={handleChange} />
              Targeted Company
            </label>
            <label>
              Targeted Company Name
              <input name="targetedCompanyName" value={formData.targetedCompanyName} onChange={handleChange} />
            </label>
          </div>

          <label>
            Note
            <textarea name="note" value={formData.note} onChange={handleChange} rows={3} />
          </label>

          <div className="modal-actions">
            <button type="button" className="excel-button secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="excel-button primary">Save Candidate</button>
          </div>
        </form>
      </div>
    </div>
  );
};
