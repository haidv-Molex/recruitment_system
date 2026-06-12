import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  filled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export interface RequestsTableProps {
  requests: any[];
  onDelete: (id: string | number) => void;
}

export default function RequestsTable({ requests, onDelete }: RequestsTableProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
        <p className="text-slate-400 text-sm">No recruitment requests found matching current filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 font-semibold text-slate-800">Request #</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Position</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Department</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Factory</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Quantity</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Status</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Required Date</th>
            <th className="px-6 py-4 font-semibold text-slate-800 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {requests.map((request) => (
            <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 font-semibold text-slate-900">{request.requestNumber}</td>
              <td className="px-6 py-4 font-semibold text-slate-900">{request.position}</td>
              <td className="px-6 py-4 text-slate-600">{request.department}</td>
              <td className="px-6 py-4 text-slate-600">{request.factory}</td>
              <td className="px-6 py-4 font-bold text-slate-800">{request.quantity}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                    statusColors[request.status] || 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {request.status}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-500">
                {request.requiredDate ? new Date(request.requiredDate).toLocaleDateString('vi-VN') : '—'}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1.5">
                  <button
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(request.id)}
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
