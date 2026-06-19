import { PoolClient } from "pg";
import type { userOutputModel } from "@model/user/userModel";
import findById from "@services/user/findById";
import assertFirstRow from "@utilities/db/assertFirstRow";

/**
 * Tạo tài khoản người dùng cơ bản (máy tạo).
 */
async function create(
  data: {
    username: string;
    description?: string;
  },
  pool: PoolClient
): Promise<userOutputModel> {
  const { username, description = null } = data;
  const query = `
    INSERT INTO "user" (user_name, user_description, user_role)
    VALUES ($1, $2, 'user')
    RETURNING user_id
  `;
  const result = await pool.query(query, [username, description]);
  const row = assertFirstRow(result.rows, "Lỗi khi tạo người dùng mới", 500);

  return await findById(row.user_id, pool);
}

export default create;
