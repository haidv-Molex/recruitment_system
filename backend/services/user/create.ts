import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";

/**
 * Tạo tài khoản người dùng cơ bản (máy tạo).
 */
async function create(
  data: {
    username: string;
    description?: string;
    departmentId?: number;
  },
  pool: PoolClient
): Promise<userOutputModel> {
  const { username, description = null, departmentId = null } = data;
  const query = `
    WITH inserted AS (
      INSERT INTO "user" (user_name, user_description, department_id, user_role)
      VALUES ($1, $2, $3, 'user')
      RETURNING user_id, user_name, user_description, user_role, department_id, create_at, update_at
    )
    SELECT
      i.user_id, i.user_name, i.user_description, i.user_role,
      i.create_at, i.update_at,
      d.department_id, d.department_code, d.department_name, d.department_description,
      d.create_at AS d_create_at, d.update_at AS d_update_at
    FROM inserted i
    LEFT JOIN department d ON i.department_id = d.department_id
  `;
  const result = await pool.query(query, [username, description, departmentId]);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi tạo người dùng mới", 500);
  }

  const row = result.rows[0];
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_description: row.user_description,
    user_role: row.user_role,
    create_at: row.create_at,
    update_at: row.update_at,
    department: row.department_id != null ? {
      department_id: row.department_id,
      department_code: row.department_code,
      department_name: row.department_name,
      department_description: row.department_description,
      create_at: row.d_create_at,
      update_at: row.d_update_at
    } : null
  } satisfies userOutputModel;
}

export default create;
