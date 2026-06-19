import { PoolClient } from "pg";
import type { userModel } from "@model/user/userModel";
import assertFirstRow from "@utilities/db/assertFirstRow";

/**
 * Tìm kiếm người dùng bằng account.
 */
async function findByAccount(account: string, pool: PoolClient): Promise<userModel> {
  const query = `
    SELECT user_id, user_name, user_account, user_password, user_description, user_role, create_at, update_at
    FROM "user"
    WHERE user_account = $1
  `;
  const result = await pool.query(query, [account]);
  const row = assertFirstRow(result.rows, "Tài khoản hoặc mật khẩu không chính xác", 401);
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_account: row.user_account,
    user_password: row.user_password,
    user_description: row.user_description,
    user_role: row.user_role,
    create_at: row.create_at,
    update_at: row.update_at
  } satisfies userModel;
}

export default findByAccount;
