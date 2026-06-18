import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";
import User from "@services/user/_User";

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
    RETURNING user_id
  `;
  const result = await pool.query(query, [username, description]);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi tạo người dùng mới", 500);
  }

  return await User.findById(result.rows[0].user_id, pool);
}

export default create;
