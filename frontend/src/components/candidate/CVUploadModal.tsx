import React, { useState } from 'react';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../common/Button';
import { parseCVApi } from '../../services/candidateApi';

export interface CVUploadModalProps {
  onParsed: (data: any, file: File) => void;
  onClose: () => void;
}

export default function CVUploadModal({ onParsed, onClose }: CVUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (['pdf', 'docx'].includes(ext || '')) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Định dạng tệp không hỗ trợ. Vui lòng chọn tệp PDF hoặc DOCX.');
    }
  };

  const handleParse = async () => {
    if (!file) {
      setError('Vui lòng chọn một tệp CV.');
      return;
    }

    setParsing(true);
    setError('');

    try {
      const data = await parseCVApi(file);
      onParsed(data, file);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi phân tích CV.');
    } finally {
      setParsing(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="📄 Tải lên & Phân tích CV bằng AI"
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Dropzone */}
        {!file ? (
          <div
            onClick={() => document.getElementById('cv-file-input')?.click()}
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
                validateAndSetFile(selected);
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
              Kéo thả tệp CV vào đây, hoặc click để chọn tệp
            </p>
            <p className="text-xs text-slate-400 mt-1">Hỗ trợ định dạng .pdf, .docx</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl shadow-sm transition-all animate-fadeIn">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
              <FileText size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
              <p className="text-xs text-slate-400 font-medium">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            {!parsing && (
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                onClick={() => setFile(null)}
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        <input
          id="cv-file-input"
          type="file"
          className="hidden"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          disabled={parsing}
        />

        {error && (
          <div className="bg-red-50 text-red-600 text-xs px-3.5 py-2 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {parsing && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500 font-medium">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            <span>AI đang đọc và phân tích cấu trúc CV...</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={parsing}>
            Hủy
          </Button>
          <Button onClick={handleParse} disabled={!file || parsing} isLoading={parsing}>
            Phân tích CV
          </Button>
        </div>
      </div>
    </Modal>
  );
}
