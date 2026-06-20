import { useEffect, useState } from 'react';
import { Clock, Undo, ArrowRight, User } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { fetchAuditLogsApi, rollbackAuditApi } from '@/services/auditApi';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/components/ui/ConfirmModal';

interface Props {
  tableName: string;
  recordId: number;
  recordLabel: string;
  isOpen: boolean;
  onClose: () => void;
  onRollbackSuccess?: () => void;
}

export default function AuditHistoryModal({ tableName, recordId, recordLabel, isOpen, onClose, onRollbackSuccess }: Props) {
  const confirm = useConfirm();
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetchAuditLogsApi({ tableName, recordId, limit: 100 });
      setLogs(res.data || []);
    } catch (err: any) {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadHistory();
  }, [isOpen, tableName, recordId]);

  const handleRollback = async (logId: number) => {
    const isConfirmed = await confirm(
      "Bạn có chắc chắn muốn khôi phục bản ghi về trạng thái này không? Mọi dữ liệu sửa đổi sau thời điểm này (bao gồm cả các bảng liên kết) sẽ bị hoàn tác."
    );
    if (!isConfirmed) return;

    try {
      await rollbackAuditApi(logId);
      toast.success('Hoàn tác dữ liệu thành công!');
      onRollbackSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Hoàn tác thất bại');
    }
  };

  // Tự động tính toán những cột nào đã thay đổi dữ liệu
  const renderChanges = (action: string, oldData: any, newData: any) => {
    if (action === 'INSERT') return <span className="text-emerald-600 font-semibold">Tạo mới bản ghi</span>;
    if (action === 'DELETE') return <span className="text-red-600 font-semibold">Xóa bản ghi</span>;

    const changes: React.ReactNode[] = [];
    const keys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
    
    // Bỏ qua các cột timestamps mặc định khi hiển thị
    const ignoredKeys = ['create_at', 'update_at'];

    keys.forEach(key => {
      if (ignoredKeys.includes(key)) return;
      const oldVal = oldData?.[key];
      const newVal = newData?.[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push(
          <div key={key} className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 mt-1">
            <span className="font-semibold text-slate-700 capitalize">{key.replace(/_/g, ' ')}:</span>
            <span className="line-through text-slate-400 font-mono bg-slate-50 px-1 rounded">{String(oldVal ?? '—')}</span>
            <ArrowRight size={12} className="text-slate-400" />
            <span className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded font-medium font-mono">{String(newVal ?? '—')}</span>
          </div>
        );
      }
    });

    return changes.length > 0 ? (
      <div className="space-y-1 mt-2 border-t border-slate-100 pt-2">{changes}</div>
    ) : (
      <span className="text-slate-400 text-xs italic">Không có thay đổi dữ liệu chính</span>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Lịch sử thay đổi: ${recordLabel}`} maxWidthClass="max-w-2xl">
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
          <svg className="animate-spin h-7 w-7 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm font-medium">Đang tải lịch sử...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-slate-400 font-medium">
          Chưa có lịch sử thay đổi cho bản ghi này.
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-4 my-4 pl-6 space-y-6">
          {logs.map((log) => (
            <div key={log.audit_log_id} className="relative">
              {/* Timeline Icon Node */}
              <span className={`absolute -left-[33px] top-0.5 rounded-full p-1.5 text-white ${
                log.action === 'INSERT' ? 'bg-emerald-500' : log.action === 'DELETE' ? 'bg-red-500' : 'bg-indigo-500'
              }`}>
                <Clock size={12} />
              </span>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                    <User size={12} className="text-slate-400" />
                    <span className="text-slate-700">{log.changed_by_name || 'Hệ thống'}</span>
                    <span>•</span>
                    <span>{new Date(log.changed_at).toLocaleString('vi-VN')}</span>
                    <span>•</span>
                    <span className={`px-1.5 py-0.5 rounded uppercase text-[9px] font-bold ${
                      log.action === 'INSERT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      log.action === 'DELETE' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {log.action}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleRollback(log.audit_log_id)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-2.5 py-1 transition-all cursor-pointer"
                  >
                    <Undo size={10} />
                    <span>Hoàn tác về đây</span>
                  </button>
                </div>

                {renderChanges(log.action, log.old_data, log.new_data)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
