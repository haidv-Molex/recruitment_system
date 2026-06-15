import React, { useRef, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { sitesList, fileToBase64 } from '@/services/jdData';
import { masterData } from '@/services/mockData';
import Modal from '@/components/ui/Modal';
import InputField from '@/components/common/InputField';
import SelectField from '@/components/common/SelectField';
import Button from '@/components/common/Button';

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

export interface JDUploadFormProps {
  jobs: any[];
  onSubmit: (jdEntry: any) => void;
  onClose: () => void;
}

export default function JDUploadForm({ jobs, onSubmit, onClose }: JDUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
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
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidFile = (f: File) => {
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
  };

  const handleFile = (f: File) => {
    if (!isValidFile(f)) {
      setError('Only PDF, DOCX, DOC files are supported.');
      return;
    }
    setFile(f);
    setError('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a JD file.');
      return;
    }

    if (!formData.jobTitle.trim()) {
      setError('Job Title is required.');
      return;
    }

    if (!formData.sites) {
      setError('Please select a Site.');
      return;
    }

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

  const jobOptions = [
    { value: '', label: 'None' },
    ...jobs.map((j) => ({ value: j.jobCode, label: `${j.jobCode} — ${j.jobTitle}` })),
  ];

  const siteOptions = [
    { value: '', label: 'Select Site' },
    ...sitesList.map((site: string) => ({ value: site, label: site })),
  ];

  const deptOptions = [
    { value: '', label: 'Select Department' },
    ...masterData.department.map((dept: string) => ({ value: dept, label: dept })),
  ];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="📄 Upload Job Description"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={saving}>
            {saving ? 'Saving...' : 'Upload JD'}
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

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            file
              ? 'border-emerald-300 bg-emerald-50/30'
              : isDragging
              ? 'border-blue-400 bg-blue-50/30'
              : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center gap-2 justify-center text-emerald-600 text-sm font-semibold">
              <FileText size={20} />
              <span>{file.name}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload size={24} className="text-slate-400 mb-1.5" />
              <p className="text-sm font-semibold text-slate-700">Drag & drop JD file here</p>
              <p className="text-xs text-slate-400 mt-1">or click to select — PDF, DOCX, DOC</p>
            </div>
          )}
        </div>

        {/* Job Title + Job Code */}
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Job Title *"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleChange}
            placeholder="e.g. Production Engineer"
            disabled={saving}
          />
          <SelectField
            label="Job Code"
            name="jobCode"
            value={formData.jobCode}
            onChange={handleChange}
            options={jobOptions}
            disabled={saving}
          />
        </div>

        {/* Sites + Department */}
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Sites *"
            name="sites"
            value={formData.sites}
            onChange={handleChange}
            options={siteOptions}
            disabled={saving}
          />
          <SelectField
            label="Department *"
            name="department"
            value={formData.department}
            onChange={handleChange}
            options={deptOptions}
            disabled={saving}
          />
        </div>

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">Note</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows={2}
            placeholder="Optional note about this JD"
            disabled={saving}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          />
        </div>
      </form>
    </Modal>
  );
}
