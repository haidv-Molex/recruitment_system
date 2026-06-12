import React from 'react';
import { Plus, FileUp, Download } from 'lucide-react';
import Button from '../common/Button';

export interface JobTrackingHeaderProps {
  onAddJob: () => void;
  onImportExcel: () => void;
  onExportIDL: () => void;
  onExportWorkbook: () => void;
  totalJobs: number;
}

export default function JobTrackingHeader({
  onAddJob,
  onImportExcel,
  onExportIDL,
  onExportWorkbook,
  totalJobs,
}: JobTrackingHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          📊 Job Tracking Sheet
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Excel-like job tracking database. Total: <span className="font-bold text-slate-700">{totalJobs}</span> job requests
        </p>
      </div>

      <div className="flex flex-wrap gap-2 w-full md:w-auto">
        <Button
          variant="secondary"
          onClick={onImportExcel}
          icon={<FileUp size={16} />}
          className="flex-1 sm:flex-none"
        >
          Import Excel
        </Button>
        <Button
          variant="secondary"
          onClick={onExportIDL}
          icon={<Download size={16} />}
          className="flex-1 sm:flex-none"
        >
          Export IDL
        </Button>
        <Button
          variant="secondary"
          onClick={onExportWorkbook}
          icon={<Download size={16} />}
          className="flex-1 sm:flex-none"
        >
          Export Workbook
        </Button>
        <Button
          onClick={onAddJob}
          icon={<Plus size={16} />}
          className="flex-1 sm:flex-none"
        >
          Add Job
        </Button>
      </div>
    </div>
  );
}
