import { PoolClient } from "pg";
import type { userOutputModel } from "@model/user/userModel";
import assertFirstRow from "@utilities/db/assertFirstRow";

/**
 * Tìm kiếm người dùng bằng user_id.
 */
async function findById(userId: number, pool: PoolClient): Promise<userOutputModel> {
  const query = `
    SELECT
      u.user_id, u.user_name, u.user_description, u.user_role,
      u.create_at, u.update_at
    FROM "user" u
    WHERE u.user_id = $1
  `;
  const result = await pool.query(query, [userId]);
  const row = assertFirstRow(result.rows, "Không tìm thấy người dùng", 404);
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_description: row.user_description,
    user_role: row.user_role,
    create_at: row.create_at,
    update_at: row.update_at
  } satisfies userOutputModel;
}

export default findById;
