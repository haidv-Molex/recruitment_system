import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { FilePreviewModal } from '../common/FilePreview';

export interface CVParseResultModalProps {
  parsedData: any;
  file: File;
  onClose: () => void;
}

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
      <div className="space-y-6">
        {/* Basic Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Name</label>
            <div className="text-sm font-semibold text-slate-800 mt-1">{parsedData.name || 'N/A'}</div>
          </div>
          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Current Position</label>
            <div className="text-sm font-semibold text-slate-800 mt-1">{parsedData.current_position || 'N/A'}</div>
          </div>
          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="text-sm font-medium text-slate-800 mt-1">{parsedData.email || 'N/A'}</div>
          </div>
          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
            <div className="text-sm font-medium text-slate-800 mt-1">{parsedData.phone || 'N/A'}</div>
          </div>
          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Years of Experience</label>
            <div className="text-sm font-medium text-slate-800 mt-1">{parsedData.experience_years || 'N/A'}</div>
          </div>
          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Education</label>
            <div className="text-sm font-medium text-slate-800 mt-1">{parsedData.education || 'N/A'}</div>
          </div>
        </div>

        {/* Technical Skills */}
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technical Skills</label>
          <div className="flex flex-wrap gap-1.5">
            {parsedData.skills && parsedData.skills.length > 0 ? (
              parsedData.skills.map((skill: string, idx: number) => (
                <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400 italic">None mentioned</span>
            )}
          </div>
        </div>

        {/* Languages */}
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Languages</label>
          <div className="flex flex-wrap gap-1.5">
            {parsedData.languages && parsedData.languages.length > 0 ? (
              parsedData.languages.map((lang: string, idx: number) => (
                <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
                  {lang}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400 italic">None mentioned</span>
            )}
          </div>
        </div>

        {/* Work Experience */}
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Work Experience Summary</label>
          <div className="bg-white border border-slate-200 rounded-lg p-4 max-h-60 overflow-y-auto">
            {parsedData.work_experience ? (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {parsedData.work_experience}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">No work experience description found</p>
            )}
          </div>
        </div>
      </div>

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </Modal>
  );
}
