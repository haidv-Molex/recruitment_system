import React from 'react';
import InputField from '@/components/common/InputField';
import FileUploadField from '@/components/common/FileUploadField';

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Job Code"
          name="jobCode"
          value={formData.jobCode}
          onChange={handleChange}
          placeholder="Auto-generated if blank, e.g. J001"
          disabled={saving}
        />
        <InputField
          label="Project (optional)"
          name="project"
          value={formData.project}
          onChange={handleChange}
          placeholder="e.g. IDL Recruitment 2026"
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

        <FileUploadField
          label="JD File (optional)"
          fileName={formData.file ? formData.file.name : null}
          placeholder="Click to select JD file..."
          onChange={handleFileChange}
          disabled={saving}
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.png"
        />
      </div>
    </>
  );
}

