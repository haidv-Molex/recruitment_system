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
    INSERT INTO "user" (user_name, user_description, department_id, user_role)
    VALUES ($1, $2, $3, 'user')
    RETURNING user_id, user_name, user_description, user_role, department_id, create_at, update_at
  `;
  const result = await pool.query(query, [username, description, departmentId]);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi tạo người dùng mới", 500);
  }

  return {
    user_id: result.rows[0].user_id,
    user_name: result.rows[0].user_name,
    user_description: result.rows[0].user_description,
    user_role: result.rows[0].user_role,
    department_id: result.rows[0].department_id,
    create_at: result.rows[0].create_at,
    update_at: result.rows[0].update_at
  } satisfies userOutputModel;
}

export default create;
