import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Trash2 } from 'lucide-react';

const SUPPORTED_TYPES = ['.pdf', '.docx', '.doc', '.txt', '.jpg', '.jpeg', '.png'];

const formatFileSize = (bytes) => {
  // If file size is less than 1KB, show in bytes
  if (bytes < 1024) return `${bytes} B`;
  // If file size is less than 1MB, show in KB
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExtension = (name) => {
  const dot = name.lastIndexOf('.');
  // If no extension found, return empty string
  if (dot === -1) return '';
  return name.slice(dot).toLowerCase();
};

export const BulkCVUpload = ({ onUpload, onClose }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const newFiles = [];

    // Loop through each dropped/selected file
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = getFileExtension(file.name);

      // If file extension is not in supported list, skip it
      if (!SUPPORTED_TYPES.includes(ext)) continue;

      // If file with the same name and size already exists, skip it
      const duplicate = files.some(
        (f) => f.file.name === file.name && f.file.size === file.size
      );
      if (duplicate) continue;

      newFiles.push({
        id: `file-${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        ext,
      });
    }

    // If there are valid new files, add them to the list
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    // If files were dropped, add them
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    // If files were selected via input, add them
    if (e.target.files?.length) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleRemove = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    setFiles([]);
  };

  const handleUpload = () => {
    onUpload(files.map((f) => f.file));
  };

  const s = {
    backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' },
    modal: { background: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' },
    headerTitle: { fontSize: '17px', fontWeight: 700, color: '#1e293b', margin: 0 },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' },
    body: { padding: '24px', overflowY: 'auto', flex: 1 },
    dropzone: (dragging) => ({ border: `2px dashed ${dragging ? '#3b82f6' : '#cbd5e1'}`, borderRadius: '10px', padding: '32px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: dragging ? '#eff6ff' : '#f8fafc', marginBottom: '20px' }),
    dropTitle: { fontWeight: 600, fontSize: '15px', margin: '8px 0 0', color: '#334155' },
    dropSub: { fontSize: '13px', color: '#94a3b8', marginTop: '4px' },
    listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    listTitle: { fontSize: '14px', fontWeight: 600, color: '#374151' },
    clearBtn: { padding: '4px 12px', fontSize: '12px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' },
    fileItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px', border: '1px solid #e2e8f0' },
    fileIcon: { color: '#3b82f6', flexShrink: 0 },
    fileInfo: { flex: 1, minWidth: 0 },
    fileName: { fontSize: '14px', fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    fileMeta: { fontSize: '12px', color: '#94a3b8', marginTop: '2px' },
    removeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', flexShrink: 0 },
    emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: '14px', padding: '20px 0' },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' },
    footerInfo: { fontSize: '13px', color: '#64748b' },
    cancelBtn: { padding: '8px 20px', fontSize: '14px', fontWeight: 600, color: '#374151', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' },
    uploadBtn: (disabled) => ({ padding: '8px 20px', fontSize: '14px', fontWeight: 600, color: '#fff', background: disabled ? '#93c5fd' : '#2563eb', border: 'none', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer' }),
  };

  return (
    <div style={s.backdrop}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <h2 style={s.headerTitle}>📄 Mass CV Upload</h2>
          <button type="button" style={s.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={s.body}>
          {/* Dropzone */}
          <div
            style={s.dropzone(isDragging)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Upload size={28} style={{ color: '#94a3b8', margin: '0 auto' }} />
            <p style={s.dropTitle}>Drag & drop multiple CV files here</p>
            <p style={s.dropSub}>or click to select files — PDF, DOCX, DOC, TXT, JPG, PNG</p>
          </div>

          {/* File list */}
          {files.length > 0 ? (
            <>
              <div style={s.listHeader}>
                <span style={s.listTitle}>{files.length} file(s) added</span>
                <button type="button" style={s.clearBtn} onClick={handleClearAll}>
                  Clear All
                </button>
              </div>

              {/* Loop through all added files to render file cards */}
              {files.map((f) => (
                <div key={f.id} style={s.fileItem}>
                  <FileText size={20} style={s.fileIcon} />
                  <div style={s.fileInfo}>
                    <div style={s.fileName}>{f.name}</div>
                    <div style={s.fileMeta}>
                      {formatFileSize(f.size)} • {f.ext.replace('.', '').toUpperCase()}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={s.removeBtn}
                    onClick={() => handleRemove(f.id)}
                    title="Remove file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </>
          ) : (
            <p style={s.emptyText}>No files added yet. Drag & drop or click above to select.</p>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <span style={s.footerInfo}>
            {files.length > 0
              ? `${files.length} file(s) ready to upload`
              : 'No files selected'}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              style={s.uploadBtn(files.length === 0)}
              onClick={handleUpload}
              disabled={files.length === 0}
            >
              Upload {files.length > 0 ? `${files.length} File(s)` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};