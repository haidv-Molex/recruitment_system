import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { FilePreviewModal } from '../common/FilePreview';
import ParsedCVDisplay from './ParsedCVDisplay';

export interface CVParseResultModalProps {
  parsedData: any;
  file: File;
  onClose: () => void;
}

const QUALITY_BADGE: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  B: 'bg-blue-100 text-blue-700 border-blue-200',
  C: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  D: 'bg-red-100 text-red-700 border-red-200',
};

export default function CVParseResultModal({ parsedData, file, onClose }: CVParseResultModalProps) {
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const modalTitle = (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="font-semibold text-slate-800">✨ AI CV Parsing Result</span>
      {parsedData.quality_grade && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${QUALITY_BADGE[parsedData.quality_grade] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          Grade {parsedData.quality_grade}
        </span>
      )}
      {fileUrl && (
        <span
          onClick={() => {
            setPreviewFile({
              file_name: file.name,
              file_path: fileUrl,
              file_url: fileUrl,
            });
          }}
          className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200 cursor-pointer transition-colors max-w-[240px] truncate"
          title="Xem lại CV gốc"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Xem lại CV
        </span>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={modalTitle}
      maxWidthClass="max-w-4xl"
    >
      <ParsedCVDisplay parsedData={parsedData} />

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </Modal>
  );
}