import React from 'react';
import { ChevronRight, Edit2, Trash2 } from 'lucide-react';

const statusColors = {
  new: 'bg-gray-100 text-gray-800',
  screening: 'bg-blue-100 text-blue-800',
  interviewed: 'bg-purple-100 text-purple-800',
  evaluated: 'bg-yellow-100 text-yellow-800',
  offered: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  onboarding: 'bg-indigo-100 text-indigo-800',
  hired: 'bg-emerald-100 text-emerald-800',
};

export const CandidateTable = ({
  candidates,
  onEdit,
  onDelete,
  onSelectRow,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No candidates found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Applied Date</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Score</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {candidates.map((candidate) => (
            <tr
              key={candidate.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelectRow?.(candidate)}
            >
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{candidate.fullName}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{candidate.position}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{candidate.department}</td>
              <td className="px-6 py-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[candidate.status]}`}>
                  {candidate.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {new Date(candidate.appliedDate).toLocaleDateString('vi-VN')}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {candidate.evaluationScore ? `${candidate.evaluationScore}/10` : '-'}
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEdit?.(candidate)}
                    className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete?.(candidate.id)}
                    className="p-1.5 hover:bg-red-100 rounded text-red-600"
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
};

