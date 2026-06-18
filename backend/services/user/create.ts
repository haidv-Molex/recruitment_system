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
  },
  pool: PoolClient
): Promise<userOutputModel> {
  const { username, description = null } = data;
  const query = `
    INSERT INTO "user" (user_name, user_description, user_role)
    VALUES ($1, $2, 'user')
    RETURNING user_id, user_name, user_description, user_role, create_at, update_at
  `;
  const result = await pool.query(query, [username, description]);

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
    update_at: row.update_at
  } satisfies userOutputModel;
}

export default create;
