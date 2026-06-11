import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Eye, Plus, Trash2, Users } from 'lucide-react';
import { ExcelTable, formatDate } from '../components/ExcelTable';
import { JobForm } from '../components/JobForm';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { calculatePipelineForJob, masterData } from '../services/mockData';
import { createJobApi, searchJobsApi } from '../services/jobApi';

const statusClass = (status) => `status-pill status-${String(status || '').toLowerCase().replace(/\s+/g, '-')}`;

// Map API job to local table format
const mapApiJobToRow = (j) => ({
  id: j.id,
  jobCode: j.code,
  project: j.project,
  department: j.departments.map((d) => d.code).join(', '),
  hcRequested: j.candidateRequired,
  jobTitle: j.titles.map((t) => t.name).join(', '),
  eeLevel: j.employeeLevels.map((el) => el.name).join(', '),
  sites: j.sites.map((s) => s.code).join(', '),
  projectSegment: j.segments.map((sg) => sg.name).join(', '),
  hiringManager: j.managers.map((m) => m.name).join(', '),
  hrbp: j.partners.map((p) => p.name).join(', '),
  recruiter: '',
  myhrRequestDate: '',
  expectedOnboardDate: '',
  status: 'Searching',
  source: '',
  candidateName: '',
  onboardDate: '',
  offerDate: '',
  note: j.note,
  // Keep API data for editing
  departments: j.departments,
  segments: j.segments,
  sitesData: j.sites,
  titles: j.titles,
  employeeLevels: j.employeeLevels,
  partners: j.partners,
  managers: j.managers,
});

