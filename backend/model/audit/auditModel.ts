export type auditLogModel = {
  audit_log_id: number;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  record_keys: Record<string, any>;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  changed_by: number | null;
  changed_at: Date;
  transaction_id: string;
};

export type auditLogOutputModel = auditLogModel & {
  changed_by_name: string | null;
};
