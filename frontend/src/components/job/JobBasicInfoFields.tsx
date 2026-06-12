import React from 'react';
import InputField from '../common/InputField';
import { FileLink } from '../common/FilePreview';

interface JobBasicInfoFieldsProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saving: boolean;
  job?: any;
  setPreviewFile: (file: any) => void;
}

export default function JobBasicInfoFields({
  formData,
  handleChange,
  handleFileChange,
  saving,
  job,
  setPreviewFile,
}: JobBasicInfoFieldsProps) {
  return (
    <>
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
          <label className="flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 hover:border-emerald-500 transition-colors bg-white h-10 w-full">
            <span className="text-xs text-slate-500 truncate max-w-[70%]">
              {formData.file ? formData.file.name : 'Click to select JD file...'}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Browse
            </span>
            <input
              type="file"
              onChange={handleFileChange}
              disabled={saving}
              accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.png"
              className="hidden"
            />
          </label>
        </div>
      </div>
    </>
  );
}
