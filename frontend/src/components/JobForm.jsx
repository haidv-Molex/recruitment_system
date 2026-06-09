import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { masterData } from '../services/mockData';

const emptyJob = {
  jobCode: '',
  project: '',
  department: '',
  hcRequested: 1,
  jobTitle: '',
  eeLevel: 'Professional',
  sites: '',
  projectSegment: '',
  hiringManager: '',
  hrbp: '',
  recruiter: '',
  myhrRequestDate: '',
  expectedOnboardDate: '',
  status: 'Searching',
  source: '',
  candidateName: '',
  onboardDate: '',
  offerDate: '',
  note: '',
};

export const JobForm = ({ job, jobs, onSubmit, onClose }) => {
  const [formData, setFormData] = useState(emptyJob);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(job ? { ...emptyJob, ...job } : emptyJob);
  }, [job]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'hcRequested' ? Number(value) : value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!formData.jobCode.trim() || !formData.project.trim() || !formData.department.trim() || !formData.jobTitle.trim()) {
      setError('Job Code, Project, Department and Job Title are required.');
      return;
    }

    const duplicatedCode = jobs.some((item) => item.jobCode === formData.jobCode && item.id !== job?.id);
    if (duplicatedCode) {
      setError('Job Code must be unique.');
      return;
    }

    onSubmit({ ...formData, id: job?.id || `job-${Date.now()}` });
  };

  return (
    <div className="modal-backdrop">
      <div className="excel-modal wide">
        <div className="modal-header">
          <h2>{job ? 'Edit Job Requisition' : 'Add Job Requisition'}</h2>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="excel-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-grid three">
            <label>
              Job Code *
              <input name="jobCode" value={formData.jobCode} onChange={handleChange} placeholder="IDL-HR-001" />
            </label>
            <label>
              Project *
              <input name="project" value={formData.project} onChange={handleChange} />
            </label>
            <label>
              Department *
              <select name="department" value={formData.department} onChange={handleChange}>
                <option value="">Select</option>
                {masterData.department.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>
              HC Requested
              <input type="number" min="1" name="hcRequested" value={formData.hcRequested} onChange={handleChange} />
            </label>
            <label>
              Job Title *
              <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} />
            </label>
            <label>
              EE Level
              <select name="eeLevel" value={formData.eeLevel} onChange={handleChange}>
                {masterData.eeLevel.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Sites
              <input name="sites" value={formData.sites} onChange={handleChange} />
            </label>
            <label>
              Project Segment
              <input name="projectSegment" value={formData.projectSegment} onChange={handleChange} />
            </label>
            <label>
              Hiring Manager
              <input name="hiringManager" value={formData.hiringManager} onChange={handleChange} />
            </label>
            <label>
              HRBP
              <input name="hrbp" value={formData.hrbp} onChange={handleChange} />
            </label>
            <label>
              Recruiter
              <input name="recruiter" value={formData.recruiter} onChange={handleChange} />
            </label>
            <label>
              MyHR Request Date
              <input type="date" name="myhrRequestDate" value={formData.myhrRequestDate} onChange={handleChange} />
            </label>
            <label>
              Expected Onboard Date
              <input type="date" name="expectedOnboardDate" value={formData.expectedOnboardDate} onChange={handleChange} />
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
              Candidate Name
              <input name="candidateName" value={formData.candidateName} onChange={handleChange} />
            </label>
            <label>
              Offer Date
              <input type="date" name="offerDate" value={formData.offerDate} onChange={handleChange} />
            </label>
            <label>
              Onboard Date
              <input type="date" name="onboardDate" value={formData.onboardDate} onChange={handleChange} />
            </label>
          </div>

          <label>
            Note
            <textarea name="note" value={formData.note} onChange={handleChange} rows={3} />
          </label>

          <div className="modal-actions">
            <button type="button" className="excel-button secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="excel-button primary">Save Job</button>
          </div>
        </form>
      </div>
    </div>
  );
};
