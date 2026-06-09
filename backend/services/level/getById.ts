import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { levelModel } from "@model/level/levelModel";

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

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy thông tin cấp bậc", 404);
  }

  return {
    level_id: result.rows[0].level_id,
    level_code: result.rows[0].level_code,
    level_name: result.rows[0].level_name,
    level_description: result.rows[0].level_description,
    create_at: result.rows[0].create_at,
    update_at: result.rows[0].update_at
  } satisfies levelModel;
}

export default getById;
