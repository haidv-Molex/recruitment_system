import { Edit2, Trash2, Loader2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  new: 'bg-slate-100 text-slate-800',
  screening: 'bg-blue-100 text-blue-800',
  interviewed: 'bg-purple-100 text-purple-800',
  evaluated: 'bg-amber-100 text-amber-800',
  offered: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  onboarding: 'bg-indigo-100 text-indigo-800',
  hired: 'bg-emerald-100 text-emerald-800',
};

export interface CandidateTableProps {
  candidates: any[];
  onEdit?: (candidate: any) => void;
  onDelete?: (id: number | string) => void;
  onSelectRow?: (candidate: any) => void;
  loading?: boolean;
}

export function CandidateTable({
  candidates,
  onEdit,
  onDelete,
  onSelectRow,
  loading = false,
}: CandidateTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-10 w-10 text-emerald-600" />
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
        <p className="text-slate-400 text-sm">No candidates found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 font-semibold text-slate-800">Name</th>
            <th className="px-6 py-3 font-semibold text-slate-800">Position</th>
            <th className="px-6 py-3 font-semibold text-slate-800">Department</th>
            <th className="px-6 py-3 font-semibold text-slate-800">Status</th>
            <th className="px-6 py-3 font-semibold text-slate-800">Applied Date</th>
            <th className="px-6 py-3 font-semibold text-slate-800">Score</th>
            <th className="px-6 py-3 font-semibold text-slate-800">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {candidates.map((candidate) => (
            <tr
              key={candidate.id}
              className="hover:bg-slate-50/50 cursor-pointer transition-colors"
              onClick={() => onSelectRow?.(candidate)}
            >
              <td className="px-6 py-4 font-semibold text-slate-900">{candidate.fullName}</td>
              <td className="px-6 py-4 text-slate-600">{candidate.position}</td>
              <td className="px-6 py-4 text-slate-600">{candidate.department}</td>
              <td className="px-6 py-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[candidate.status] || 'bg-slate-100 text-slate-800'}`}>
                  {candidate.status}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-600">
                {candidate.appliedDate ? new Date(candidate.appliedDate).toLocaleDateString('vi-VN') : '-'}
              </td>
              <td className="px-6 py-4 text-slate-600">
                {candidate.evaluationScore ? `${candidate.evaluationScore}/10` : '-'}
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEdit?.(candidate)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete?.(candidate.id)}
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
export default CandidateTable;
