import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import bcrypt from "bcrypt";
import type { userOutputModel } from "@model/user/userModel";

type CreateHRProps = {
  username: string;
  account: string;
  password?: string;
  description?: string;
};

/**
 * Tạo tài khoản mới có vai trò HR.
 */
async function createHR(props: CreateHRProps, pool: PoolClient): Promise<userOutputModel> {
  const { username, account, password, description } = props;

  if (!username || !account) {
    throw new AppError("Tên người dùng và tài khoản là bắt buộc", 400);
  }

  // Kiểm tra tài khoản đã tồn tại chưa
  const checkQuery = `SELECT user_id FROM "user" WHERE user_account = $1`;
  const checkResult = await pool.query(checkQuery, [account]);
  if (checkResult.rows.length > 0) {
    throw new AppError("Tài khoản đã tồn tại trong hệ thống", 409);
  }

  // Hash mật khẩu
  let hashedPassword = null;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  // Thêm người dùng với vai trò 'hr'
  const insertQuery = `
    INSERT INTO "user" (user_name, user_account, user_password, user_description, user_role)
    VALUES ($1, $2, $3, $4, 'hr')
    RETURNING user_id, user_name, user_description, user_role, create_at, update_at
  `;
  const result = await pool.query(insertQuery, [
    username,
    account,
    hashedPassword,
    description || null
  ]);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi tạo tài khoản HR", 500);
  }

  const row = result.rows[0];
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_description: row.user_description,
    user_role: row.user_role,
    create_at: row.create_at,
    update_at: row.update_at
  } satisfies userOutputModel;
}

export default createHR;
