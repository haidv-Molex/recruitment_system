import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import assertFirstRow from "@utilities/db/assertFirstRow";

/**
 * Kiểm tra xem người dùng có bị khóa tài khoản không.
 * Throw AppError 403 nếu user_role = 'banned'.
 */
async function checkUserBanned(userId: number, pool: PoolClient): Promise<void> {
  const result = await pool.query(
    `SELECT user_role FROM "user" WHERE user_id = $1`,
    [userId]
  );
  const row = assertFirstRow(result.rows, "Không tìm thấy người dùng", 404);

  if (row.user_role === "banned") {
    throw new AppError("Tài khoản của bạn đã bị khóa", 403);
  }
}

export default checkUserBanned;

