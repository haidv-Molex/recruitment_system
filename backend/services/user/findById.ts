import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";

/**
 * Tìm kiếm người dùng bằng user_id.
 */
async function findById(userId: number, pool: PoolClient): Promise<userOutputModel> {
  const query = `SELECT user_id, user_name, user_description, user_role, department_id, create_at, update_at FROM "user" WHERE user_id = $1`;
  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy người dùng", 404);
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

export default findById;
