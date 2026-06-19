import { PoolClient } from "pg";
import type { levelModel } from "@model/level/levelModel";
import assertFirstRow from "@utilities/db/assertFirstRow";

async function getById(
  id: number,
  pool: PoolClient
): Promise<levelModel> {
  const query = `
    SELECT level_id, level_code, level_name, level_description, create_at, update_at
    FROM level
    WHERE level_id = $1
  `;
  const result = await pool.query(query, [id]);
  const row = assertFirstRow(result.rows, "Không tìm thấy thông tin cấp bậc", 404);

  return {
    level_id: row.level_id,
    level_code: row.level_code,
    level_name: row.level_name,
    level_description: row.level_description,
    create_at: row.create_at,
    update_at: row.update_at
  } satisfies levelModel;
}

export default getById;
