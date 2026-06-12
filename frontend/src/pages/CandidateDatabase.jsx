import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, FileUp, Plus, Trash2 } from 'lucide-react';
import { CandidateForm } from '../components/CandidateForm';
import { BulkCVUpload } from '../components/BulkCVUpload';
import { ExcelTable, formatDate } from '../components/ExcelTable';
import { masterData } from '../services/mockData';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { createCandidateApi, createCandidateExtendedApi, searchCandidatesApi, deleteCandidateApi, updateCandidateApi } from '../services/candidateApi';
import { FileBadge, FilePreviewModal } from '../components/FilePreview';
import { CandidateExcelImport } from '../components/CandidateExcelImport';

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
  file: c.file || null,
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
  const [previewFile, setPreviewFile] = useState(null);
  const [showExcelImport, setShowExcelImport] = useState(false);

  const jobCodes = useMemo(() => Array.from(new Set(jobs.map((job) => job.jobCode).filter(Boolean))), [jobs]);
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

  // Save candidate (create or update)
  const handleSaveCandidate = async (formData) => {
    setSaving(true);

    // If editing, call update API
    if (editingCandidate) {
      const result = await updateCandidateApi(editingCandidate.id, formData);

      if (result.success) {
        toast.success(result.message || 'Candidate updated successfully.');
        setShowForm(false);
        setEditingCandidate(null);
        await loadCandidatesFromApi();
      } else {
        toast.error(result.message);
      }

      setSaving(false);
      return;
    }

    // Call API to create new candidate
    const result = await createCandidateApi(formData);

    if (result.success) {
      toast.success(result.message || 'Candidate created successfully.');
      setShowForm(false);
      await loadCandidatesFromApi();
    } else {
      toast.error(result.message);
    }

    setSaving(false);
  };

  // Delete candidate
  const handleDeleteCandidate = async (candidate) => {
    if (!confirm(`Delete candidate ${candidate.name}?`)) return;

    const result = await deleteCandidateApi(candidate.id);

    if (result.success) {
      toast.success(result.message || 'Candidate deleted.');
      await loadCandidatesFromApi();
    } else {
      toast.error(result.message);
    }
  };

  // Bulk CV upload (legacy)
  const handleBulkUpload = (fileArray) => {
    alert(`${fileArray.length} CV file(s) uploaded successfully.\n\nNote: Files are stored in memory. Backend integration needed for permanent storage.`);
    setShowBulkUpload(false);
  };

  // Import a single parsed candidate from Excel (use extended API)
  const handleImportCandidate = async (parsedCandidate) => {
    // Validate email before sending — skip invalid emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmail = parsedCandidate.candidateEmail && emailRegex.test(parsedCandidate.candidateEmail)
      ? parsedCandidate.candidateEmail
      : '';

    const formData = {
      candidateCode: '',
      candidateName: parsedCandidate.candidateName,
      candidateEmail: validEmail,
      candidatePhone: parsedCandidate.candidatePhone,
      agency: parsedCandidate.agency,
      offerDate: parsedCandidate.offerDate,
      onboardDate: parsedCandidate.onboardDate,
      expectedOnboardDate: '',
      feedbackDate: parsedCandidate.feedbackDate,
      currentSalary: parsedCandidate.currentSalary,
      expectedSalary: parsedCandidate.expectedSalary,
      status: parsedCandidate.status,
      note: parsedCandidate.note,
      file: null,
      platformId: '',
      recruiterId: parsedCandidate.recruiter?.id || '',
      jobId: '',
      targetedCompanyId: '',
      referenceId: '',
      platformName: parsedCandidate.source || '',
      recruiterName: parsedCandidate.recruiter?.id === null ? parsedCandidate.recruiter.name : '',
      targetedCompanyName: parsedCandidate.targetedCompany === 'Yes' ? parsedCandidate.targetedCompanyName : '',
      referenceName: parsedCandidate.referenceName || '',
    };

    return await createCandidateExtendedApi(formData);
  };

  const handleExcelImportClose = () => {
    setShowExcelImport(false);
    loadCandidatesFromApi();
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
    {
      key: 'file',
      label: 'CV File',
      width: 160,
      disableFilter: true,
      render: (candidate) => (
        <FileBadge
          file={candidate.file}
          onClick={() => setPreviewFile(candidate.file)}
        />
      ),
    },
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
          <button type="button" className="excel-button secondary" onClick={() => setShowExcelImport(true)}>
            <FileUp size={16} /> Import Excel
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
          defaultVisibleColumns={['actions', 'candidateCode', 'file', 'inputDate', 'name', 'email', 'phone', 'recruiter', 'jobCode', 'status', 'onboardingDate', 'offerSentDate', 'source', 'currentSalary', 'expectedSalary', 'note']}
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

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* Excel Import Modal */}
      {showExcelImport && (
        <CandidateExcelImport
          onImport={handleImportCandidate}
          onClose={handleExcelImportClose}
        />
      )}
    </div>
  );
};