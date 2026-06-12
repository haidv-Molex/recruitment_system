import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export interface CompanyTableProps {
  companies: any[];
  onEdit: (company: any) => void;
  onDelete: (company: any) => void;
  loading: boolean;
}

export default function CompanyTable({ companies, onEdit, onDelete, loading }: CompanyTableProps) {
  if (loading) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white text-slate-500 font-medium">
        Loading companies...
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
        <p className="text-slate-400 text-sm">No companies found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 font-semibold text-slate-800">ID</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Company Name</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Description</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Created At</th>
            <th className="px-6 py-4 font-semibold text-slate-800 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {companies.map((company) => (
            <tr key={company.company_id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 font-semibold text-slate-900">
                <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                  #{company.company_id}
                </span>
              </td>
              <td className="px-6 py-4 font-semibold text-slate-900">{company.company_name}</td>
              <td className="px-6 py-4 text-slate-600">{company.company_description || '—'}</td>
              <td className="px-6 py-4 text-slate-500">
                {company.created_at ? new Date(company.created_at).toLocaleDateString('vi-VN') : '—'}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => onEdit(company)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(company)}
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
