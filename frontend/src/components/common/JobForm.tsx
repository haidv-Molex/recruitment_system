import React, { useEffect, useState } from 'react';
import { searchDepartmentsApi } from '../../services/departmentApi';
import { searchSegmentsApi } from '../../services/segmentApi';
import { searchSitesApi } from '../../services/siteApi';
import { searchLevelsApi } from '../../services/levelApi';
import { fetchUsersApi } from '../../services/userApi';
import { FileLink, FilePreviewModal } from './FilePreview';
import Modal from '../ui/Modal';
import InputField from './InputField';
import Button from './Button';

const emptyJob = {
  jobCode: '',
  project: '',
  candidateRequired: 1,
  note: '',
  requestDate: '',
  file: null as File | null,
  departments: [] as number[],
  segments: [] as number[],
  sites: [] as number[],
  titles: [] as number[],
  employeeLevels: [] as number[],
  partners: [] as number[],
  managers: [] as number[],
};

export interface JobFormProps {
  job?: any;
  onSubmit: (data: typeof emptyJob) => void;
  onClose: () => void;
  saving: boolean;
}

export default function JobForm({ job, onSubmit, onClose, saving }: JobFormProps) {
  const [formData, setFormData] = useState(emptyJob);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [options, setOptions] = useState({
    departments: [] as any[],
    segments: [] as any[],
    sites: [] as any[],
    levels: [] as any[],
    users: [] as any[],
  });

  useEffect(() => {
    if (job) {
      setFormData({
        jobCode: job.job_code || '',
        project: job.project || '',
        candidateRequired: job.candidate_required || 1,
        note: job.note || '',
        requestDate: job.request_date ? String(job.request_date).slice(0, 10) : '',
        file: null,
        departments: Array.isArray(job.departments)
          ? job.departments.map((d: any) => (typeof d === 'object' ? d.department_id : d))
          : [],
        segments: Array.isArray(job.segments)
          ? job.segments.map((s: any) => (typeof s === 'object' ? s.segment_id : s))
          : [],
        sites: Array.isArray(job.sitesData || job.sites)
          ? (job.sitesData || (Array.isArray(job.sites) ? job.sites : [])).map((s: any) => (typeof s === 'object' ? s.site_id : s))
          : [],
        titles: Array.isArray(job.titles)
          ? job.titles.map((t: any) => (typeof t === 'object' ? t.level_id : t))
          : [],
        employeeLevels: Array.isArray(job.employee_levels)
          ? job.employee_levels.map((el: any) => (typeof el === 'object' ? el.level_id : el))
          : [],
        partners: Array.isArray(job.partners)
          ? job.partners.map((p: any) => (typeof p === 'object' ? p.user_id : p))
          : [],
        managers: Array.isArray(job.managers)
          ? job.managers.map((m: any) => (typeof m === 'object' ? m.user_id : m))
          : [],
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
    try {
      const [deptsRes, segsRes, sitesRes, levelsRes, usersRes] = await Promise.all([
        searchDepartmentsApi({ page: 1, limit: 100 }),
        searchSegmentsApi({ page: 1, limit: 100 }),
        searchSitesApi({ page: 1, limit: 100 }),
        searchLevelsApi({ page: 1, limit: 100 }),
        fetchUsersApi({ page: 1, limit: 100 }),
      ]);

      setOptions({
        departments: deptsRes.data || [],
        segments: segsRes.data || [],
        sites: sitesRes.data || [],
        levels: levelsRes.data || [],
        users: usersRes.data || [],
      });
    } catch (err) {
      console.error('Failed to load form options', err);
    }
    setLoadingOptions(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'candidateRequired' ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  const toggleSelection = (field: keyof typeof emptyJob, id: number) => {
    setFormData((prev: any) => {
      const current = prev[field] as number[];
      const updated = current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id];
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.jobCode.trim()) {
      setError('Job Code is required.');
      return;
    }

    if (!formData.project.trim()) {
      setError('Project is required.');
      return;
    }

    if (!formData.candidateRequired || formData.candidateRequired < 1) {
      setError('Candidate Required must be at least 1.');
      return;
    }

    onSubmit(formData);
  };

  const renderCheckboxGroup = (label: string, field: keyof typeof emptyJob, items: any[], displayFn: (item: any) => string, keyProp: string) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto px-3.5 py-2.5 border border-slate-300 rounded-lg bg-slate-50/50">
        {items.length === 0 ? (
          <span className="text-xs text-slate-400">No options available</span>
        ) : (
          items.map((item) => {
            const id = item[keyProp];
            return (
              <label key={id} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={(formData[field] as number[]).includes(id)}
                  onChange={() => toggleSelection(field, id)}
                  disabled={saving}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span>{displayFn(item)}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={job ? 'Edit Job Requisition' : 'Add Job Requisition'}
      maxWidthClass="max-w-4xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={saving}>
            {saving ? 'Saving...' : job ? 'Save Job' : 'Create Job'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-xs px-3.5 py-2 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {loadingOptions && (
          <p className="text-xs text-slate-400">Loading options from server...</p>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Job Code *"
            name="jobCode"
            value={formData.jobCode}
            onChange={handleChange}
            placeholder="e.g. JOB-001"
            disabled={saving}
          />
          <InputField
            label="Project *"
            name="project"
            value={formData.project}
            onChange={handleChange}
            placeholder="e.g. IDL Recruitment 2026"
            disabled={saving}
          />
          <InputField
            label="Candidate Required *"
            type="number"
            min="1"
            name="candidateRequired"
            value={formData.candidateRequired}
            onChange={handleChange}
            disabled={saving}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Request Date"
            type="date"
            name="requestDate"
            value={formData.requestDate}
            onChange={handleChange}
            disabled={saving}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">JD File (optional)</label>
            {job?.file && (
              <FileLink file={job.file} onClick={() => setPreviewFile(job.file)} />
            )}
            <input
              type="file"
              onChange={handleFileChange}
              disabled={saving}
              accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.png"
              className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
            {formData.file && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                New: {formData.file.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">Note</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows={2}
            disabled={saving}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          />
        </div>

        {/* Linking Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {renderCheckboxGroup('🏬 Departments', 'departments', options.departments, (d) => `${d.department_code} — ${d.department_name}`, 'department_id')}
          {renderCheckboxGroup('📦 Segments', 'segments', options.segments, (s) => `${s.segment_code} — ${s.segment_name}`, 'segment_id')}
          {renderCheckboxGroup('📍 Sites', 'sites', options.sites, (s) => `${s.site_code} — ${s.site_name}`, 'site_id')}
          {renderCheckboxGroup('🏅 Titles (Job Level)', 'titles', options.levels, (l) => `${l.level_code} — ${l.level_name}`, 'level_id')}
          {renderCheckboxGroup('🏅 Employee Levels', 'employeeLevels', options.levels, (l) => `${l.level_code} — ${l.level_name}`, 'level_id')}
          {renderCheckboxGroup('👤 HRBP (Partners)', 'partners', options.users, (u) => `${u.user_name} (${u.user_role})`, 'user_id')}
          {renderCheckboxGroup('👔 Hiring Managers', 'managers', options.users, (u) => `${u.user_name} (${u.user_role})`, 'user_id')}
        </div>
      </form>
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
    </Modal>
  );
}
export { JobForm };
