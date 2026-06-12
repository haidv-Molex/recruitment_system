import React from 'react';
import { Plus, FileUp, Download } from 'lucide-react';
import Button from '../common/Button';

export interface DatabaseHeaderProps {
  total: number;
  onDownloadTemplate: () => void;
  onDownloadDatabase: () => void;
  onDownloadFullWorkbook: () => void;
  onBulkUpload: () => void;
  onImportExcel: () => void;
  onAddCandidate: () => void;
}

export default function DatabaseHeader({
  total,
  onDownloadTemplate,
  onDownloadDatabase,
  onDownloadFullWorkbook,
  onBulkUpload,
  onImportExcel,
  onAddCandidate,
}: DatabaseHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          👤 Candidate Database
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Main candidate records database. Total: <span className="font-bold text-slate-700">{total}</span> candidates
        </p>
      </div>

      <div className="flex flex-wrap gap-2 w-full lg:w-auto">
        <Button
          variant="secondary"
          onClick={onDownloadTemplate}
          icon={<Download size={16} />}
          className="flex-1 sm:flex-none"
        >
          Template
        </Button>
        <Button
          variant="secondary"
          onClick={onDownloadDatabase}
          icon={<Download size={16} />}
          className="flex-1 sm:flex-none"
        >
          Database
        </Button>
        <Button
          variant="secondary"
          onClick={onDownloadFullWorkbook}
          icon={<Download size={16} />}
          className="flex-1 sm:flex-none"
        >
          Workbook
        </Button>
        <Button
          variant="secondary"
          onClick={onBulkUpload}
          icon={<FileUp size={16} />}
          className="flex-1 sm:flex-none"
        >
          Bulk Upload
        </Button>
        <Button
          variant="secondary"
          onClick={onImportExcel}
          icon={<FileUp size={16} />}
          className="flex-1 sm:flex-none"
        >
          Import Excel
        </Button>
        <Button
          onClick={onAddCandidate}
          icon={<Plus size={16} />}
          className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700"
        >
          Add Candidate
        </Button>
      </div>
    </div>
  );
}
