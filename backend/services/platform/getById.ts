import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { platformModel } from "@model/platform/platformModel";

async function getById(
  id: number,
  pool: PoolClient
): Promise<platformModel> {
  const query = `
    SELECT platform_id, platform_name, platform_description
    FROM platform
    WHERE platform_id = $1
  `;
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy nền tảng", 404);
  }

  return {
    platform_id: result.rows[0].platform_id,
    platform_name: result.rows[0].platform_name,
    platform_description: result.rows[0].platform_description
  } satisfies platformModel;
}

export default getById;
