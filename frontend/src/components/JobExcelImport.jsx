import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertTriangle, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { parseJobSheetApi } from '../services/jobApi';

const STEPS = {
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  IMPORTING: 'importing',
  DONE: 'done',
};

export const JobExcelImport = ({ onImport, onClose }) => {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsedJobs, setParsedJobs] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: [] });

  // Step 1: Select file
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setParseError('');
  };

  // Step 2: Parse file
  const handleParse = async () => {
    if (!file) {
      setParseError('Please select an Excel file.');
      return;
    }

    setParsing(true);
    setParseError('');

    const result = await parseJobSheetApi(file);

    if (result.success && result.jobs.length > 0) {
      setParsedJobs(result.jobs);
      setStep(STEPS.PREVIEW);
    } else if (result.success && result.jobs.length === 0) {
      setParseError('No jobs found in this file. Please check the format.');
    } else {
      setParseError(result.message || 'Failed to parse file.');
    }

    setParsing(false);
  };

  // Step 3: Import all jobs
  const handleImportAll = async () => {
    setStep(STEPS.IMPORTING);
    setImportProgress({ current: 0, total: parsedJobs.length, errors: [] });

    const errors = [];

    for (let i = 0; i < parsedJobs.length; i++) {
      setImportProgress((prev) => ({ ...prev, current: i + 1 }));

      try {
        // Call parent's onImport for each job
        const result = await onImport(parsedJobs[i]);
        if (!result.success) {
          errors.push({ index: i, code: parsedJobs[i].jobCode, message: result.message });
        }
      } catch (err) {
        errors.push({ index: i, code: parsedJobs[i].jobCode, message: err.message || 'Unknown error' });
      }
    }

    setImportProgress((prev) => ({ ...prev, errors }));
    setStep(STEPS.DONE);
  };

  // Toggle row detail
  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  // Render tags for linked entities
  const renderTags = (items, colorClass) => {
    if (!items || items.length === 0) return <span style={s.emptyTag}>—</span>;
    return (
      <div style={s.tagWrap}>
        {items.map((item, i) => (
          <span key={i} style={{ ...s.tag, ...colorClass }}>
            {item.code || item.name}
            {item.id === null && <span style={s.newBadge}>NEW</span>}
          </span>
        ))}
      </div>
    );
  };

  const s = {
    backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '95vw', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 },
    title: { fontSize: '17px', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' },
    body: { padding: '24px', overflowY: 'auto', flex: 1 },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 },

    // Upload step
    dropZone: { border: '2px dashed #d1d5db', borderRadius: '12px', padding: '40px', textAlign: 'center', background: '#fafafa', cursor: 'pointer', transition: 'border-color 0.2s' },
    dropIcon: { marginBottom: '12px', color: '#94a3b8' },
    dropTitle: { fontSize: '16px', fontWeight: 600, color: '#334155', marginBottom: '4px' },
    dropHint: { fontSize: '13px', color: '#94a3b8' },
    fileInput: { display: 'none' },
    selectedFile: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginTop: '16px' },
    fileName: { flex: 1, fontSize: '14px', fontWeight: 600, color: '#2563eb' },
    removeFile: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' },
    error: { background: '#fef2f2', color: '#dc2626', fontSize: '13px', padding: '10px 14px', borderRadius: '8px', marginTop: '12px', border: '1px solid #fecaca' },

    // Preview step
    summary: { display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' },
    summaryCard: (bg, color) => ({ padding: '12px 20px', borderRadius: '8px', background: bg, flex: 1, minWidth: '140px', textAlign: 'center', border: `1px solid ${color}20` }),
    summaryNum: (color) => ({ fontSize: '24px', fontWeight: 800, color, margin: '0 0 2px' }),
    summaryLabel: { fontSize: '12px', color: '#64748b', margin: 0 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { textAlign: 'left', padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: '#64748b', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0 },
    td: { padding: '10px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' },
    rowClickable: { cursor: 'pointer', transition: 'background 0.15s' },
    expandedDetail: { padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' },
    detailLabel: { fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' },
    tagWrap: { display: 'flex', gap: '4px', flexWrap: 'wrap' },
    tag: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 },
    emptyTag: { color: '#cbd5e1', fontSize: '12px' },
    newBadge: { fontSize: '9px', fontWeight: 700, color: '#f59e0b', background: '#fef3c7', padding: '1px 4px', borderRadius: '3px', marginLeft: '2px' },
    codeBadge: { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' },

    // Tag colors
    deptColor: { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' },
    segColor: { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' },
    siteColor: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
    levelColor: { background: '#faf5ff', color: '#7c3aed', border: '1px solid #e9d5ff' },
    userColor: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },

    // Progress
    progressWrap: { textAlign: 'center', padding: '40px 20px' },
    progressBar: { width: '100%', height: '8px', borderRadius: '4px', background: '#e2e8f0', overflow: 'hidden', marginTop: '16px' },
    progressFill: (pct) => ({ width: `${pct}%`, height: '100%', background: '#2563eb', borderRadius: '4px', transition: 'width 0.3s' }),
    progressText: { fontSize: '14px', color: '#64748b', marginTop: '8px' },

    // Done
    doneWrap: { textAlign: 'center', padding: '40px 20px' },
    doneIcon: { marginBottom: '16px' },
    doneTitle: { fontSize: '20px', fontWeight: 700, color: '#16a34a', marginBottom: '8px' },
    doneText: { fontSize: '14px', color: '#64748b', marginBottom: '16px' },
    errorList: { textAlign: 'left', maxHeight: '200px', overflowY: 'auto', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginTop: '12px' },
    errorItem: { fontSize: '13px', color: '#dc2626', padding: '4px 0' },

    // Buttons
    btnPrimary: (disabled) => ({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, color: '#fff', background: disabled ? '#93c5fd' : '#2563eb', border: 'none', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer' }),
    btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, color: '#374151', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' },
    btnBack: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' },
  };

  // Count new entities (id === null)
  const countNewEntities = () => {
    let count = 0;
    parsedJobs.forEach((job) => {
      ['partners', 'departments', 'segments', 'sites', 'titles', 'managers', 'employeeLevels'].forEach((field) => {
        (job[field] || []).forEach((item) => {
          if (item.id === null) count++;
        });
      });
    });
    return count;
  };

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <h2 style={s.title}>
            <FileSpreadsheet size={22} />
            {step === STEPS.UPLOAD && 'Import Jobs from Excel'}
            {step === STEPS.PREVIEW && `Preview — ${parsedJobs.length} Job(s) Found`}
            {step === STEPS.IMPORTING && 'Importing Jobs...'}
            {step === STEPS.DONE && 'Import Complete'}
          </h2>
          <button type="button" style={s.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={s.body}>

          {/* ═══ STEP 1: Upload ═══ */}
          {step === STEPS.UPLOAD && (
            <div>
              <div
                style={s.dropZone}
                onClick={() => document.getElementById('excel-file-input').click()}
              >
                <div style={s.dropIcon}><Upload size={40} /></div>
                <p style={s.dropTitle}>Click to select Excel file</p>
                <p style={s.dropHint}>.xlsx, .xls, .csv supported</p>
              </div>
              <input
                id="excel-file-input"
                type="file"
                style={s.fileInput}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
              {file && (
                <div style={s.selectedFile}>
                  <FileSpreadsheet size={20} style={{ color: '#16a34a' }} />
                  <span style={s.fileName}>{file.name}</span>
                  <button type="button" style={s.removeFile} onClick={() => setFile(null)}>
                    <X size={16} />
                  </button>
                </div>
              )}
              {parseError && <div style={s.error}>{parseError}</div>}
            </div>
          )}

          {/* ═══ STEP 2: Preview ═══ */}
          {step === STEPS.PREVIEW && (
            <div>
              {/* Summary cards */}
              <div style={s.summary}>
                <div style={s.summaryCard('#eff6ff', '#2563eb')}>
                  <p style={s.summaryNum('#2563eb')}>{parsedJobs.length}</p>
                  <p style={s.summaryLabel}>Jobs to Import</p>
                </div>
                <div style={s.summaryCard('#fef3c7', '#d97706')}>
                  <p style={s.summaryNum('#d97706')}>{countNewEntities()}</p>
                  <p style={s.summaryLabel}>New Entities (auto-create)</p>
                </div>
                <div style={s.summaryCard('#f0fdf4', '#16a34a')}>
                  <p style={s.summaryNum('#16a34a')}>{parsedJobs.reduce((sum, j) => sum + j.candidateRequired, 0)}</p>
                  <p style={s.summaryLabel}>Total HC Required</p>
                </div>
              </div>

              {/* Preview table */}
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={{ ...s.th, width: '40px' }}>#</th>
                      <th style={{ ...s.th, width: '110px' }}>Job Code</th>
                      <th style={s.th}>Project</th>
                      <th style={{ ...s.th, width: '60px', textAlign: 'center' }}>HC</th>
                      <th style={s.th}>Departments</th>
                      <th style={s.th}>Sites</th>
                      <th style={{ ...s.th, width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedJobs.map((job, i) => (
                      <React.Fragment key={i}>
                        <tr
                          style={{ ...s.rowClickable, background: expandedRow === i ? '#f8fafc' : 'transparent' }}
                          onClick={() => toggleRow(i)}
                        >
                          <td style={s.td}>{i + 1}</td>
                          <td style={s.td}><span style={s.codeBadge}>{job.jobCode}</span></td>
                          <td style={s.td}><strong>{job.project}</strong></td>
                          <td style={{ ...s.td, textAlign: 'center', fontWeight: 700 }}>{job.candidateRequired}</td>
                          <td style={s.td}>{renderTags(job.departments, s.deptColor)}</td>
                          <td style={s.td}>{renderTags(job.sites, s.siteColor)}</td>
                          <td style={s.td}>
                            {expandedRow === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </td>
                        </tr>
                        {expandedRow === i && (
                          <tr>
                            <td colSpan={7} style={s.expandedDetail}>
                              <div style={s.detailGrid}>
                                <div>
                                  <p style={s.detailLabel}>Request Date</p>
                                  {job.requestDate || '—'}
                                </div>
                                <div>
                                  <p style={s.detailLabel}>Note</p>
                                  {job.note || '—'}
                                </div>
                                <div>
                                  <p style={s.detailLabel}>Segments</p>
                                  {renderTags(job.segments, s.segColor)}
                                </div>
                                <div>
                                  <p style={s.detailLabel}>Titles</p>
                                  {renderTags(job.titles, s.levelColor)}
                                </div>
                                <div>
                                  <p style={s.detailLabel}>Employee Levels</p>
                                  {renderTags(job.employeeLevels, s.levelColor)}
                                </div>
                                <div>
                                  <p style={s.detailLabel}>HRBP (Partners)</p>
                                  {renderTags(job.partners, s.userColor)}
                                </div>
                                <div>
                                  <p style={s.detailLabel}>Hiring Managers</p>
                                  {renderTags(job.managers, s.userColor)}
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
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '12px', padding: '10px 14px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
                    <strong>{countNewEntities()} new entities</strong> (marked <span style={s.newBadge}>NEW</span>) will be auto-created in the system during import.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 3: Importing ═══ */}
          {step === STEPS.IMPORTING && (
            <div style={s.progressWrap}>
              <Loader size={40} style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              <div style={s.progressBar}>
                <div style={s.progressFill(importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0)} />
              </div>
              <p style={s.progressText}>
                Importing job {importProgress.current} of {importProgress.total}...
              </p>
            </div>
          )}

          {/* ═══ STEP 4: Done ═══ */}
          {step === STEPS.DONE && (
            <div style={s.doneWrap}>
              <div style={s.doneIcon}>
                {importProgress.errors.length === 0
                  ? <Check size={48} style={{ color: '#16a34a' }} />
                  : <AlertTriangle size={48} style={{ color: '#d97706' }} />
                }
              </div>
              <p style={s.doneTitle}>
                {importProgress.errors.length === 0
                  ? 'All Jobs Imported Successfully!'
                  : `Imported with ${importProgress.errors.length} error(s)`
                }
              </p>
              <p style={s.doneText}>
                {importProgress.current - importProgress.errors.length} of {importProgress.total} jobs imported successfully.
              </p>
              {importProgress.errors.length > 0 && (
                <div style={s.errorList}>
                  {importProgress.errors.map((err, i) => (
                    <div key={i} style={s.errorItem}>
                      ❌ <strong>{err.code}</strong>: {err.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <div>
            {step === STEPS.PREVIEW && (
              <button type="button" style={s.btnBack} onClick={() => { setStep(STEPS.UPLOAD); setParsedJobs([]); }}>
                ← Back to Upload
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {step === STEPS.DONE ? (
              <button type="button" style={s.btnPrimary(false)} onClick={onClose}>
                <Check size={16} /> Done
              </button>
            ) : (
              <>
                <button type="button" style={s.btnSecondary} onClick={onClose}>Cancel</button>
                {step === STEPS.UPLOAD && (
                  <button
                    type="button"
                    style={s.btnPrimary(parsing || !file)}
                    disabled={parsing || !file}
                    onClick={handleParse}
                  >
                    {parsing ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Parsing...</> : <><Upload size={14} /> Parse File</>}
                  </button>
                )}
                {step === STEPS.PREVIEW && (
                  <button type="button" style={s.btnPrimary(false)} onClick={handleImportAll}>
                    <Upload size={14} /> Import {parsedJobs.length} Job(s)
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};