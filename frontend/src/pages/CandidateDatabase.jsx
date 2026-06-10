import React, { useMemo, useState } from 'react';
import { Edit2, FileUp, Plus, Trash2 } from 'lucide-react';
import { CandidateForm } from '../components/CandidateForm';
import { BulkCVUpload } from '../components/BulkCVUpload';
import { ExcelTable, formatDate } from '../components/ExcelTable';
import { hasDuplicateCandidate, masterData } from '../services/mockData';

const statusClass = (status) => `status-pill status-${String(status || '').toLowerCase().replace(/\s+/g, '-')}`;

export const CandidateDatabasePage = ({ candidates, setCandidates, jobs }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const jobCodes = useMemo(() => jobs.map((job) => job.jobCode), [jobs]);
  const recruiters = useMemo(() => Array.from(new Set(candidates.map((candidate) => candidate.recruiter).filter(Boolean))), [candidates]);

  const handleSaveCandidate = (candidate) => {
    setCandidates((prev) => {
      // If candidate already exists, update it; otherwise add new
      const exists = prev.some((item) => item.id === candidate.id);
      return exists ? prev.map((item) => (item.id === candidate.id ? candidate : item)) : [...prev, candidate];
    });
    setShowForm(false);
    setEditingCandidate(null);
  };

  const duplicateError = (candidate, excludeId) => {
    // If duplicate found by email or name+phone, return error message
    if (hasDuplicateCandidate(candidate, candidates, excludeId)) {
      return 'Duplicate candidate detected. Candidate already exists by Email or Name + Phone Number.';
    }
    return '';
  };

  const handleDeleteCandidate = (candidate) => {
    // If user confirms deletion, remove candidate from list
    if (confirm(`Delete candidate ${candidate.name}?`)) {
      setCandidates((prev) => prev.filter((item) => item.id !== candidate.id));
    }
  };

  const handleBulkUpload = (fileArray) => {
    // For now, show confirmation with file count (backend integration later)
    alert(`${fileArray.length} CV file(s) uploaded successfully.\n\nNote: Files are stored in memory. Backend integration needed for permanent storage.`);
    setShowBulkUpload(false);
  };

  const columns = [
    {
      key: 'actions',
      label: 'Actions',
      width: 110,
      disableFilter: true,
      render: (candidate) => (
        <div className="row-actions">
          <button type="button" className="icon-button" onClick={() => { setEditingCandidate(candidate); setShowForm(true); }} title="Edit candidate">
            <Edit2 size={14} />
          </button>
          <button type="button" className="icon-button danger" onClick={() => handleDeleteCandidate(candidate)} title="Delete candidate">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
    { key: 'inputDate', label: 'Input Date', width: 130, render: (_, value) => formatDate(value) },
    { key: 'department', label: 'Department', width: 120, filterOptions: masterData.department },
    { key: 'name', label: 'Candidate Name', width: 190 },
    { key: 'email', label: 'Email', width: 220 },
    { key: 'phone', label: 'Phone Number', width: 150 },
    { key: 'recruiter', label: 'Recruiter', width: 150, filterOptions: recruiters },
    { key: 'jobCode', label: 'Job Code', width: 130, filterOptions: jobCodes },
    { key: 'jobTitle', label: 'Job Title', width: 190 },
    { key: 'eeLevel', label: 'EE Level', width: 140, filterOptions: masterData.eeLevel },
    { key: 'project', label: 'Project', width: 170 },
    { key: 'hiringManager', label: 'Hiring Manager', width: 170 },
    { key: 'dlIdl', label: 'DL/IDL', width: 100, filterOptions: masterData.dlIdl },
    { key: 'status', label: 'Status', width: 150, filterOptions: masterData.status, render: (_, value) => <span className={statusClass(value)}>{value}</span> },
    { key: 'onboardingDate', label: 'Onboarding Date', width: 150, render: (_, value) => formatDate(value) },
    { key: 'offerSentDate', label: 'Offer Sent Date', width: 150, render: (_, value) => formatDate(value) },
    { key: 'source', label: 'Source', width: 190, filterOptions: masterData.source },
    { key: 'employeeId', label: 'Employee ID', width: 130 },
    { key: 'referrerName', label: 'Referrer Name', width: 160 },
    { key: 'referrerDepartment', label: 'Referrer Department', width: 170, filterOptions: masterData.department },
    { key: 'note', label: 'Note', width: 260 },
    { key: 'currentSalary', label: 'Current Salary (M VND)', width: 180, align: 'right' },
    { key: 'expectedSalary', label: 'Expected Salary (M VND)', width: 180, align: 'right' },
    { key: 'candidateResultFeedbackDate', label: 'Candidate Result Feedback Date', width: 230, render: (_, value) => formatDate(value) },
    { key: 'headhuntAgency', label: 'Headhunt Agency', width: 170, filterOptions: masterData.headhuntAgency },
    { key: 'targetedCompany', label: 'Targeted Company', width: 150, render: (_, value) => (value ? 'Yes' : 'No') },
    { key: 'targetedCompanyName', label: 'Targeted Company Name', width: 210 },
  ];

  return (
    <div className="page-stack">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">Module 2</p>
          <h1>Candidate Database</h1>
          <p>Main candidate-level data source. Job Code links candidates to Job Tracking.</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="excel-button secondary" onClick={() => setShowBulkUpload(true)}>
            <FileUp size={16} /> Bulk Upload
          </button>
          <button type="button" className="excel-button primary" onClick={() => { setEditingCandidate(null); setShowForm(true); }}>
            <Plus size={16} /> Add Candidate
          </button>
        </div>
      </section>

      <ExcelTable
        title="Candidate Database"
        rows={candidates}
        columns={columns}
        defaultVisibleColumns={['actions', 'inputDate', 'department', 'name', 'email', 'phone', 'recruiter', 'jobCode', 'jobTitle', 'status', 'onboardingDate', 'offerSentDate', 'source', 'currentSalary', 'expectedSalary', 'headhuntAgency', 'note']}
      />

      {showForm && (
        <CandidateForm
          candidate={editingCandidate}
          jobs={jobs}
          duplicateError={duplicateError}
          onSubmit={handleSaveCandidate}
          onClose={() => { setShowForm(false); setEditingCandidate(null); }}
        />
      )}

      {showBulkUpload && (
        <BulkCVUpload
          onUpload={handleBulkUpload}
          onClose={() => setShowBulkUpload(false)}
        />
      )}
    </div>
  );
};