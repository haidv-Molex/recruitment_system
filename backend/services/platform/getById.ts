import { PoolClient } from "pg";
import type { platformModel } from "@model/platform/platformModel";
import assertFirstRow from "@utilities/db/assertFirstRow";

async function getById(
  id: number,
  pool: PoolClient
): Promise<platformModel> {
  const query = `
    SELECT platform_id, platform_code, platform_name, platform_description
    FROM platform
    WHERE platform_id = $1
  `;
  const result = await pool.query(query, [id]);
  const row = assertFirstRow(result.rows, "Không tìm thấy nền tảng", 404);

  return {
    platform_id: row.platform_id,
    platform_code: row.platform_code,
    platform_name: row.platform_name,
    platform_description: row.platform_description
  } satisfies platformModel;
}

export default getById;
