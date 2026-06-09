import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { userModel } from "@model/user/userModel";

/**
 * Tạo tài khoản người dùng cơ bản (như OAuth Google).
 */
async function create(email: string, provider: string, displayName: string, pool: PoolClient): Promise<userModel> {
  const checkQuery = `SELECT user_id FROM "user" WHERE user_account = $1`;
  const checkResult = await pool.query(checkQuery, [email]);
  if (checkResult.rows.length > 0) {
    throw new AppError("Tài khoản đã tồn tại", 409);
  }

  const query = `
    INSERT INTO "user" (user_name, user_account, user_role)
    VALUES ($1, $2, 'user')
    RETURNING *
  `;
  const result = await pool.query(query, [displayName, email]);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi tạo người dùng mới", 500);
  }

  return result.rows[0] as userModel;
}

export default create;
