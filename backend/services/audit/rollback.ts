import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

type RollbackProps = {
  auditLogId: number;
};

// Thứ tự ưu tiên phụ thuộc khóa ngoại (topological sorting order)
const TABLE_ORDER = [
  "company", "file", "level", "platform", "segment", "site", "user", 
  "department", "job", "candidate", "employee_level", "hiring_manager", 
  "job_department", "job_segment", "job_site", "job_title", "access", 
  "candidate_level", "note"
];

// Bản đồ ánh xạ tên cột khóa chính của các bảng đơn
const SINGLE_PK_MAP: Record<string, string> = {
  "company": "company_id",
  "file": "file_id",
  "level": "level_id",
  "platform": "platform_id",
  "segment": "segment_id",
  "site": "site_id",
  "user": "user_id",
  "department": "department_id",
  "job": "job_id",
  "candidate": "candidate_id",
  "access": "access_id",
  "note": "note_id"
};

async function rollback(props: RollbackProps, pool: PoolClient): Promise<boolean> {
  const { auditLogId } = props;

  // 1. Tìm bản ghi log được chọn để xác định transaction_id
  const logRes = await pool.query(
    "SELECT transaction_id FROM audit_log WHERE audit_log_id = $1",
    [auditLogId]
  );
  if (logRes.rows.length === 0) {
    throw new AppError("Không tìm thấy bản ghi lịch sử log để rollback", 404);
  }
  const { transaction_id } = logRes.rows[0];

  // 2. Lấy toàn bộ log thuộc cùng transaction_id đó
  const allLogsRes = await pool.query(
    "SELECT * FROM audit_log WHERE transaction_id = $1",
    [transaction_id]
  );
  const logs = allLogsRes.rows;

  // 3. Phân nhóm và sắp xếp các tác vụ khôi phục ngược
  // Nhóm 1: Rollback của hành động INSERT -> Thực hiện DELETE (Xóa các bản ghi đã được insert trong tx gốc)
  const deleteRollbacks = logs.filter(l => l.action === "INSERT");
  deleteRollbacks.sort((a, b) => TABLE_ORDER.indexOf(b.table_name) - TABLE_ORDER.indexOf(a.table_name));

  // Nhóm 2: Rollback của hành động UPDATE -> Thực hiện UPDATE lại giá trị cũ
  const updateRollbacks = logs.filter(l => l.action === "UPDATE");

  // Nhóm 3: Rollback của hành động DELETE -> Thực hiện INSERT lại dữ liệu cũ
  const insertRollbacks = logs.filter(l => l.action === "DELETE");
  insertRollbacks.sort((a, b) => TABLE_ORDER.indexOf(a.table_name) - TABLE_ORDER.indexOf(b.table_name));

  // --- BƯỚC 3.1: THỰC THI DELETE ---
  for (const log of deleteRollbacks) {
    const { table_name, record_keys } = log;
    const keys = Object.keys(record_keys);
    if (keys.length === 0) continue;

    const whereClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(" AND ");
    const values = keys.map(k => record_keys[k]);

    const query = `DELETE FROM "${table_name}" WHERE ${whereClause}`;
    await pool.query(query, values);
  }

  // --- BƯỚC 3.2: THỰC THI UPDATE ---
  for (const log of updateRollbacks) {
    const { table_name, record_keys, old_data } = log;
    if (!old_data) continue;

    const updateKeys = Object.keys(old_data);
    if (updateKeys.length === 0) continue;

    const setClause = updateKeys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
    const values = updateKeys.map(k => old_data[k]);

    const keyKeys = Object.keys(record_keys);
    const whereClause = keyKeys.map((k, i) => `"${k}" = $${updateKeys.length + i + 1}`).join(" AND ");
    const keyValues = keyKeys.map(k => record_keys[k]);

    const query = `UPDATE "${table_name}" SET ${setClause} WHERE ${whereClause}`;
    await pool.query(query, [...values, ...keyValues]);
  }

  // --- BƯỚC 3.3: THỰC THI INSERT ---
  for (const log of insertRollbacks) {
    const { table_name, old_data } = log;
    if (!old_data) continue;

    const keys = Object.keys(old_data);
    if (keys.length === 0) continue;

    const columns = keys.map(k => `"${k}"`).join(", ");
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const values = keys.map(k => old_data[k]);

    const query = `INSERT INTO "${table_name}" (${columns}) VALUES (${placeholders})`;
    await pool.query(query, values);

    // Cập nhật lại SEQUENCE cho các bảng có SERIAL PRIMARY KEY để tránh xung đột khóa chính về sau
    const pkCol = SINGLE_PK_MAP[table_name];
    if (pkCol) {
      try {
        const seqQuery = `
          SELECT setval(
            pg_get_serial_sequence($1, $2), 
            COALESCE((SELECT MAX("${pkCol}") FROM "${table_name}"), 0)
          )
        `;
        await pool.query(seqQuery, [table_name, pkCol]);
      } catch (seqErr) {
        // Bỏ qua lỗi nếu bảng không sử dụng serial sequence thông thường
        console.warn(`Không thể cập nhật sequence cho bảng ${table_name}:`, seqErr);
      }
    }
  }

  return true;
}

export default rollback;
