import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import bcrypt from "bcrypt";
import type { userOutputModel } from "@model/user/userModel";

type CreateHRProps = {
  username: string;
  account: string;
  password?: string;
  description?: string;
  departmentId?: number;
};

/**
 * Tạo tài khoản mới có vai trò HR.
 */
async function createHR(props: CreateHRProps, pool: PoolClient): Promise<userOutputModel> {
  const { username, account, password, description, departmentId } = props;

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
    WITH inserted AS (
      INSERT INTO "user" (user_name, user_account, user_password, user_description, user_role, department_id)
      VALUES ($1, $2, $3, $4, 'hr', $5)
      RETURNING user_id, user_name, user_description, user_role, department_id, create_at, update_at
    )
    SELECT
      i.user_id, i.user_name, i.user_description, i.user_role,
      i.create_at, i.update_at,
      d.department_id, d.department_code, d.department_name, d.department_description,
      d.create_at AS d_create_at, d.update_at AS d_update_at
    FROM inserted i
    LEFT JOIN department d ON i.department_id = d.department_id
  `;
  const result = await pool.query(insertQuery, [
    username,
    account,
    hashedPassword,
    description || null,
    departmentId || null
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
    update_at: row.update_at,
    department: row.department_id != null ? {
      department_id: row.department_id,
      department_code: row.department_code,
      department_name: row.department_name,
      department_description: row.department_description,
      create_at: row.d_create_at,
      update_at: row.d_update_at
    } : null
  } satisfies userOutputModel;
}

export default createHR;
