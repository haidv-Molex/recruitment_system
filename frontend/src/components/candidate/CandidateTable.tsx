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
  const formatDate = (value: any) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('vi-VN');
  };

  const joinList = (value: any) => Array.isArray(value) ? value.filter(Boolean).join(', ') : (value || '-');

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
            {[
              'Code',
              'Name',
              'Email',
              'Phone',
              'Status',
              'Job',
              'Source',
              'Agency',
              'Targeted Company',
              'Reference',
              'Current Position',
              'Current Salary',
              'Expected Salary',
              'Offer Date',
              'Onboard Date',
              'Skills',
              'Languages',
              'Note',
              'Actions'
            ].map((header) => (
              <th key={header} className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {candidates.map((candidate) => {
            const detail = candidate.candidate_detail || {};
            const rowId = candidate.candidate_id || candidate.id;

            return (
              <tr
                key={rowId}
                className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                onClick={() => onSelectRow?.(candidate)}
              >
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap" title={candidate.candidate_code || ''}>{candidate.candidate_code || '-'}</td>
                <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap" title={candidate.candidate_name || ''}>{candidate.candidate_name || '-'}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap" title={candidate.candidate_email || ''}>{candidate.candidate_email || '-'}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap" title={candidate.candidate_phone || ''}>{candidate.candidate_phone || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[String(candidate.status || '').toLowerCase()] || 'bg-slate-100 text-slate-800'}`}>
                    {candidate.status || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap" title={`${candidate.job?.job_code || ''} ${candidate.job?.project || ''}`}>
                  {candidate.job?.job_code || candidate.job?.project || '-'}
                </td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap" title={candidate.platform?.platform_name || candidate.platform?.platform_code || ''}>
                  {candidate.platform?.platform_code || candidate.platform?.platform_name || '-'}
                </td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap" title={candidate.agency || ''}>{candidate.agency || '-'}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap" title={candidate.targeted_company?.company_name || ''}>{candidate.targeted_company?.company_name || '-'}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap" title={candidate.reference?.user_name || ''}>{candidate.reference?.user_name || '-'}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap" title={detail.current_position || ''}>{detail.current_position || '-'}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap" title={String(detail.current_salary || '')}>{detail.current_salary || '-'}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap" title={String(detail.expected_salary || '')}>{detail.expected_salary || '-'}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(detail.offer_date)}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(detail.onboard_date)}</td>
                <td className="px-4 py-3 text-slate-600 max-w-[240px] truncate" title={joinList(detail.skills)}>{joinList(detail.skills)}</td>
                <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={joinList(detail.languages)}>{joinList(detail.languages)}</td>
                <td className="px-4 py-3 text-slate-600 max-w-[260px] truncate" title={candidate.note || ''}>{candidate.note || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEdit?.(candidate)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete?.(rowId)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
export default CandidateTable;
