import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

/**
 * Kiểm tra xem người dùng có bị khóa tài khoản không.
 * Throw AppError 403 nếu user_role = 'banned'.
 */
async function checkUserBanned(userId: number, pool: PoolClient): Promise<void> {
  const result = await pool.query(
    `SELECT user_role FROM "user" WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  if (result.rows[0].user_role === "banned") {
    throw new AppError("Tài khoản của bạn đã bị khóa", 403);
  }
}

export default checkUserBanned;

