import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import bcrypt from "bcrypt";

/**
 * So khớp mật khẩu đã hash của người dùng.
 */
async function comparePassword(password: string, userId: number, pool: PoolClient): Promise<boolean> {
  const query = `SELECT user_password FROM "user" WHERE user_id = $1`;
  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  const hashedPassword = result.rows[0].user_password;
  if (!hashedPassword) {
    return false;
  }

  return await bcrypt.compare(password, hashedPassword);
}

export default comparePassword;
