import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Undo, Eye, ArrowRight, Search, X } from 'lucide-react';
import ExcelTable from '@/components/ui/ExcelTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import { fetchAuditLogsApi, rollbackAuditApi } from '@/services/auditApi';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { useHeader } from '@/contexts/HeaderContext';

export const AuditLogDashboard = () => {
  const confirm = useConfirm();
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [tableNameFilter, setTableNameFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const loadLogs = useCallback(async (page: number, limit: number, search: string, table: string, action: string) => {
    setLoading(true);
    try {
      const res = await fetchAuditLogsApi({
        page,
        limit,
        search,
        tableName: table,
        action,
      });
      setLogs(res.data || []);
      setTotalItems(res.pagination?.total_items || res.data?.length || 0);
      setCurrentPage(page);
    } catch (err: any) {
      toast.error('Không thể tải nhật ký hoạt động.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLogs(1, pageSize, searchQuery, tableNameFilter, actionFilter);
  }, [pageSize]);

  const handlePageChange = (page: number) => {
    loadLogs(page, pageSize, searchQuery, tableNameFilter, actionFilter);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
  };

  const handleSearch = (colFilters: Record<string, string>, globalSearch: string) => {
    const table = colFilters.table_name || '';
    const act = colFilters.action || '';
    setTableNameFilter(table);
    setActionFilter(act);
    setSearchQuery(globalSearch);
    loadLogs(1, pageSize, globalSearch, table, act);
  };

  const handleRollback = async (log: any) => {
    const isConfirmed = await confirm(
      `Bạn có chắc chắn muốn hoàn tác hành động này? Bản ghi thuộc bảng "${log.table_name}" sẽ được khôi phục về trạng thái trước thời điểm ${new Date(log.changed_at).toLocaleString('vi-VN')}.`
    );
    if (!isConfirmed) return;

    try {
      await rollbackAuditApi(log.audit_log_id);
      toast.success('Hoàn tác dữ liệu thành công!');
      loadLogs(currentPage, pageSize, searchQuery, tableNameFilter, actionFilter);
      if (selectedLog && selectedLog.audit_log_id === log.audit_log_id) {
        setSelectedLog(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Hoàn tác thất bại');
    }
  };

  useHeader({
    title: '🛡️ Audit Logs System',
    subTitle: 'Nhật ký toàn hệ thống và động cơ hoàn tác dữ liệu (Rollback Engine).',
  }, []);

  const columns = useMemo(
    () => [
      { key: 'audit_log_id', label: 'Log ID', width: 80, align: 'center' as const },
      { key: 'table_name', label: 'Bảng nghiệp vụ', width: 150 },
      {
        key: 'action',
        label: 'Hành động',
        width: 120,
        render: (_: any, val: any) => (
          <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
            val === 'INSERT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            val === 'DELETE' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-indigo-50 text-indigo-700 border border-indigo-200'
          }`}>
            {val}
          </span>
        ),
      },
      {
        key: 'record_keys',
        label: 'Khóa bản ghi (Keys)',
        width: 180,
        render: (_: any, val: any) => <span className="font-mono text-xs">{JSON.stringify(val)}</span>
      },
      { key: 'changed_by_name', label: 'Người thực hiện', width: 160 },
      {
        key: 'changed_at',
        label: 'Thời gian',
        width: 180,
        render: (_: any, val: any) => new Date(val).toLocaleString('vi-VN'),
      },
      {
        key: 'transaction_id',
        label: 'Tx ID',
        width: 110,
        render: (_: any, val: any) => <span className="font-mono text-xs text-slate-500">{val || '—'}</span>
      }
    ],
    []
  );

  const tableActions = [
    {
      label: 'Chi tiết',
      icon: <Eye size={14} className="text-slate-600" />,
      onClick: (row: any) => setSelectedLog(row),
    },
    {
      label: 'Hoàn tác về đây',
      icon: <Undo size={14} className="text-indigo-600" />,
      onClick: (row: any) => handleRollback(row),
    },
  ];

  // Hàm hiển thị so sánh dữ liệu chi tiết
  const renderDetailDiff = (log: any) => {
    if (!log) return null;
    const { action, old_data, new_data } = log;

    if (action === 'INSERT') {
      return (
        <div className="space-y-2">
          <p className="font-semibold text-emerald-600">Dữ liệu tạo mới:</p>
          <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono overflow-auto max-h-96 text-slate-800">
            {JSON.stringify(new_data, null, 2)}
          </pre>
        </div>
      );
    }

    if (action === 'DELETE') {
      return (
        <div className="space-y-2">
          <p className="font-semibold text-red-600">Dữ liệu đã bị xóa:</p>
          <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono overflow-auto max-h-96 text-slate-800">
            {JSON.stringify(old_data, null, 2)}
          </pre>
        </div>
      );
    }

    // UPDATE: so sánh từng trường
    const keys = new Set([...Object.keys(old_data || {}), ...Object.keys(new_data || {})]);
    const ignoredKeys = ['create_at', 'update_at'];
    const diffs: any[] = [];

    keys.forEach((key) => {
      if (ignoredKeys.includes(key)) return;
      const oldVal = old_data?.[key];
      const newVal = new_data?.[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diffs.push({ key, oldVal, newVal });
      }
    });

    return (
      <div className="space-y-4">
        <p className="font-semibold text-slate-800">Thay đổi chi tiết ({diffs.length} trường):</p>
        {diffs.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Không có thay đổi trường dữ liệu chính.</p>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2 border-r border-slate-200">Trường</th>
                  <th className="px-4 py-2 border-r border-slate-200">Giá trị cũ</th>
                  <th className="px-4 py-2">Giá trị mới</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {diffs.map((d) => (
                  <tr key={d.key} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-semibold text-slate-700 capitalize border-r border-slate-200 bg-slate-50/20">{d.key.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 text-red-600 font-mono bg-red-50/10 border-r border-slate-200">{String(d.oldVal ?? '—')}</td>
                    <td className="px-4 py-2.5 text-emerald-600 font-mono bg-emerald-50/10">{String(d.newVal ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">JSON Cũ đầy đủ:</p>
            <pre className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] font-mono overflow-auto max-h-48 text-slate-600">
              {JSON.stringify(old_data, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">JSON Mới đầy đủ:</p>
            <pre className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] font-mono overflow-auto max-h-48 text-slate-600">
              {JSON.stringify(new_data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <ExcelTable
          title="Nhật ký hoạt động hệ thống"
          rows={logs}
          columns={columns}
          actions={tableActions}
          onSearch={handleSearch}
          isLoading={loading}
          emptyMessage="Không tìm thấy nhật ký hoạt động nào"
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          itemLabel="logs"
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {selectedLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLog(null)}
          title={
            <div className="flex items-center gap-2">
              <Clock className="text-slate-600" size={20} />
              <span>
                Chi tiết Log #{selectedLog.audit_log_id} | Bảng: {selectedLog.table_name}
              </span>
            </div>
          }
          maxWidthClass="max-w-3xl"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-sm font-semibold border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-700"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleRollback(selectedLog)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer shadow-sm transition-colors"
              >
                <Undo size={14} />
                <span>Hoàn tác trạng thái này</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-xs font-semibold text-slate-600">
              <div>
                <p className="text-slate-400">Người thay đổi</p>
                <p className="text-slate-800 text-sm mt-0.5">{selectedLog.changed_by_name || 'Hệ thống'}</p>
              </div>
              <div>
                <p className="text-slate-400">Thời gian thay đổi</p>
                <p className="text-slate-800 text-sm mt-0.5">{new Date(selectedLog.changed_at).toLocaleString('vi-VN')}</p>
              </div>
              <div>
                <p className="text-slate-400">Transaction ID</p>
                <p className="text-slate-800 text-sm font-mono mt-0.5">{selectedLog.transaction_id || '—'}</p>
              </div>
            </div>

            {renderDetailDiff(selectedLog)}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AuditLogDashboard;
