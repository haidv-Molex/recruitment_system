import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import bcrypt from "bcrypt";

/**
 * Cập nhật mật khẩu mới cho người dùng.
 */
async function updatePassword(userId: number, password: string, pool: PoolClient): Promise<void> {
  if (!password) {
    throw new AppError("Mật khẩu không được để trống", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const query = `UPDATE "user" SET user_password = $1 WHERE user_id = $2`;
  const result = await pool.query(query, [hashedPassword, userId]);

  if (result.rowCount === 0) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }
}

export default updatePassword;
