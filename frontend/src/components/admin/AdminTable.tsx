import { Edit2, Trash2, Shield, User, Eye } from 'lucide-react';

const roleColors: Record<string, string> = {
  admin: 'bg-red-50 text-red-700 border-red-200',
  hr: 'bg-blue-50 text-blue-700 border-blue-200',
  recruiter: 'bg-blue-50 text-blue-700 border-blue-200',
  viewer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const getRoleIcon = (role: string) => {
  if (role === 'admin') return <Shield size={14} className="text-red-500" />;
  if (role === 'viewer') return <Eye size={14} className="text-emerald-500" />;
  return <User size={14} className="text-blue-500" />;
};

export interface AdminTableProps {
  users: any[];
  currentUser: any;
  onEdit: (user: any) => void;
  onDelete: (user: any) => void;
}

export default function AdminTable({ users, currentUser, onEdit, onDelete }: AdminTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
        <p className="text-slate-400 text-sm">No accounts found matching current filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 font-semibold text-slate-800">User Name</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Code</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Account</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Role</th>
            <th className="px-6 py-4 font-semibold text-slate-800">Status</th>
            <th className="px-6 py-4 font-semibold text-slate-800 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => {
            const isSelf = currentUser && u.user_id === currentUser.user_id;
            return (
              <tr key={u.user_id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-900">
                  <div className="flex items-center gap-1.5">
                    {u.user_name}
                    {isSelf && (
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        You
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{u.user_code || '—'}</td>
                <td className="px-6 py-4 text-slate-600">{u.user_account}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      roleColors[u.user_role] || 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    {getRoleIcon(u.user_role)}
                    <span className="capitalize">{u.user_role}</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                      u.status === 'banned'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    {u.status || 'active'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => onEdit(u)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(u)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-red-600 transition-colors"
                      title="Delete"
                      disabled={isSelf}
                    >
                      <Trash2 size={16} className={isSelf ? 'opacity-30' : ''} />
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
