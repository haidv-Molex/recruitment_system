import { PoolClient } from "pg";
import type { levelModel } from "@model/level/levelModel";
import Level from "@services/level/_Level";
import assertFirstRow from "@utilities/db/assertFirstRow";

type CreateLevelData = {
  level_code?: string | null;
  level_name: string;
  level_description?: string | null;
};

async function create(
  data: CreateLevelData,
  pool: PoolClient
): Promise<levelModel> {
  const { level_code = null, level_name, level_description = null } = data;

  const query = `
    INSERT INTO level (level_code, level_name, level_description)
    VALUES ($1, $2, $3)
    RETURNING level_id
  `;
  const result = await pool.query(query, [level_code, level_name, level_description]);
  const row = assertFirstRow(result.rows, "Lỗi khi tạo cấp bậc mới", 500);

  return await Level.getById(row.level_id, pool);
}

export default create;
