import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertTriangle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { parseJobSheetApi } from '../../services/jobApi';
import Modal from '../ui/Modal';
import Button from '../common/Button';

const STEPS = {
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  IMPORTING: 'importing',
  DONE: 'done',
};

export interface JobExcelImportProps {
  onImport: (job: any) => Promise<{ success: boolean; message?: string }>;
  onClose: () => void;
}

export default function JobExcelImport({ onImport, onClose }: JobExcelImportProps) {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsedJobs, setParsedJobs] = useState<any[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; errors: any[] }>({
    current: 0,
    total: 0,
    errors: [],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setParseError('');
  };

  const handleParse = async () => {
    if (!file) {
      setParseError('Please select an Excel file.');
      return;
    }

    try {
      const jobs = await parseJobSheetApi(file);
      if (jobs && jobs.length > 0) {
        setParsedJobs(jobs);
        setStep(STEPS.PREVIEW);
      } else {
        setParseError('No jobs found in this file. Please check the format.');
      }
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file.');
    } finally {
      setParsing(false);
    }
  };

  const handleImportAll = async () => {
    setStep(STEPS.IMPORTING);
    setImportProgress({ current: 0, total: parsedJobs.length, errors: [] });

    const errors: any[] = [];

    for (let i = 0; i < parsedJobs.length; i++) {
      setImportProgress((prev) => ({ ...prev, current: i + 1 }));

      try {
        const result = await onImport(parsedJobs[i]);
        if (!result.success) {
          errors.push({ index: i, code: parsedJobs[i].jobCode, message: result.message });
        }
      } catch (err: any) {
        errors.push({ index: i, code: parsedJobs[i].jobCode, message: err.message || 'Unknown error' });
      }
    }

    setImportProgress((prev) => ({ ...prev, errors }));
    setStep(STEPS.DONE);
  };

  const toggleRow = (index: number) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const renderTags = (items: any[], styles: string) => {
    if (!items || items.length === 0) return <span className="text-slate-300 text-xs">—</span>;
    return (
      <div className="flex gap-1 flex-wrap">
        {items.map((item, i) => (
          <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${styles}`}>
            {item.code || item.name}
            {item.id === null && <span className="bg-amber-100 text-amber-700 text-[8px] font-bold px-0.5 rounded ml-0.5">NEW</span>}
          </span>
        ))}
      </div>
    );
  };

  const countNewEntities = () => {
    let count = 0;
    parsedJobs.forEach((job) => {
      ['partners', 'departments', 'segments', 'sites', 'titles', 'managers', 'employeeLevels'].forEach((field) => {
        (job[field] || []).forEach((item: any) => {
          if (item.id === null) count++;
        });
      });
    });
    return count;
  };

  const renderTitle = () => {
    if (step === STEPS.UPLOAD) return 'Import Jobs from Excel';
    if (step === STEPS.PREVIEW) return `Preview — ${parsedJobs.length} Job(s) Found`;
    if (step === STEPS.IMPORTING) return 'Importing Jobs...';
    return 'Import Complete';
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={renderTitle()}
      maxWidthClass="max-w-4xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div>
            {step === STEPS.PREVIEW && (
              <button
                type="button"
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors bg-transparent border-none cursor-pointer"
                onClick={() => {
                  setStep(STEPS.UPLOAD);
                  setParsedJobs([]);
                }}
              >
                ← Back to Upload
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {step === STEPS.DONE ? (
              <Button onClick={onClose} icon={<Check size={16} />}>
                Done
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                {step === STEPS.UPLOAD && (
                  <Button onClick={handleParse} disabled={!file || parsing} isLoading={parsing}>
                    Parse File
                  </Button>
                )}
                {step === STEPS.PREVIEW && (
                  <Button onClick={handleImportAll}>
                    Import {parsedJobs.length} Job(s)
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* STEP 1: Upload */}
        {step === STEPS.UPLOAD && (
          <div className="space-y-4">
            <div
              onClick={() => document.getElementById('excel-file-input')?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all flex flex-col items-center justify-center"
            >
              <Upload size={36} className="text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Click to select Excel file</p>
              <p className="text-xs text-slate-400 mt-1">.xlsx, .xls, .csv supported</p>
            </div>
            <input
              id="excel-file-input"
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
            {file && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <FileSpreadsheet size={20} className="text-emerald-600" />
                <span className="flex-1 text-xs font-semibold text-blue-600 truncate">{file.name}</span>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  onClick={() => setFile(null)}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {parseError && (
              <div className="bg-red-50 text-red-600 text-xs px-3.5 py-2 rounded-lg border border-red-200">
                {parseError}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Preview */}
        {step === STEPS.PREVIEW && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/30 text-center">
                <p className="text-2xl font-bold text-blue-600">{parsedJobs.length}</p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Jobs to Import</p>
              </div>
              <div className="p-3 rounded-lg border border-amber-100 bg-amber-50/30 text-center">
                <p className="text-2xl font-bold text-amber-600">{countNewEntities()}</p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">New Entities (auto-create)</p>
              </div>
              <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/30 text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {parsedJobs.reduce((sum, j) => sum + (j.candidateRequired || 0), 0)}
                </p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Total HC Required</p>
              </div>
            </div>

            <div className="max-h-[30vh] overflow-y-auto border border-slate-200 rounded-lg bg-white">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-semibold text-slate-800 w-10">#</th>
                    <th className="p-3 font-semibold text-slate-800 w-24">Job Code</th>
                    <th className="p-3 font-semibold text-slate-800">Project</th>
                    <th className="p-3 font-semibold text-slate-800 w-16 text-center">HC</th>
                    <th className="p-3 font-semibold text-slate-800">Departments</th>
                    <th className="p-3 font-semibold text-slate-800">Sites</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedJobs.map((job, i) => (
                    <React.Fragment key={i}>
                      <tr
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                          expandedRow === i ? 'bg-slate-50' : ''
                        }`}
                        onClick={() => toggleRow(i)}
                      >
                        <td className="p-3 text-slate-400">{i + 1}</td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-600">
                            {job.jobCode}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-900">{job.project}</td>
                        <td className="p-3 text-center font-bold">{job.candidateRequired}</td>
                        <td className="p-3">
                          {renderTags(job.departments, 'bg-blue-50 border border-blue-200 text-blue-600')}
                        </td>
                        <td className="p-3">
                          {renderTags(job.sites, 'bg-emerald-50 border border-emerald-200 text-emerald-600')}
                        </td>
                        <td className="p-3 text-slate-400">
                          {expandedRow === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                      </tr>
                      {expandedRow === i && (
                        <tr>
                          <td colSpan={7} className="p-4 bg-slate-50 border-b border-slate-200">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Request Date</p>
                                <p className="text-slate-800 mt-0.5">{job.requestDate || '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Note</p>
                                <p className="text-slate-800 mt-0.5">{job.note || '—'}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Segments</p>
                                {renderTags(job.segments, 'bg-amber-50 border border-amber-200 text-amber-600')}
                              </div>
                              <div className="col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Titles</p>
                                {renderTags(job.titles, 'bg-purple-50 border border-purple-200 text-purple-600')}
                              </div>
                              <div className="col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employee Levels</p>
                                {renderTags(job.employeeLevels, 'bg-purple-50 border border-purple-200 text-purple-600')}
                              </div>
                              <div className="col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">HRBP (Partners)</p>
                                {renderTags(job.partners, 'bg-red-50 border border-red-200 text-red-600')}
                              </div>
                              <div className="col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hiring Managers</p>
                                {renderTags(job.managers, 'bg-red-50 border border-red-200 text-red-600')}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {countNewEntities() > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  <strong>{countNewEntities()} new entities</strong> will be auto-created in the system during import.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Importing */}
        {step === STEPS.IMPORTING && (
          <div className="text-center py-12 px-6 flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-6 max-w-md">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-sm text-slate-500 font-semibold mt-3">
              Importing job {importProgress.current} of {importProgress.total}...
            </p>
          </div>
        )}

        {/* STEP 4: Done */}
        {step === STEPS.DONE && (
          <div className="text-center py-12 px-6 flex flex-col items-center">
            <div className="mb-4">
              {importProgress.errors.length === 0 ? (
                <Check size={48} className="text-emerald-600" />
              ) : (
                <AlertTriangle size={48} className="text-amber-600" />
              )}
            </div>
            <p className="text-lg font-bold text-slate-900 mb-1">
              {importProgress.errors.length === 0
                ? 'All Jobs Imported Successfully!'
                : `Imported with ${importProgress.errors.length} error(s)`}
            </p>
            <p className="text-sm text-slate-500 mb-6">
              {importProgress.current - importProgress.errors.length} of {importProgress.total} jobs imported
              successfully.
            </p>
            {importProgress.errors.length > 0 && (
              <div className="w-full max-w-lg text-left max-h-[160px] overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-3">
                {importProgress.errors.map((err, i) => (
                  <div key={i} className="text-xs text-red-600 py-1">
                    ❌ <strong>{err.code}</strong>: {err.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
export { JobExcelImport };
