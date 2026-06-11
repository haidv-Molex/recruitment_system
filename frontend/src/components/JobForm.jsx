import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { searchDepartmentsApi } from '../services/departmentApi';
import { searchSegmentsApi } from '../services/segmentApi';
import { searchSitesApi } from '../services/siteApi';
import { searchLevelsApi } from '../services/levelApi';
import { fetchUsersApi } from '../services/userApi';

const emptyJob = {
  jobCode: '',
  project: '',
  candidateRequired: 1,
  note: '',
  file: null,
  // Multi-select IDs
  departments: [],
  segments: [],
  sites: [],
  titles: [],
  employeeLevels: [],
  partners: [],
  managers: [],
};

export const JobForm = ({ job, onSubmit, onClose, saving }) => {
  const [formData, setFormData] = useState(emptyJob);
  const [error, setError] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Dropdown options from APIs
  const [options, setOptions] = useState({
    departments: [],
    segments: [],
    sites: [],
    levels: [],
    users: [],
  });

  useEffect(() => {
    // If editing, populate form with job data; otherwise reset
    if (job) {
      setFormData({
        jobCode: job.code || job.jobCode || '',
        project: job.project || '',
        candidateRequired: job.candidateRequired || job.hcRequested || 1,
        note: job.note || '',
        file: null,
        departments: job.departments?.map((d) => d.id) || [],
        segments: job.segments?.map((s) => s.id) || [],
        sites: job.sites?.map((s) => s.id) || [],
        titles: job.titles?.map((t) => t.id) || [],
        employeeLevels: job.employeeLevels?.map((el) => el.id) || [],
        partners: job.partners?.map((p) => p.id) || [],
        managers: job.managers?.map((m) => m.id) || [],
      });
    } else {
      setFormData(emptyJob);
    }
  }, [job]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    setLoadingOptions(true);

    const [deptsRes, segsRes, sitesRes, levelsRes, usersRes] = await Promise.all([
      searchDepartmentsApi({ page: 1, limit: 100 }),
      searchSegmentsApi({ page: 1, limit: 100 }),
      searchSitesApi({ page: 1, limit: 100 }),
      searchLevelsApi({ page: 1, limit: 100 }),
      fetchUsersApi(),
    ]);

    setOptions({
      departments: deptsRes.success ? deptsRes.departments : [],
      segments: segsRes.success ? segsRes.segments : [],
      sites: sitesRes.success ? sitesRes.sites : [],
      levels: levelsRes.success ? levelsRes.levels : [],
      users: usersRes.success ? usersRes.users : [],
    });

    setLoadingOptions(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'candidateRequired' ? Number(value) : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  // Toggle checkbox for multi-select fields
  const toggleSelection = (field, id) => {
    setFormData((prev) => {
      const current = prev[field];
      // If already selected, remove; otherwise add
      if (current.includes(id)) {
        return { ...prev, [field]: current.filter((v) => v !== id) };
      }
      return { ...prev, [field]: [...current, id] };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // If job code is empty, show error
    if (!formData.jobCode.trim()) {
      setError('Job Code is required.');
      return;
    }

    // If project is empty, show error
    if (!formData.project.trim()) {
      setError('Project is required.');
      return;
    }

    // If candidate required is less than 1, show error
    if (!formData.candidateRequired || formData.candidateRequired < 1) {
      setError('Candidate Required must be at least 1.');
      return;
    }

    onSubmit(formData);
  };

  // Render checkbox group for multi-select
  const renderCheckboxGroup = (label, field, items, displayFn) => (
    <div className="form-field-group">
      <label className="form-field-label">{label}</label>
      <div style={styles.checkboxGroup}>
        {items.length === 0 ? (
          <span style={styles.hint}>No options available</span>
        ) : (
          items.map((item) => (
            <label key={item.id} style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData[field].includes(item.id)}
                onChange={() => toggleSelection(field, item.id)}
                disabled={saving}
              />
              <span>{displayFn(item)}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );

  const styles = {
    checkboxGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      maxHeight: '120px',
      overflowY: 'auto',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      background: '#fafafa',
      fontSize: '13px',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      color: '#334155',
      cursor: 'pointer',
    },
    hint: {
      fontSize: '12px',
      color: '#94a3b8',
    },
    sectionTitle: {
      fontSize: '13px',
      fontWeight: 700,
      color: '#1e293b',
      margin: '16px 0 8px',
      paddingBottom: '4px',
      borderBottom: '1px solid #e2e8f0',
    },
    fileInput: {
      width: '100%',
      padding: '6px',
      fontSize: '13px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      background: '#fff',
    },
  };

  return (
    <div className="modal-backdrop">
      <div className="excel-modal wide" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2>{job ? 'Edit Job Requisition' : 'Add Job Requisition'}</h2>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="excel-form" style={{ overflowY: 'auto', flex: 1 }}>
          {error && <div className="form-error">{error}</div>}
          {loadingOptions && <p style={styles.hint}>Loading options from server...</p>}

          {/* ═══ Basic Info ═══ */}
          <div className="form-grid three">
            <label>
              Job Code *
              <input name="jobCode" value={formData.jobCode} onChange={handleChange} placeholder="e.g. JOB-001" disabled={saving} />
            </label>
            <label>
              Project *
              <input name="project" value={formData.project} onChange={handleChange} placeholder="e.g. IDL Recruitment 2026" disabled={saving} />
            </label>
            <label>
              Candidate Required *
              <input type="number" min="1" name="candidateRequired" value={formData.candidateRequired} onChange={handleChange} disabled={saving} />
            </label>
          </div>

          <label>
            Note
            <textarea name="note" value={formData.note} onChange={handleChange} rows={2} disabled={saving} />
          </label>

          <label>
            JD File (optional)
            <input style={styles.fileInput} type="file" onChange={handleFileChange} disabled={saving} accept=".pdf,.doc,.docx" />
          </label>

          {/* ═══ Linking Sections ═══ */}
          <p style={styles.sectionTitle}>🏬 Departments</p>
          {renderCheckboxGroup('', 'departments', options.departments, (d) => `${d.code} — ${d.name}`)}

          <p style={styles.sectionTitle}>📦 Segments</p>
          {renderCheckboxGroup('', 'segments', options.segments, (s) => `${s.code} — ${s.name}`)}

          <p style={styles.sectionTitle}>📍 Sites</p>
          {renderCheckboxGroup('', 'sites', options.sites, (s) => `${s.code} — ${s.name}`)}

          <p style={styles.sectionTitle}>🏅 Titles (Job Level)</p>
          {renderCheckboxGroup('', 'titles', options.levels, (l) => `${l.code} — ${l.name}`)}

          <p style={styles.sectionTitle}>🏅 Employee Levels</p>
          {renderCheckboxGroup('', 'employeeLevels', options.levels, (l) => `${l.code} — ${l.name}`)}

          <p style={styles.sectionTitle}>👤 HRBP (Partners)</p>
          {renderCheckboxGroup('', 'partners', options.users, (u) => `${u.displayName} (${u.role})`)}

          <p style={styles.sectionTitle}>👔 Hiring Managers</p>
          {renderCheckboxGroup('', 'managers', options.users, (u) => `${u.displayName} (${u.role})`)}

          <div className="modal-actions">
            <button type="button" className="excel-button secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="excel-button primary" disabled={saving}>
              {saving ? 'Saving...' : (job ? 'Save Job' : 'Create Job')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};