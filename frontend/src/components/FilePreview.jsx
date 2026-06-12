import React, { useEffect, useState } from 'react';
import { X, Download, FileText, FileSpreadsheet, File, Image, Loader } from 'lucide-react';
import apiClient from '../services/api';

// Get file extension from filename
const getExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
};

// Get icon based on file type
const getFileIcon = (ext) => {
  if (['pdf'].includes(ext)) return <FileText size={20} style={{ color: '#dc2626' }} />;
  if (['doc', 'docx', 'txt'].includes(ext)) return <FileText size={20} style={{ color: '#2563eb' }} />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet size={20} style={{ color: '#16a34a' }} />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <Image size={20} style={{ color: '#7c3aed' }} />;
  return <File size={20} style={{ color: '#64748b' }} />;
};

// Get MIME type from extension
const getMimeType = (ext) => {
  const mimeMap = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    txt: 'text/plain',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return mimeMap[ext] || 'application/octet-stream';
};

// File badge shown in table cell
export const FileBadge = ({ file, onClick }) => {
  if (!file) return <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>;

  const ext = getExtension(file.name);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#2563eb',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '6px',
        cursor: 'pointer',
        maxWidth: '160px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={'Preview: ' + file.name}
    >
      {getFileIcon(ext)}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
    </button>
  );
};

// File link shown in JobForm (edit mode)
export const FileLink = ({ file, onClick }) => {
  if (!file) return null;

  const ext = getExtension(file.name);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        marginBottom: '8px',
      }}
    >
      {getFileIcon(ext)}
      <button
        type="button"
        onClick={onClick}
        style={{
          flex: 1,
          fontSize: '13px',
          fontWeight: 600,
          color: '#2563eb',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          textDecoration: 'underline',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={'Preview: ' + file.name}
      >
        {file.name}
      </button>
      <span
        style={{
          fontSize: '11px',
          color: '#94a3b8',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        {ext}
      </span>
    </div>
  );
};

// Full-screen file preview modal
export const FilePreviewModal = ({ file, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const ext = getExtension(file?.name || '');
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isPdf = ext === 'pdf';
  const isText = ['txt', 'csv'].includes(ext);

  // Fetch file from backend and create blob URL
  useEffect(() => {
    if (!file || !file.url) {
      setError('File URL not available.');
      setLoading(false);
      return;
    }

    let objectUrl = null;

    const fetchFile = async () => {
      setLoading(true);
      setError('');

      try {
        // Download file as blob through apiClient (includes auth token)
        const response = await apiClient.get(file.url.replace(apiClient.defaults.baseURL, ''), {
          responseType: 'blob',
        });

        const blob = new Blob([response.data], { type: getMimeType(ext) });
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);

        // If text file, also read content as text
        if (isText) {
          const text = await blob.text();
          setTextContent(text);
        }
      } catch (err) {
        console.error('Failed to fetch file:', err);

        // Try fetching directly from full URL as fallback
        try {
          const response = await fetch(file.url);
          if (!response.ok) throw new Error('Fetch failed');

          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);

          if (isText) {
            const text = await blob.text();
            setTextContent(text);
          }
        } catch (fallbackErr) {
          setError('Cannot load file. Please download instead.');
        }
      }

      setLoading(false);
    };

    fetchFile();

    // Cleanup: revoke blob URL when modal closes
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file]);

  if (!file) return null;

  // Download file using blob URL
  const handleDownload = () => {
    if (blobUrl) {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  const s = {
    backdrop: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    },
    modal: {
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      width: '90vw',
      height: '85vh',
      maxWidth: '1200px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 20px',
      borderBottom: '1px solid #e2e8f0',
      background: '#f8fafc',
      flexShrink: 0,
    },
    titleWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      overflow: 'hidden',
      flex: 1,
    },
    title: {
      fontSize: '15px',
      fontWeight: 700,
      color: '#1e293b',
      margin: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    extBadge: {
      fontSize: '11px',
      fontWeight: 700,
      color: '#64748b',
      background: '#f1f5f9',
      padding: '2px 8px',
      borderRadius: '4px',
      textTransform: 'uppercase',
      flexShrink: 0,
    },
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexShrink: 0,
    },
    actionBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 14px',
      fontSize: '13px',
      fontWeight: 600,
      borderRadius: '6px',
      cursor: 'pointer',
      border: '1px solid #d1d5db',
      background: '#fff',
      color: '#374151',
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#64748b',
      padding: '4px',
    },
    body: {
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f1f5f9',
    },
    loading: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      color: '#64748b',
      fontSize: '14px',
    },
    image: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
    },
    iframe: {
      width: '100%',
      height: '100%',
      border: 'none',
    },
    textWrap: {
      width: '100%',
      height: '100%',
      overflow: 'auto',
      padding: '24px',
      background: '#fff',
    },
    preText: {
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      fontSize: '13px',
      lineHeight: 1.6,
      color: '#334155',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      margin: 0,
    },
    fallback: {
      textAlign: 'center',
      padding: '60px 40px',
    },
    fallbackTitle: {
      fontSize: '18px',
      fontWeight: 700,
      color: '#1e293b',
      marginBottom: '8px',
    },
    fallbackText: {
      fontSize: '14px',
      color: '#64748b',
      marginBottom: '20px',
    },
    downloadBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '10px 24px',
      fontSize: '14px',
      fontWeight: 600,
      color: '#fff',
      background: '#2563eb',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
    },
  };

  // Render preview content
  const renderPreview = () => {
    // Loading state
    if (loading) {
      return (
        <div style={s.loading}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading file...</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    // Error state
    if (error || !blobUrl) {
      return (
        <div style={s.fallback}>
          <div style={{ marginBottom: '16px' }}>{getFileIcon(ext)}</div>
          <p style={s.fallbackTitle}>{file.name}</p>
          <p style={s.fallbackText}>{error || 'Cannot preview this file.'}</p>
          <button type="button" style={s.downloadBtn} onClick={handleDownload}>
            <Download size={16} /> Download File
          </button>
        </div>
      );
    }

    // Images
    if (isImage) {
      return <img src={blobUrl} alt={file.name} style={s.image} />;
    }

    // PDF — iframe with blob URL (same-origin, no CSP issue)
    if (isPdf) {
      return <iframe src={blobUrl} style={s.iframe} title={file.name} />;
    }

    // Text / CSV — show content directly
    if (isText && textContent !== null) {
      return (
        <div style={s.textWrap}>
          <pre style={s.preText}>{textContent}</pre>
        </div>
      );
    }

    // DOCX, XLSX, others — show download fallback
    return (
      <div style={s.fallback}>
        <div style={{ marginBottom: '16px' }}>{getFileIcon(ext)}</div>
        <p style={s.fallbackTitle}>{file.name}</p>
        <p style={s.fallbackText}>
          This file type (.{ext}) cannot be previewed directly in the browser.
          <br />
          Please download to view.
        </p>
        <button type="button" style={s.downloadBtn} onClick={handleDownload}>
          <Download size={16} /> Download File
        </button>
      </div>
    );
  };

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <div style={s.titleWrap}>
            {getFileIcon(ext)}
            <h3 style={s.title}>{file.name}</h3>
            <span style={s.extBadge}>{ext}</span>
          </div>
          <div style={s.actions}>
            <button type="button" style={s.actionBtn} onClick={handleDownload}>
              <Download size={14} /> Download
            </button>
            <button type="button" style={s.closeBtn} onClick={onClose}>
              <X size={22} />
            </button>
          </div>
        </div>
        <div style={s.body}>
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};