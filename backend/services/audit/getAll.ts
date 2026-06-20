import { PoolClient } from "pg";
import type { auditLogOutputModel } from "@model/audit/auditModel";

type Props = {
  page: number;
  limit: number;
  table_name?: string;
  action?: string;
  record_id?: number;
  search?: string;
};

type Result = {
  data: auditLogOutputModel[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
  };
};

async function getAll(props: Props, pool: PoolClient): Promise<Result> {
  const { page = 1, limit = 20, table_name, action, record_id, search } = props;
  const offset = (page - 1) * limit;

  let whereClauses: string[] = [];
  let queryParams: any[] = [];

  if (table_name) {
    queryParams.push(table_name);
    whereClauses.push(`l.table_name = $${queryParams.length}`);
  }

  if (action) {
    queryParams.push(action);
    whereClauses.push(`l.action = $${queryParams.length}`);
  }

  if (table_name && record_id) {
    const pkColumn = table_name === "user" ? "user_id" : `${table_name}_id`;
    queryParams.push(String(record_id));
    whereClauses.push(`l.record_keys->>'${pkColumn}' = $${queryParams.length}`);
  }

  if (search) {
    queryParams.push(`%${search}%`);
    const pIndex = queryParams.length;
    whereClauses.push(`(
      l.table_name ILIKE $${pIndex} OR 
      u.user_name ILIKE $${pIndex} OR 
      l.old_data::text ILIKE $${pIndex} OR 
      l.new_data::text ILIKE $${pIndex}
    )`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM audit_log l
    LEFT JOIN "user" u ON l.changed_by = u.user_id
    ${whereSql}
  `;
  const countRes = await pool.query(countQuery, queryParams);
  const totalItems = parseInt(countRes.rows[0].total, 10);

  // Get records paginated
  queryParams.push(limit, offset);
  const limitIndex = queryParams.length - 1;
  const offsetIndex = queryParams.length;

  const dataQuery = `
    SELECT 
      l.audit_log_id,
      l.table_name,
      l.action,
      l.record_keys,
      l.old_data,
      l.new_data,
      l.changed_by,
      l.changed_at,
      l.transaction_id::text as transaction_id,
      u.user_name as changed_by_name
    FROM audit_log l
    LEFT JOIN "user" u ON l.changed_by = u.user_id
    ${whereSql}
    ORDER BY l.changed_at DESC, l.audit_log_id DESC
    LIMIT $${limitIndex} OFFSET $${offsetIndex}
  `;

  const dataRes = await pool.query(dataQuery, queryParams);

  const data: auditLogOutputModel[] = dataRes.rows.map((row) => ({
    audit_log_id: row.audit_log_id,
    table_name: row.table_name,
    action: row.action as any,
    record_keys: row.record_keys,
    old_data: row.old_data,
    new_data: row.new_data,
    changed_by: row.changed_by,
    changed_at: row.changed_at,
    transaction_id: row.transaction_id,
    changed_by_name: row.changed_by_name,
  })) satisfies auditLogOutputModel[];

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
    pagination: {
      current_page: page,
      total_pages: totalPages || 1,
      total_items: totalItems,
    },
  };
}

export default getAll;
