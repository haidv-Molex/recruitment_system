import React from 'react';
import { FileText, Eye, Download, Trash2 } from 'lucide-react';
import { formatFileSize } from '../../services/jdData';

export interface JDCardGridProps {
  items: any[];
  onView: (item: any) => void;
  onDownload: (item: any) => void;
  onDelete: (item: any) => void;
}

export default function JDCardGrid({ items, onView, onDownload, onDelete }: JDCardGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-white">
        <FileText className="mx-auto h-10 w-10 text-slate-300 mb-3" />
        <p className="text-slate-400 text-sm font-medium">No Job Descriptions match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4"
        >
          {/* Top segment */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <FileText size={20} />
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  {item.sites}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {item.department}
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-sm line-clamp-1" title={item.jobTitle}>
                {item.jobTitle}
              </h3>
              {item.jobCode && (
                <span className="inline-block mt-0.5 font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  {item.jobCode}
                </span>
              )}
            </div>

            <div className="border-t border-slate-100 pt-2.5 space-y-1">
              <p className="text-xs text-slate-500 font-medium truncate" title={item.fileName}>
                {item.fileName}
              </p>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                <span>{formatFileSize(item.fileSize)} • {item.fileType.toUpperCase()}</span>
                <span>{item.uploadedDate}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-1 border-t border-slate-50 pt-3">
            <button
              onClick={() => onView(item)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors"
              title="View File"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => onDownload(item)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors"
              title="Download File"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => onDelete(item)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-red-600 transition-colors"
              title="Delete JD"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
