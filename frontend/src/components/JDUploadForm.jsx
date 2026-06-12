import React, { useRef, useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { sitesList, fileToBase64 } from '../services/jdData';
import { masterData } from '../services/mockData';

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

export const JDUploadForm = ({ jobs, onSubmit, onClose }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    jobTitle: '',
    jobCode: '',
    sites: '',
    department: '',
    note: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const isValidFile = (f) => {
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
  };

  const handleFile = (f) => {
    // If file extension is not supported, show error
    if (!isValidFile(f)) {
      setError('Only PDF, DOCX, DOC files are supported.');
      return;
    }
    setFile(f);
    setError('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    // If a file was dropped, process it
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    // If a file was selected via input, process it
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // If job code changed and a matching job exists, auto-fill job title and department
      if (name === 'jobCode' && value) {
        const job = jobs.find((j) => j.jobCode === value);
        if (job) {
          next.jobTitle = job.jobTitle;
          next.department = job.department;
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // If no file selected, show error
    if (!file) {
      setError('Please select a JD file.');
      return;
    }

    // If job title is empty, show error
    if (!formData.jobTitle.trim()) {
      setError('Job Title is required.');
      return;
    }

    // If sites is not selected, show error
    if (!formData.sites) {
      setError('Please select a Site.');
      return;
    }

    // If department is not selected, show error
    if (!formData.department) {
      setError('Please select a Department.');
      return;
    }

    setSaving(true);

    try {
      const base64 = await fileToBase64(file);
      const ext = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase();

      const jdEntry = {
        id: `jd-${Date.now()}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: ext,
        fileData: base64,
        jobTitle: formData.jobTitle.trim(),
        jobCode: formData.jobCode,
        sites: formData.sites,
        department: formData.department,
        note: formData.note.trim(),
        uploadedDate: new Date().toISOString().slice(0, 10),
      };

      onSubmit(jdEntry);
    } catch (err) {
      setError('Failed to read file. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const s = {
    backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' },
    modal: { background: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '540px', overflow: 'hidden' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' },
    headerTitle: { fontSize: '17px', fontWeight: 700, color: '#1e293b', margin: 0 },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' },
    body: { padding: '24px' },
    dropzone: (dragging, hasFile) => ({ border: `2px dashed ${hasFile ? '#22c55e' : dragging ? '#3b82f6' : '#cbd5e1'}`, borderRadius: '10px', padding: '24px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: hasFile ? '#f0fdf4' : dragging ? '#eff6ff' : '#f8fafc', marginBottom: '18px' }),
    dropTitle: { fontWeight: 600, fontSize: '14px', margin: '6px 0 0', color: '#334155' },
    dropSub: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' },
    fileInfo: { display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: '#16a34a', fontSize: '14px', fontWeight: 500 },
    fieldGroup: { marginBottom: '16px' },
    label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
    input: { width: '100%', padding: '9px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' },
    select: { width: '100%', padding: '9px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', background: '#fff' },
    textarea: { width: '100%', padding: '9px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
    error: { background: '#fef2f2', color: '#dc2626', fontSize: '13px', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #fecaca' },
    row: { display: 'flex', gap: '12px' },
    half: { flex: 1 },
    footer: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' },
    cancelBtn: { padding: '8px 20px', fontSize: '14px', fontWeight: 600, color: '#374151', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' },
    saveBtn: (disabled) => ({ padding: '8px 20px', fontSize: '14px', fontWeight: 600, color: '#fff', background: disabled ? '#93c5fd' : '#2563eb', border: 'none', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer' }),
  };

  return (
    <div style={s.backdrop}>
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.headerTitle}>📄 Upload Job Description</h2>
          <button type="button" style={s.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.body}>
            {error && <div style={s.error}>{error}</div>}

            {/* Dropzone */}
            <div
              style={s.dropzone(isDragging, !!file)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {/* If a file has been selected, show its name; otherwise show upload prompt */}
              {file ? (
                <div style={s.fileInfo}>
                  <FileText size={20} />
                  <span>{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload size={24} style={{ color: '#94a3b8', margin: '0 auto' }} />
                  <p style={s.dropTitle}>Drag & drop JD file here</p>
                  <p style={s.dropSub}>or click to select — PDF, DOCX, DOC</p>
                </>
              )}
            </div>

            {/* Job Title + Job Code */}
            <div style={s.row}>
              <div style={{ ...s.fieldGroup, ...s.half }}>
                <label style={s.label}>Job Title *</label>
                <input
                  style={s.input}
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="e.g. Production Engineer"
                />
              </div>
              <div style={{ ...s.fieldGroup, ...s.half }}>
                <label style={s.label}>Job Code</label>
                <select style={s.select} name="jobCode" value={formData.jobCode} onChange={handleChange}>
                  <option value="">None</option>
                  {/* Loop through jobs to render job code options */}
                  {jobs.map((j) => (
                    <option key={j.jobCode} value={j.jobCode}>{j.jobCode} — {j.jobTitle}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sites + Department */}
            <div style={s.row}>
              <div style={{ ...s.fieldGroup, ...s.half }}>
                <label style={s.label}>Sites *</label>
                <select style={s.select} name="sites" value={formData.sites} onChange={handleChange}>
                  <option value="">Select Site</option>
                  {/* Loop through sites to render dropdown options */}
                  {sitesList.map((site) => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
              </div>
              <div style={{ ...s.fieldGroup, ...s.half }}>
                <label style={s.label}>Department *</label>
                <select style={s.select} name="department" value={formData.department} onChange={handleChange}>
                  <option value="">Select Department</option>
                  {/* Loop through departments to render dropdown options */}
                  {masterData.department.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Note</label>
              <textarea
                style={s.textarea}
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={2}
                placeholder="Optional note about this JD"
              />
            </div>
          </div>

          <div style={s.footer}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={s.saveBtn(saving)} disabled={saving}>
              {saving ? 'Saving...' : 'Upload JD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};