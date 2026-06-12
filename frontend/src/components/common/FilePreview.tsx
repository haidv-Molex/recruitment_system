import { useEffect, useState } from 'react';
import { Download, FileText, FileSpreadsheet, File, Image as ImageIcon, Loader2 } from 'lucide-react';
import axiosInstance from '../../config/axiosInstance';
import Modal from '../ui/Modal';
import Button from './Button';

// Get file extension from filename
export const getExtension = (filename: string) => {
  if (!filename) return '';
  return filename.split('.').pop()?.toLowerCase() || '';
};

// Get icon based on file type
const getFileIcon = (ext: string) => {
  if (['pdf'].includes(ext)) return <FileText size={20} className="text-red-600" />;
  if (['doc', 'docx', 'txt'].includes(ext)) return <FileText size={20} className="text-blue-600" />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet size={20} className="text-emerald-600" />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon size={20} className="text-purple-600" />;
  return <File size={20} className="text-slate-500" />;
};

// Get MIME type from extension
export const getMimeType = (ext: string) => {
  const mimeMap: Record<string, string> = {
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

interface FileBadgeProps {
  file?: { name: string; url?: string };
  onClick?: () => void;
}

// File badge shown in table cell
export function FileBadge({ file, onClick }: FileBadgeProps) {
  if (!file) return <span className="text-slate-400 text-xs">—</span>;

  const ext = getExtension(file.name);

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors max-w-[160px] truncate"
      title={'Preview: ' + file.name}
    >
      {getFileIcon(ext)}
      <span className="truncate">{file.name}</span>
    </button>
  );
}

interface FileLinkProps {
  file?: { name: string; url?: string };
  onClick?: () => void;
}

// File link shown in JobForm (edit mode)
export function FileLink({ file, onClick }: FileLinkProps) {
  if (!file) return null;

  const ext = getExtension(file.name);

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg mb-2">
      {getFileIcon(ext)}
      <button
        type="button"
        onClick={onClick}
        className="flex-1 text-xs font-semibold text-blue-600 bg-transparent border-none cursor-pointer text-left hover:underline truncate"
        title={'Preview: ' + file.name}
      >
        {file.name}
      </button>
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{ext}</span>
    </div>
  );
}

interface FilePreviewModalProps {
  file?: { name: string; url?: string };
  onClose: () => void;
}

// Full-screen file preview modal
export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
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

    let objectUrl: string | null = null;

    const fetchFile = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axiosInstance.get(file.url!.replace(axiosInstance.defaults.baseURL || '', ''), {
          responseType: 'blob',
        });

        const blob = new Blob([response.data], { type: getMimeType(ext) });
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);

        if (isText) {
          const text = await blob.text();
          setTextContent(text);
        }
      } catch (err) {
        console.error('Failed to fetch file:', err);

        try {
          const response = await fetch(file.url!);
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

  // Render preview content
  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 text-slate-500 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="text-sm font-medium">Loading file...</span>
        </div>
      );
    }

    if (error || !blobUrl) {
      return (
        <div className="text-center py-12 px-6 flex flex-col items-center">
          <div className="mb-4">{getFileIcon(ext)}</div>
          <p className="text-base font-bold text-slate-900 mb-1">{file.name}</p>
          <p className="text-sm text-slate-500 mb-4">{error || 'Cannot preview this file.'}</p>
          <Button onClick={handleDownload} icon={<Download size={16} />}>
            Download File
          </Button>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center w-full h-full max-h-[60vh] bg-slate-100/50 p-4 rounded-lg">
          <img src={blobUrl} alt={file.name} className="max-w-full max-h-[50vh] object-contain rounded shadow-md" />
        </div>
      );
    }

    if (isPdf) {
      return (
        <iframe
          src={blobUrl}
          className="w-full h-[60vh] border-0 rounded-lg shadow-sm"
          title={file.name}
        />
      );
    }

    if (isText && textContent !== null) {
      return (
        <div className="w-full h-[50vh] overflow-auto p-4 bg-white border border-slate-200 rounded-lg">
          <pre className="font-mono text-xs leading-relaxed text-slate-700 whitespace-pre-wrap break-all margin-0">
            {textContent}
          </pre>
        </div>
      );
    }

    return (
      <div className="text-center py-12 px-6 flex flex-col items-center">
        <div className="mb-4">{getFileIcon(ext)}</div>
        <p className="text-base font-bold text-slate-900 mb-1">{file.name}</p>
        <p className="text-sm text-slate-500 mb-4">
          This file type (.{ext}) cannot be previewed directly in the browser.
          <br />
          Please download to view.
        </p>
        <Button onClick={handleDownload} icon={<Download size={16} />}>
          Download File
        </Button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={file.name}
      maxWidthClass="max-w-4xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleDownload} icon={<Download size={16} />}>
            Download
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {renderPreview()}
      </div>
    </Modal>
  );
}
