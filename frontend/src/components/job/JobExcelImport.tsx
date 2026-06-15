import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertTriangle, Loader2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { parseJobSheetApi } from '../../services/jobApi';
import Modal from '../ui/Modal';
import Button from '../common/Button';
import ExcelImportTable from '../ui/ExcelImportTable';


const STEPS = {
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  IMPORTING: 'importing',
  DONE: 'done',
};

export interface JobExcelImportProps {
  onImportBatch: (jobs: any[]) => Promise<{ success: boolean; importedCount: number; errors: any[] }>;
  onClose: () => void;
}

export default function JobExcelImport({ onImportBatch, onClose }: JobExcelImportProps) {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsedJobs, setParsedJobs] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; errors: any[] }>({
    current: 0,
    total: 0,
    errors: [],
  });
  const [isDragging, setIsDragging] = useState(false);

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

    setParsing(true);
    setParseError('');

    try {
      const jobs = await parseJobSheetApi(file);
      if (jobs && jobs.length > 0) {
        // Map keys from snake_case (backend) to camelCase (expected by frontend JobExcelImport)
        const mappedJobs = jobs.map((j: any) => ({
          jobCode: j.job_code || '',
          project: j.project || '',
          candidateRequired: (j.departments || []).reduce((sum: number, d: any) => sum + (d.candidate_required || 0), 0),
          note: j.note || '',
          requestDate: j.request_date ? String(j.request_date).slice(0, 10) : '',
          file: j.file || null,
          partners: j.partners || [],
          departments: j.departments || [],
          segments: j.segments || [],
          sites: j.sites || [],
          titles: j.titles || [],
          managers: j.managers || [],
          employeeLevels: j.employee_levels || []
        }));
        setParsedJobs(mappedJobs);
        setSelectedIndices(new Set(mappedJobs.map((_, i) => i)));
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

  const handleImportSelected = async () => {
    const indicesToImport = Array.from(selectedIndices);
    if (indicesToImport.length === 0) {
      alert('Please select at least one job to import.');
      return;
    }

    setStep(STEPS.IMPORTING);
    setImportProgress({ current: 0, total: indicesToImport.length, errors: [] });

    const selectedJobs = indicesToImport.map(idx => parsedJobs[idx]);

    try {
      const result = await onImportBatch(selectedJobs);
      setImportProgress({
        current: result.importedCount + result.errors.length,
        total: selectedJobs.length,
        errors: result.errors.map(err => ({
          code: err.job_code,
          message: err.message
        }))
      });
    } catch (err: any) {
      setImportProgress({
        current: 0,
        total: selectedJobs.length,
        errors: [{ code: 'Batch Error', message: err.message || 'Import failed' }]
      });
    }

    setStep(STEPS.DONE);
  };

  const handleCellChange = (index: number, field: string, val: string) => {
    setParsedJobs((prev) => {
      const updated = [...prev];
      const job = { ...updated[index] };

      if (field === 'jobCode') {
        job.jobCode = val;
      } else if (field === 'project') {
        job.project = val;
      } else if (field === 'candidateRequired') {
        job.candidateRequired = parseInt(val, 10) || 0;
      } else if (field === 'note') {
        job.note = val;
      } else if (field === 'requestDate') {
        job.requestDate = val;
      } else {
        // For array relationships, split by comma and recreate array format with id: null for new ones
        const parts = val.split(',').map(p => p.trim()).filter(Boolean);
        if (field === 'departments') {
          job.departments = parts.map(p => ({ department_id: null, department_name: p }));
        } else if (field === 'sites') {
          job.sites = parts.map(p => ({ site_id: null, site_name: p }));
        } else if (field === 'segments') {
          job.segments = parts.map(p => ({ segment_id: null, segment_name: p }));
        } else if (field === 'titles') {
          job.titles = parts.map(p => ({ level_id: null, level_name: p }));
        } else if (field === 'employeeLevels') {
          job.employeeLevels = parts.map(p => ({ level_id: null, level_name: p }));
        } else if (field === 'managers') {
          job.managers = parts.map(p => ({ user_id: null, user_name: p }));
        } else if (field === 'partners') {
          job.partners = parts.map(p => ({ user_id: null, user_name: p }));
        }
      }

      updated[index] = job;
      return updated;
    });
  };

  const handleDeleteRow = (index: number) => {
    setParsedJobs((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      const next = new Set<number>();
      selectedIndices.forEach((idx) => {
        if (idx < index) next.add(idx);
        else if (idx > index) next.add(idx - 1);
      });
      setSelectedIndices(next);
      return updated;
    });
  };

  const handleDeleteSelected = () => {
    setParsedJobs((prev) => prev.filter((_, i) => !selectedIndices.has(i)));
    setSelectedIndices(new Set());
  };

  const countNewEntities = () => {
    let count = 0;
    parsedJobs.forEach((job) => {
      ['partners', 'departments', 'segments', 'sites', 'titles', 'managers', 'employeeLevels'].forEach((field) => {
        (job[field] || []).forEach((item: any) => {
          if (item.id === null || item.department_id === null || item.site_id === null || item.segment_id === null || item.level_id === null || item.user_id === null) {
            count++;
          }
        });
      });
    });
    return count;
  };

  const renderTitle = () => {
    if (step === STEPS.UPLOAD) return 'Import Jobs from Excel';
    if (step === STEPS.PREVIEW) {
      return (
        <div className="flex items-center gap-4">
          <span className="text-slate-900 font-semibold text-lg">
            Preview — {parsedJobs.length} Job(s) Found
          </span>
          <div className="flex items-center gap-2">
            {selectedIndices.size > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all cursor-pointer"
              >
                Delete Selected ({selectedIndices.size})
              </button>
            )}
            <button
              type="button"
              onClick={handleImportSelected}
              disabled={selectedIndices.size === 0}
              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Import Selected ({selectedIndices.size})
            </button>
          </div>
        </div>
      );
    }
    if (step === STEPS.IMPORTING) return 'Importing Jobs...';
    return 'Import Complete';
  };

  const renderTags = (items: any[], styles: string) => {
    if (!items || items.length === 0) return <span className="text-slate-300 text-xs">—</span>;
    return (
      <div className="flex gap-1 flex-wrap">
        {items.map((item, i) => {
          const isNew = item.id === null || item.department_id === null || item.site_id === null || item.segment_id === null || item.level_id === null || item.user_id === null;
          return (
            <span key={i} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${styles}`}>
              {item.department_code || item.site_code || item.level_code || item.segment_code || item.code || item.department_name || item.site_name || item.level_name || item.segment_name || item.user_name || item.name}
              {isNew && <span className="bg-amber-100 text-amber-700 text-[8px] font-bold px-0.5 rounded ml-0.5">NEW</span>}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={renderTitle()}
      maxWidthClass="max-w-4xl"
      fullScreen={step !== STEPS.UPLOAD}
      footer={null}
    >
      <div className="space-y-4 flex flex-col h-full">
        {/* STEP 1: Upload */}
        {step === STEPS.UPLOAD && (
          <div className="space-y-4">
            {!file ? (
              <div
                onClick={() => document.getElementById('excel-file-input')?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const selected = e.dataTransfer.files?.[0] || null;
                  if (selected) {
                    const ext = selected.name.split('.').pop()?.toLowerCase();
                    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
                      setFile(selected);
                      setParseError('');
                    } else {
                      setParseError('Unsupported file format. Please select an Excel or CSV file.');
                    }
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm scale-[1.01]'
                    : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400 text-slate-700'
                }`}
              >
                <Upload size={36} className={`mb-2 ${isDragging ? 'text-emerald-500 animate-bounce' : 'text-slate-400'}`} />
                <p className="text-sm font-semibold">
                  {isDragging ? 'Drop file here!' : 'Drag and drop Excel file here, or click to select'}
                </p>
                <p className="text-xs text-slate-400 mt-1">.xlsx, .xls, .csv supported</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl shadow-sm transition-all animate-fadeIn">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                  <FileSpreadsheet size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400 font-medium">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                  onClick={() => setFile(null)}
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <input
              id="excel-file-input"
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
            {parseError && (
              <div className="bg-red-50 text-red-600 text-xs px-3.5 py-2 rounded-lg border border-red-200">
                {parseError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleParse} disabled={!file || parsing} isLoading={parsing}>
                Parse File
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Preview */}
        {step === STEPS.PREVIEW && (
          <div className="space-y-4 flex flex-col flex-1 min-h-0">
            {/* Toolbar removed — buttons moved to title header */}

            {/* Statistics Row */}
            <div className="grid grid-cols-3 gap-4 flex-shrink-0">
              <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/30 text-center">
                <p className="text-2xl font-bold text-blue-600">{parsedJobs.length}</p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Jobs Found</p>
              </div>
              <div className="p-3 rounded-lg border border-amber-100 bg-amber-50/30 text-center">
                <p className="text-2xl font-bold text-amber-600">{countNewEntities()}</p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">New Entities to Auto-create</p>
              </div>
              <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/30 text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {parsedJobs.reduce((sum, j) => sum + (j.candidateRequired || 0), 0)}
                </p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Total HC Required</p>
              </div>
            </div>

            {/* Excel Grid - Static Preview */}
            <ExcelImportTable
              minWidth="1700px"
              rows={parsedJobs}
              selectedIndices={selectedIndices}
              onSelectRow={(i) => {
                const next = new Set(selectedIndices);
                if (next.has(i)) {
                  next.delete(i);
                } else {
                  next.add(i);
                }
                setSelectedIndices(next);
              }}
              onSelectAll={(checked) => {
                if (checked) {
                  setSelectedIndices(new Set(parsedJobs.map((_, i) => i)));
                } else {
                  setSelectedIndices(new Set());
                }
              }}
              headers={[
                { label: 'Job Code', widthClass: 'w-32' },
                { label: 'Project Name', widthClass: 'w-52' },
                { label: 'Dept', widthClass: 'w-40' },
                { label: 'HC Req', widthClass: 'w-24 text-center' },
                { label: 'Job Title', widthClass: 'w-44' },
                { label: 'EE Level', widthClass: 'w-36' },
                { label: 'Site', widthClass: 'w-36' },
                { label: 'Segment', widthClass: 'w-40' },
                { label: 'Manager', widthClass: 'w-44' },
                { label: 'HRBP / Partner', widthClass: 'w-44' },
                { label: 'Req Date', widthClass: 'w-36' },
                { label: 'Note', widthClass: 'w-56' },
              ]}
              renderRow={(job) => (
                <>
                  <td className="p-2.5 font-semibold text-slate-800">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-600">
                      {job.jobCode || '—'}
                    </span>
                  </td>
                  <td className="p-2.5 font-medium text-slate-800 truncate" title={job.project}>{job.project || '—'}</td>
                  <td className="p-2.5">
                    {renderTags(job.departments, 'bg-blue-50 border border-blue-200 text-blue-600')}
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-800">{job.candidateRequired}</td>
                  <td className="p-2.5">
                    {renderTags(job.titles, 'bg-purple-50 border border-purple-200 text-purple-600')}
                  </td>
                  <td className="p-2.5">
                    {renderTags(job.employeeLevels, 'bg-purple-50 border border-purple-200 text-purple-600')}
                  </td>
                  <td className="p-2.5">
                    {renderTags(job.sites, 'bg-emerald-50 border border-emerald-200 text-emerald-600')}
                  </td>
                  <td className="p-2.5">
                    {renderTags(job.segments, 'bg-amber-50 border border-amber-200 text-amber-600')}
                  </td>
                  <td className="p-2.5">
                    {renderTags(job.managers, 'bg-red-50 border border-red-200 text-red-600')}
                  </td>
                  <td className="p-2.5">
                    {renderTags(job.partners, 'bg-red-50 border border-red-200 text-red-600')}
                  </td>
                  <td className="p-2.5 text-slate-600">{job.requestDate || '—'}</td>
                  <td className="p-2.5 text-slate-500 truncate" title={job.note}>{job.note || '—'}</td>
                </>
              )}
            />

            {countNewEntities() > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 flex-shrink-0">
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
          <div className="text-center py-12 px-6 flex flex-col items-center justify-center flex-1">
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
          <div className="text-center py-12 px-6 flex flex-col items-center justify-center flex-1">
            <div className="mb-4">
              {importProgress.errors.length === 0 ? (
                <Check size={48} className="text-emerald-600" />
              ) : (
                <AlertTriangle size={48} className="text-amber-600" />
              )}
            </div>
            <p className="text-lg font-bold text-slate-900 mb-1">
              {importProgress.errors.length === 0
                ? 'Selected Jobs Imported Successfully!'
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
            <Button onClick={onClose} icon={<Check size={16} />} className="mt-4">
              Done
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
export { JobExcelImport };
