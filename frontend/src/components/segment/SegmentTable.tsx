import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export interface SegmentTableProps {
  segments: any[];
  onEdit: (seg: any) => void;
  onDelete: (seg: any) => void;
  loading: boolean;
}

export default function SegmentTable({ segments, onEdit, onDelete, loading }: SegmentTableProps) {
  if (loading) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white text-slate-500 font-medium">
        Loading segments...
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
        <p className="text-slate-400 text-sm">No segments found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 font-semibold text-slate-800">ID</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Code</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Segment Name</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Description</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Created At</th>
            <th className="px-6 py-4 font-semibold text-slate-800 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {segments.map((seg) => (
            <tr key={seg.segment_id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 font-semibold text-slate-900">
                <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                  #{seg.segment_id}
                </span>
              </td>
              <td className="px-6 py-4 font-bold text-emerald-700 font-mono text-xs uppercase tracking-wide">
                {seg.segment_code || '—'}
              </td>
              <td className="px-6 py-4 font-semibold text-slate-900">{seg.segment_name}</td>
              <td className="px-6 py-4 text-slate-600">{seg.segment_description || '—'}</td>
              <td className="px-6 py-4 text-slate-500">
                {seg.created_at ? new Date(seg.created_at).toLocaleDateString('vi-VN') : '—'}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => onEdit(seg)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(seg)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
