import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { levelModel } from "@model/level/levelModel";

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
    RETURNING level_id, level_code, level_name, level_description, create_at, update_at
  `;
  const result = await pool.query(query, [level_code, level_name, level_description]);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi tạo cấp bậc mới", 500);
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

export default create;
