import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { parseCandidateSheetApi, createCandidateExtendedApi } from '@/services/candidateApi';
import { mapParsedCandidateToExtendedFormPayload } from '@/services/candidateImportMapper';
import Modal from '@/components/ui/Modal';
import Button from '@/components/common/Button';
import ExcelImportTable from '@/components/ui/ExcelImportTable';


const STEPS = {
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  IMPORTING: 'importing',
  DONE: 'done',
};

export interface CandidateExcelImportProps {
  onImportBatch?: (
    candidates: any[],
    onProgress?: (current: number) => void
  ) => Promise<{ success: boolean; importedCount: number; errors: any[] }>;
  onClose: () => void;
}

function formatDate(val: any): string {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB'); // dd/mm/yyyy
  } catch {
    return '—';
  }
}

export default function CandidateExcelImport({ onImportBatch, onClose }: CandidateExcelImportProps) {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsedCandidates, setParsedCandidates] = useState<any[]>([]);
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
      const candidates = await parseCandidateSheetApi(file);
      if (candidates && candidates.length > 0) {
        const candidatesWithIndex = candidates.map((c: any, index: number) => ({
          ...c,
          row_index: index,
        }));
        setParsedCandidates(candidatesWithIndex);
        setSelectedIndices(new Set(candidatesWithIndex.map((_: any, i: number) => i)));
        setStep(STEPS.PREVIEW);
      } else {
        setParseError('No candidates found in this file. Please check the format.');
      }
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file.');
    } finally {
      setParsing(false);
    }
  };

  const handleImportSelected = async () => {
    const indicesToImport = Array.from(selectedIndices).sort((a, b) => a - b);
    if (indicesToImport.length === 0) {
      alert('Please select at least one candidate to import.');
      return;
    }

    setStep(STEPS.IMPORTING);
    setImportProgress({ current: 0, total: indicesToImport.length, errors: [] });

    const selectedCandidates = indicesToImport.map(idx => parsedCandidates[idx]);

    if (onImportBatch) {
      try {
        const reportProgress = (current: number) => {
          setImportProgress((prev) => ({
            ...prev,
            current: Math.min(Math.max(current, 0), selectedCandidates.length),
          }));
        };

        const result = await onImportBatch(selectedCandidates, reportProgress);
        setImportProgress({
          current: result.importedCount + result.errors.length,
          total: selectedCandidates.length,
          errors: result.errors.map(err => ({
            row_index: err.row_index,
            name: err.candidate_name,
            email: err.candidate_email,
            message: err.message
          }))
        });
      } catch (err: any) {
        setImportProgress({
          current: 0,
          total: selectedCandidates.length,
          errors: [{ name: 'Batch Error', message: err.message || 'Import failed' }]
        });
      }
    } else {
      const errors: any[] = [];

      for (let pos = 0; pos < indicesToImport.length; pos++) {
        const idx = indicesToImport[pos];
        const c = parsedCandidates[idx];
        setImportProgress((prev) => ({ ...prev, current: pos + 1 }));
        const mapped = mapParsedCandidateToExtendedFormPayload(c, idx);
        if (mapped.error || !mapped.payload) {
          errors.push({
            name: mapped.error?.candidate_name || c.candidate_name || `Row ${idx + 1}`,
            message: mapped.error?.message || 'Invalid candidate data',
          });
          continue;
        }

        try {
          await createCandidateExtendedApi(mapped.payload);
        } catch (err: any) {
          errors.push({
            name: c.candidate_name || `Row ${idx + 1}`,
            message: err.response?.data?.message || err.message || 'Unknown error',
          });
        }
      }

      setImportProgress((prev) => ({ ...prev, errors }));
    }

    setStep(STEPS.DONE);
  };

  const handleDeleteSelected = () => {
    setParsedCandidates((prev) => prev.filter((_, i) => !selectedIndices.has(i)));
    setSelectedIndices(new Set());
  };

  const countNewUsers = () => {
    let count = 0;
    parsedCandidates.forEach((c) => {
      if (c.hiring_manager?.user_id === null) count++;
    });
    return count;
  };

  const renderTitle = () => {
    if (step === STEPS.UPLOAD) return 'Import Candidates from Excel';
    if (step === STEPS.PREVIEW) {
      return (
        <div className="flex items-center gap-4">
          <span className="text-slate-900 font-semibold text-lg">
            Preview — {parsedCandidates.length} Candidate(s) Found
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
    if (step === STEPS.IMPORTING) return 'Importing Candidates...';
    return 'Import Complete';
  };

  const renderUserTag = (user: any | null, colorClass: string) => {
    if (!user) return <span className="text-slate-300 text-xs">—</span>;
    const isNew = user.user_id === null;
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${colorClass}`}>
        {user.user_code ? `${user.user_code} - ${user.user_name}` : user.user_name}
        {isNew && <span className="bg-amber-100 text-amber-700 text-[8px] font-bold px-0.5 rounded ml-0.5">NEW</span>}
      </span>
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
                onClick={() => document.getElementById('candidate-excel-input')?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
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
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${isDragging
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
              <div className="flex items-center gap-3 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl shadow-sm transition-all">
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
              id="candidate-excel-input"
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
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={handleParse} disabled={!file || parsing} isLoading={parsing}>
                Parse File
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Preview */}
        {step === STEPS.PREVIEW && (
          <div className="space-y-4 flex flex-col flex-1 min-h-0">

            {/* Statistics Row */}
            <div className="grid grid-cols-3 gap-4 flex-shrink-0">
              <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/30 text-center">
                <p className="text-2xl font-bold text-blue-600">{parsedCandidates.length}</p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Candidates Found</p>
              </div>
              <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/30 text-center">
                <p className="text-2xl font-bold text-emerald-600">{selectedIndices.size}</p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Selected to Import</p>
              </div>
              <div className="p-3 rounded-lg border border-amber-100 bg-amber-50/30 text-center">
                <p className="text-2xl font-bold text-amber-600">{countNewUsers()}</p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">New Users to Auto-create</p>
              </div>
            </div>

            {/* Excel Grid */}
            <ExcelImportTable
              minWidth="2000px"
              rows={parsedCandidates}
              selectedIndices={selectedIndices}
              onSelectRow={(i) => {
                const next = new Set(selectedIndices);
                if (next.has(i)) next.delete(i);
                else next.add(i);
                setSelectedIndices(next);
              }}
              onSelectAll={(checked) => {
                if (checked) {
                  setSelectedIndices(new Set(parsedCandidates.map((_, i) => i)));
                } else {
                  setSelectedIndices(new Set());
                }
              }}
              headers={[
                { label: 'Name', widthClass: 'w-44' },
                { label: 'Email', widthClass: 'w-52' },
                { label: 'Phone', widthClass: 'w-36' },
                { label: 'Job Code', widthClass: 'w-28' },
                { label: 'Project', widthClass: 'w-40' },
                { label: 'Status', widthClass: 'w-36' },
                { label: 'Source', widthClass: 'w-36' },
                { label: 'Input Date', widthClass: 'w-32' },
                { label: 'Offer Date', widthClass: 'w-32' },
                { label: 'Onboard Date', widthClass: 'w-32' },
                { label: 'Current Salary', widthClass: 'w-36' },
                { label: 'Expected Salary', widthClass: 'w-36' },
                { label: 'Agency', widthClass: 'w-36' },
                { label: 'Reference', widthClass: 'w-36' },
                { label: 'Targeted Company', widthClass: 'w-36' },
                { label: 'Note', widthClass: 'w-60' },
              ]}
              renderRow={(c) => (
                <>
                  <td className="p-2.5 font-semibold text-slate-800 truncate" title={c.candidate_name}>
                    {c.candidate_name || '—'}
                  </td>
                  <td className="p-2.5 text-slate-600 truncate" title={c.candidate_email}>
                    {c.candidate_email || '—'}
                  </td>
                  <td className="p-2.5 text-slate-600">{c.candidate_phone || '—'}</td>
                  <td className="p-2.5">
                    {c.job_code
                      ? <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-600">{c.job_code}</span>
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                  <td className="p-2.5 text-slate-600 truncate" title={c.project}>{c.project || '—'}</td>
                  <td className="p-2.5">
                    {c.status
                      ? <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700">{c.status}</span>
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                  <td className="p-2.5 text-slate-600">{c.source || '—'}</td>
                  <td className="p-2.5 text-slate-500">{formatDate(c.input_date)}</td>
                  <td className="p-2.5 text-slate-500">{formatDate(c.offer_date)}</td>
                  <td className="p-2.5 text-slate-500">{formatDate(c.onboard_date)}</td>
                  <td className="p-2.5 text-slate-600">{c.current_salary || '—'}</td>
                  <td className="p-2.5 text-slate-600">{c.expected_salary || '—'}</td>
                  <td className="p-2.5 text-slate-600 truncate" title={c.agency}>{c.agency || '—'}</td>
                  <td className="p-2.5 text-slate-600">{c.reference_name || '—'}</td>
                  <td className="p-2.5 text-slate-600 truncate" title={c.targeted_company_name}>{c.targeted_company_name || '—'}</td>
                  <td className="p-2.5 text-slate-500 truncate" title={c.note}>{c.note || '—'}</td>
                </>
              )}
            />

            {countNewUsers() > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 flex-shrink-0">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  <strong>{countNewUsers()} new users (Hiring Manager)</strong> will be auto-created in the system during import.
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
              Importing candidate {importProgress.current} of {importProgress.total}...
            </p>
          </div>
        )}

        {/* STEP 4: Done */}
        {step === STEPS.DONE && (
          <div className="space-y-4 flex flex-col flex-grow flex-shrink min-h-0 h-full">
            <div className="flex items-center justify-between flex-shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                {importProgress.errors.length === 0 ? (
                  <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                    <Check size={24} />
                  </div>
                ) : (
                  <div className="p-2 bg-red-100 rounded-full text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {importProgress.errors.length === 0
                      ? 'Import Completed Successfully!'
                      : `Import Completed with ${importProgress.errors.length} error(s)`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {importProgress.total - importProgress.errors.length} of {importProgress.total} candidates imported successfully.
                  </p>
                </div>
              </div>
              <Button onClick={onClose} icon={<Check size={16} />}>
                Close
              </Button>
            </div>

            {importProgress.errors.length > 0 && (
              <div className="flex flex-col flex-grow min-h-0 overflow-hidden space-y-2">
                <p className="text-xs font-semibold text-slate-500 flex-shrink-0">
                  Failed Candidates Grid View:
                </p>
                <ExcelImportTable
                  minWidth="2200px"
                  rows={importProgress.errors.map(err => {
                    const original = typeof err.row_index === 'number'
                      ? parsedCandidates.find(c => c.row_index === err.row_index) || {}
                      : parsedCandidates.find(c =>
                          (c.candidate_email && err.email && c.candidate_email === err.email) ||
                          (c.candidate_name && c.candidate_name === err.name)
                        ) || {};
                    return {
                      ...original,
                      _importError: err.message
                    };
                  })}
                  selectedIndices={new Set()}
                  onSelectRow={() => {}}
                  onSelectAll={() => {}}
                  headers={[
                    { label: 'Import Error', widthClass: 'w-80' },
                    { label: 'Name', widthClass: 'w-44' },
                    { label: 'Email', widthClass: 'w-52' },
                    { label: 'Phone', widthClass: 'w-36' },
                    { label: 'Job Code', widthClass: 'w-28' },
                    { label: 'Project', widthClass: 'w-40' },
                    { label: 'Status', widthClass: 'w-36' },
                    { label: 'Source', widthClass: 'w-36' },
                    { label: 'Input Date', widthClass: 'w-32' },
                    { label: 'Offer Date', widthClass: 'w-32' },
                    { label: 'Onboard Date', widthClass: 'w-32' },
                    { label: 'Current Salary', widthClass: 'w-36' },
                    { label: 'Expected Salary', widthClass: 'w-36' },
                    { label: 'Agency', widthClass: 'w-36' },
                    { label: 'Reference', widthClass: 'w-36' },
                    { label: 'Targeted Company', widthClass: 'w-36' },
                    { label: 'Note', widthClass: 'w-60' },
                  ]}
                  renderRow={(c) => (
                    <>
                      <td className="p-2.5 font-bold text-red-600 truncate bg-red-50/50 sticky left-12 z-10 border-r border-red-100" title={c._importError}>
                        ❌ {c._importError}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800 truncate" title={c.candidate_name}>
                        {c.candidate_name || '—'}
                      </td>
                      <td className="p-2.5 text-slate-600 truncate" title={c.candidate_email}>
                        {c.candidate_email || '—'}
                      </td>
                      <td className="p-2.5 text-slate-600">{c.candidate_phone || '—'}</td>
                      <td className="p-2.5">
                        {c.job_code
                          ? <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-600">{c.job_code}</span>
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                      <td className="p-2.5 text-slate-600 truncate" title={c.project}>{c.project || '—'}</td>
                      <td className="p-2.5">
                        {c.status
                          ? <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700">{c.status}</span>
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                      <td className="p-2.5 text-slate-600">{c.source || '—'}</td>
                      <td className="p-2.5 text-slate-500">{formatDate(c.input_date)}</td>
                      <td className="p-2.5 text-slate-500">{formatDate(c.offer_date)}</td>
                      <td className="p-2.5 text-slate-500">{formatDate(c.onboard_date)}</td>
                      <td className="p-2.5 text-slate-600">{c.current_salary || '—'}</td>
                      <td className="p-2.5 text-slate-600">{c.expected_salary || '—'}</td>
                      <td className="p-2.5 text-slate-600 truncate" title={c.agency}>{c.agency || '—'}</td>
                      <td className="p-2.5 text-slate-600">{c.reference_name || '—'}</td>
                      <td className="p-2.5 text-slate-600 truncate" title={c.targeted_company_name}>{c.targeted_company_name || '—'}</td>
                      <td className="p-2.5 text-slate-500 truncate" title={c.note}>{c.note || '—'}</td>
                    </>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
