import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

/**
 * Kiểm tra xem người dùng có phải là Admin hay không dựa trên user_id.
 * 
 * @param userId ID của người dùng cần kiểm tra
 * @param pool Connection Pool Client từ PostgreSQL
 * @returns Promise<boolean> true nếu là admin, false nếu ngược lại
 * @throws AppError nếu không truyền userId hoặc không tìm thấy người dùng
 */
async function isAdmin(userId: number, pool: PoolClient): Promise<boolean> {
  if (userId === undefined || userId === null) {
    throw new AppError("User ID là bắt buộc", 400);
  }

  const query = `SELECT user_role FROM "user" WHERE user_id = $1`;
  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  return result.rows[0].user_role === "admin";
}

export default isAdmin;
