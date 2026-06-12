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
    </>
  );
}
