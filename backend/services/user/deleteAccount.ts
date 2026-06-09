import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

/**
 * Xóa tài khoản người dùng bằng user_id.
 */
async function deleteAccount(userId: number, pool: PoolClient): Promise<void> {
  const query = `DELETE FROM "user" WHERE user_id = $1`;
  const result = await pool.query(query, [userId]);

  if (result.rowCount === 0) {
    throw new AppError("Không tìm thấy người dùng để xoá", 404);
  }
}

export default deleteAccount;
