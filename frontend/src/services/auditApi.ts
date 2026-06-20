import axiosInstance from '@/config/axiosInstance';
import type { PaginationMetadata } from '@/types/pagination';

export async function fetchAuditLogsApi({
  page = 1,
  limit = 20,
  tableName = '',
  action = '',
  recordId,
  search = '',
}: {
  page?: number;
  limit?: number;
  tableName?: string;
  action?: string;
  recordId?: number;
  search?: string;
} = {}): Promise<{ data: any[]; pagination?: PaginationMetadata }> {
  const params: Record<string, any> = { page, limit };
  if (tableName) params.table_name = tableName;
  if (action) params.action = action;
  if (recordId !== undefined) params.record_id = recordId;
  if (search.trim()) params.search = search.trim();

  const response = await axiosInstance.get('/audit', { params });
  return {
    data: response.data.data || [],
    pagination: response.data.pagination,
  };
}

export async function rollbackAuditApi(auditLogId: number): Promise<boolean> {
  const response = await axiosInstance.post('/audit/rollback', { audit_log_id: auditLogId });
  return response.data.result;
}