export const JobTrackingPage = ({ jobs, setJobs, candidates }) => {
  const { toasts, removeToast, toast } = useToast();
  const [selectedJobCode, setSelectedJobCode] = useState('');
  const [editingJob, setEditingJob] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load jobs from API on mount
  const loadJobsFromApi = useCallback(async () => {
    setLoading(true);
    const result = await searchJobsApi({ page: 1, limit: 100 });

    if (result.success && result.jobs.length > 0) {
      setJobs(result.jobs.map(mapApiJobToRow));
    }

    setLoading(false);
  }, [setJobs]);

  useEffect(() => {
    loadJobsFromApi();
  }, []);

  const selectedJob = jobs.find((job) => job.jobCode === selectedJobCode);
  const selectedCandidates = selectedJobCode
    ? candidates.filter((candidate) => candidate.jobCode === selectedJobCode)
    : [];

  const rows = useMemo(() => {
    return jobs.map((job) => {
      const pipeline = calculatePipelineForJob(job.jobCode, candidates);
      const jobCandidates = candidates.filter((candidate) => candidate.jobCode === job.jobCode);
      const finalCandidate =
        jobCandidates.find((candidate) => candidate.status === 'Onboarded') ||
        jobCandidates.find((candidate) => candidate.status === 'Offer Accepted') ||
        jobCandidates.find((candidate) => candidate.status === 'Offered' || candidate.status === 'Offer');

      return {
        ...job,
        cvSent: autoCalculate ? pipeline.cvSent : job.cvSent || 0,
        interview: autoCalculate ? pipeline.interview : job.interview || 0,
        offered: autoCalculate ? pipeline.offered : job.offered || 0,
        offerAccepted: autoCalculate ? pipeline.offerAccepted : job.offerAccepted || 0,
        onboarded: autoCalculate ? pipeline.onboarded : job.onboarded || 0,
        offerRejected: autoCalculate ? pipeline.offerRejected : job.offerRejected || 0,
        candidateName: job.candidateName || finalCandidate?.name || '',
        onboardDate: job.onboardDate || finalCandidate?.onboardingDate || '',
        offerDate: job.offerDate || finalCandidate?.offerSentDate || '',
      };
    });
  }, [jobs, candidates, autoCalculate]);

  const handleSaveJob = async (formData) => {
    setSaving(true);

    // If editing existing job, use local update (TODO: replace with update API later)
    if (editingJob) {
      setJobs((prev) =>
        prev.map((item) =>
          item.id === editingJob.id
            ? { ...item, jobCode: formData.jobCode, project: formData.project, hcRequested: formData.candidateRequired, note: formData.note }
            : item
        )
      );
      toast.success('Job updated (local).');
      setShowJobForm(false);
      setEditingJob(null);
      setSaving(false);
      return;
    }

    // Call API to create new job
    const result = await createJobApi(formData);

    if (result.success) {
      toast.success(result.message || 'Job created successfully.');
      setShowJobForm(false);
      // Reload jobs from API to get fresh data from database
      await loadJobsFromApi();
    } else {
      toast.error(result.message);
    }

    setSaving(false);
  };

  const handleDeleteJob = (job) => {
    const hasCandidates = candidates.some((candidate) => candidate.jobCode === job.jobCode);
    if (hasCandidates) {
      toast.warning('This job has linked candidates. Remove or move candidates before deleting.');
      return;
    }
    if (confirm(`Delete job ${job.jobCode}?`)) {
      setJobs((prev) => prev.filter((item) => item.id !== job.id));
      toast.success(`Job ${job.jobCode} deleted.`);
    }
  };

  const columns = [
    {
      key: 'actions',
      label: 'Actions',
      width: 180,
      disableFilter: true,
      render: (job) => (
        <div className="row-actions">
          <button type="button" className="mini-button" onClick={() => setSelectedJobCode(job.jobCode)} title="View candidates">
            <Eye size={14} /> Candidates
          </button>
          <button type="button" className="icon-button" onClick={() => { setEditingJob(job); setShowJobForm(true); }} title="Edit job">
            <Edit2 size={14} />
          </button>
          <button type="button" className="icon-button danger" onClick={() => handleDeleteJob(job)} title="Delete job">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
    { key: 'jobCode', label: 'Job Code', width: 130 },
    { key: 'project', label: 'Project', width: 170 },
    { key: 'department', label: 'Department', width: 120, filterOptions: masterData.department },
    { key: 'hcRequested', label: 'HC Requested', width: 120, align: 'right' },
    { key: 'jobTitle', label: 'Job Title', width: 190 },
    { key: 'eeLevel', label: 'EE Level', width: 140, filterOptions: masterData.eeLevel },
    { key: 'sites', label: 'Sites', width: 120 },
    { key: 'projectSegment', label: 'Project Segment', width: 170 },
    { key: 'hiringManager', label: 'Hiring Manager', width: 170 },
    { key: 'hrbp', label: 'HRBP', width: 150 },
    { key: 'recruiter', label: 'Recruiter', width: 150 },
    { key: 'myhrRequestDate', label: 'MyHR Request Date', width: 150, render: (_, value) => formatDate(value) },
    { key: 'expectedOnboardDate', label: 'Expected Onboard Date', width: 170, render: (_, value) => formatDate(value) },
    { key: 'status', label: 'Status', width: 150, filterOptions: masterData.status, render: (_, value) => <span className={statusClass(value)}>{value}</span> },
    { key: 'cvSent', label: 'CV Sent', width: 100, align: 'right' },
    { key: 'interview', label: 'Interview', width: 100, align: 'right' },
    { key: 'offered', label: 'Offered', width: 100, align: 'right' },
    { key: 'offerAccepted', label: 'Offer Accepted', width: 130, align: 'right' },
    { key: 'onboarded', label: 'Onboarded', width: 110, align: 'right' },
    { key: 'offerRejected', label: 'Offer Rejected', width: 130, align: 'right' },
    { key: 'source', label: 'Source', width: 180, filterOptions: masterData.source },
    { key: 'candidateName', label: 'Candidate Name', width: 170 },
    { key: 'onboardDate', label: 'Onboard Date', width: 130, render: (_, value) => formatDate(value) },
    { key: 'offerDate', label: 'Offer Date', width: 130, render: (_, value) => formatDate(value) },
    { key: 'note', label: 'Note', width: 260 },
  ];

  const candidateColumns = [
    { key: 'name', label: 'Candidate Name', width: 180 },
    { key: 'email', label: 'Email', width: 220 },
    { key: 'phone', label: 'Phone Number', width: 140 },
    { key: 'status', label: 'Status', width: 150, filterOptions: masterData.status, render: (_, value) => <span className={statusClass(value)}>{value}</span> },
    { key: 'source', label: 'Source', width: 180, filterOptions: masterData.source },
    { key: 'recruiter', label: 'Recruiter', width: 150 },
    { key: 'offerSentDate', label: 'Offer Sent Date', width: 140, render: (_, value) => formatDate(value) },
    { key: 'onboardingDate', label: 'Onboarding Date', width: 150, render: (_, value) => formatDate(value) },
    { key: 'note', label: 'Note', width: 260 },
  ];

  return (
    <div className="page-stack">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <section className="hero-strip">
        <div>
          <p className="eyebrow">Module 1</p>
          <h1>IDL Tracking - Job Level</h1>
          <p>Track recruitment progress per Job Code. Pipeline metrics are calculated from Candidate Database.</p>
        </div>
        <div className="hero-actions">
          <label className="switch-label">
            <input type="checkbox" checked={autoCalculate} onChange={(event) => setAutoCalculate(event.target.checked)} />
            Auto-calc pipeline
          </label>
          <button type="button" className="excel-button primary" onClick={() => { setEditingJob(null); setShowJobForm(true); }}>
            <Plus size={16} /> Add Job
          </button>
        </div>
      </section>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading jobs from database...</p>
      ) : (
        <ExcelTable
          title="Job Tracking"
          rows={rows}
          columns={columns}
          defaultVisibleColumns={['actions', 'jobCode', 'project', 'department', 'hcRequested', 'jobTitle', 'eeLevel', 'hiringManager', 'recruiter', 'status', 'cvSent', 'interview', 'offered', 'offerAccepted', 'onboarded', 'offerRejected', 'candidateName', 'note']}
        />
      )}

      {selectedJobCode && (
        <section className="linked-panel">
          <div className="linked-panel-header">
            <div>
              <p className="eyebrow">Linked Candidate List</p>
              <h2><Users size={20} /> Candidates for {selectedJobCode}</h2>
              <p>{selectedJob?.jobTitle} - {selectedJob?.project} - {selectedCandidates.length} candidate(s)</p>
            </div>
            <button type="button" className="excel-button secondary" onClick={() => setSelectedJobCode('')}>Close</button>
          </div>
          <ExcelTable
            rows={selectedCandidates}
            columns={candidateColumns}
            title="Candidates About This Job"
            compact
            defaultVisibleColumns={['name', 'email', 'phone', 'status', 'source', 'recruiter', 'offerSentDate', 'onboardingDate', 'note']}
            emptyMessage="No candidates are linked to this Job Code yet."
          />
        </section>
      )}

      {showJobForm && (
        <JobForm
          job={editingJob}
          saving={saving}
          onSubmit={handleSaveJob}
          onClose={() => { setShowJobForm(false); setEditingJob(null); }}
        />
      )}
    </div>
  );
};