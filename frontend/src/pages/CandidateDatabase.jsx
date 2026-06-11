import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, FileUp, Plus, Trash2 } from 'lucide-react';
import { CandidateForm } from '../components/CandidateForm';
import { BulkCVUpload } from '../components/BulkCVUpload';
import { ExcelTable, formatDate } from '../components/ExcelTable';
import { masterData } from '../services/mockData';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { createCandidateApi, searchCandidatesApi, deleteCandidateApi } from '../services/candidateApi';

const statusClass = (status) => `status-pill status-${String(status || '').toLowerCase().replace(/\s+/g, '-')}`;

// Map API candidate to table row format
const mapCandidateToRow = (c) => ({
  id: c.id,
  candidateCode: c.code,
  inputDate: c.createdAt ? c.createdAt.slice(0, 10) : '',
  name: c.name,
  email: c.email,
  phone: c.phone,
  recruiter: c.recruiter?.name || '',
  jobCode: c.job?.code || '',
  jobTitle: '',
  department: '',
  eeLevel: '',
  project: c.job?.project || '',
  hiringManager: '',
  dlIdl: 'IDL',
  status: c.status,
  onboardingDate: c.onboardDate ? c.onboardDate.slice(0, 10) : '',
  offerSentDate: c.offerDate ? c.offerDate.slice(0, 10) : '',
  source: c.platform?.name || '',
  employeeId: '',
  referrerName: c.reference?.name || '',
  referrerDepartment: '',
  note: c.note,
  currentSalary: c.currentSalary,
  expectedSalary: c.expectedSalary,
  candidateResultFeedbackDate: c.feedbackDate ? c.feedbackDate.slice(0, 10) : '',
  headhuntAgency: c.agency,
  targetedCompany: !!c.targetedCompany,
  targetedCompanyName: c.targetedCompany?.name || '',
  // Keep API data for editing
  _apiData: c,
});

export const CandidateDatabasePage = ({ candidates, setCandidates, jobs }) => {
  const { toasts, removeToast, toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const jobCodes = useMemo(() => jobs.map((job) => job.jobCode), [jobs]);
  const recruiters = useMemo(() => Array.from(new Set(candidates.map((c) => c.recruiter).filter(Boolean))), [candidates]);

  // Load candidates from API on mount
  const loadCandidatesFromApi = useCallback(async () => {
    setLoading(true);
    const result = await searchCandidatesApi({ page: 1, limit: 100 });

    if (result.success && result.candidates.length > 0) {
      setCandidates(result.candidates.map(mapCandidateToRow));
    }

    setLoading(false);
  }, [setCandidates]);

  useEffect(() => {
    loadCandidatesFromApi();
  }, []);

  const handleSaveCandidate = async (formData) => {
    setSaving(true);

    // If editing, local update for now (TODO: update API)
    if (editingCandidate) {
      setCandidates((prev) =>
        prev.map((item) =>
          item.id === editingCandidate.id
            ? { ...item, name: formData.candidateName, email: formData.candidateEmail, phone: formData.candidatePhone, note: formData.note, status: formData.status }
            : item
        )
      );
      toast.success('Candidate updated (local).');
      setShowForm(false);
      setEditingCandidate(null);
      setSaving(false);
      return;
    }

    // Call API to create new candidate
    const result = await createCandidateApi(formData);

    if (result.success) {
      toast.success(result.message || 'Candidate created successfully.');
      setShowForm(false);
      // Reload from API to get fresh data
      await loadCandidatesFromApi();
    } else {
      toast.error(result.message);
    }

    setSaving(false);
  };

  const handleDeleteCandidate = async (candidate) => {
    if (!confirm(`Delete candidate ${candidate.name}?`)) return;

    const result = await deleteCandidateApi(candidate.id);

    if (result.success) {
      toast.success(result.message || 'Candidate deleted.');
      await loadCandidatesFromApi();
    } else {
      // If API not available, delete locally
      setCandidates((prev) => prev.filter((item) => item.id !== candidate.id));
      toast.warning('Deleted locally (API not available).');
    }
  };

  const handleBulkUpload = (fileArray) => {
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
    { key: 'candidateCode', label: 'Code', width: 140 },
    { key: 'inputDate', label: 'Input Date', width: 130, render: (_, value) => formatDate(value) },
    { key: 'name', label: 'Candidate Name', width: 190 },
    { key: 'email', label: 'Email', width: 220 },
    { key: 'phone', label: 'Phone Number', width: 150 },
    { key: 'recruiter', label: 'Recruiter', width: 150, filterOptions: recruiters },
    { key: 'jobCode', label: 'Job Code', width: 130, filterOptions: jobCodes },
    { key: 'project', label: 'Project', width: 170 },
    { key: 'status', label: 'Status', width: 150, filterOptions: masterData.status, render: (_, value) => <span className={statusClass(value)}>{value}</span> },
    { key: 'onboardingDate', label: 'Onboarding Date', width: 150, render: (_, value) => formatDate(value) },
    { key: 'offerSentDate', label: 'Offer Sent Date', width: 150, render: (_, value) => formatDate(value) },
    { key: 'source', label: 'Source', width: 190 },
    { key: 'currentSalary', label: 'Current Salary', width: 150 },
    { key: 'expectedSalary', label: 'Expected Salary', width: 150 },
    { key: 'headhuntAgency', label: 'Agency', width: 170 },
    { key: 'targetedCompanyName', label: 'Targeted Company', width: 180 },
    { key: 'referrerName', label: 'Reference', width: 160 },
    { key: 'note', label: 'Note', width: 260 },
  ];

  return (
    <div className="page-stack">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <section className="hero-strip">
        <div>
          <p className="eyebrow">Module 2</p>
          <h1>Candidate Database</h1>
          <p>Main candidate-level data source. Linked to Jobs via Job Code.</p>
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

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading candidates from database...</p>
      ) : (
        <ExcelTable
          title="Candidate Database"
          rows={candidates}
          columns={columns}
          defaultVisibleColumns={['actions', 'candidateCode', 'inputDate', 'name', 'email', 'phone', 'recruiter', 'jobCode', 'status', 'onboardingDate', 'offerSentDate', 'source', 'currentSalary', 'expectedSalary', 'note']}
        />
      )}

      {showForm && (
        <CandidateForm
          candidate={editingCandidate?._apiData || (editingCandidate?.id ? editingCandidate : null)}
          saving={saving}
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