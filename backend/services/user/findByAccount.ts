import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { userModel } from "@model/user/userModel";

/**
 * Tìm kiếm người dùng bằng account.
 */
async function findByAccount(account: string, pool: PoolClient): Promise<userModel> {
  const query = `SELECT * FROM "user" WHERE user_account = $1`;
  const result = await pool.query(query, [account]);

  if (result.rows.length === 0) {
    throw new AppError("Tài khoản hoặc mật khẩu không chính xác", 401);
  }

  return result.rows[0] as userModel;
}

export default findByAccount;
