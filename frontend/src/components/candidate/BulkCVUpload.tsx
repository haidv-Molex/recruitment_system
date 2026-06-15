import React, { useRef, useState } from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../common/Button';

const SUPPORTED_TYPES = ['.pdf', '.docx', '.doc', '.txt', '.jpg', '.jpeg', '.png'];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExtension = (name: string) => {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return '';
  return name.slice(dot).toLowerCase();
};

export interface BulkCVUploadProps {
  onUpload: (files: File[]) => void;
  onClose: () => void;
}

export default function BulkCVUpload({ onUpload, onClose }: BulkCVUploadProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList) => {
    const newFiles: any[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = getFileExtension(file.name);

      if (!SUPPORTED_TYPES.includes(ext)) continue;

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

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    setFiles([]);
  };

  const handleUpload = () => {
    onUpload(files.map((f) => f.file));
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="📄 Mass CV Upload"
      maxWidthClass="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500 font-medium">
            {files.length > 0
              ? `${files.length} file(s) ready to upload`
              : 'No files selected'}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={files.length === 0}>
              Upload {files.length > 0 ? `${files.length} File(s)` : ''}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-400 bg-blue-50/30'
              : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload size={28} className="text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Drag & drop multiple CV files here</p>
          <p className="text-xs text-slate-400 mt-1">or click to select files — PDF, DOCX, DOC, TXT, JPG, PNG</p>
        </div>

        {/* File list */}
        {files.length > 0 ? (
          <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">{files.length} file(s) added</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
              >
                Clear All
              </button>
            </div>

            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-all"
              >
                <FileText size={20} className="text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{f.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {formatFileSize(f.size)} • {f.ext.replace('.', '').toUpperCase()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(f.id)}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  title="Remove file"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-400 text-sm py-8">
            No files added yet. Drag & drop or click above to select.
          </p>
        )}
      </div>
    </Modal>
  );
}
