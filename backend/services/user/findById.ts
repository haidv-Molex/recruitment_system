import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { userModel } from "@model/user/userModel";

/**
 * Tìm kiếm người dùng bằng user_id.
 */
async function findById(userId: number, pool: PoolClient): Promise<userModel> {
  const query = `SELECT user_id, user_name, user_description, user_role, department_id, create_at, update_at FROM "user" WHERE user_id = $1`;
  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  return result.rows[0] as userModel;
}

export default findById;
