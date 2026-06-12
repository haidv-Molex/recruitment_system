import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export interface SiteTableProps {
  sites: any[];
  onEdit: (site: any) => void;
  onDelete: (site: any) => void;
  loading: boolean;
}

export default function SiteTable({ sites, onEdit, onDelete, loading }: SiteTableProps) {
  if (loading) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white text-slate-500 font-medium">
        Loading sites...
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
        <p className="text-slate-400 text-sm">No sites found</p>
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
            <th className="px-6 py-4 font-semibold text-slate-800">Site Name</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Description</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Created At</th>
            <th className="px-6 py-4 font-semibold text-slate-800 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sites.map((site) => (
            <tr key={site.site_id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 font-semibold text-slate-900">
                <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                  #{site.site_id}
                </span>
              </td>
              <td className="px-6 py-4 font-bold text-emerald-700 font-mono text-xs uppercase tracking-wide">
                {site.site_code || '—'}
              </td>
              <td className="px-6 py-4 font-semibold text-slate-900">{site.site_name}</td>
              <td className="px-6 py-4 text-slate-600">{site.site_description || '—'}</td>
              <td className="px-6 py-4 text-slate-500">
                {site.created_at ? new Date(site.created_at).toLocaleDateString('vi-VN') : '—'}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => onEdit(site)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(site)}
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
