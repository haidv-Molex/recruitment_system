import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { levelModel } from "@model/level/levelModel";

type UpdateLevelData = {
  level_code?: string | null;
  level_name?: string;
  level_description?: string | null;
};

async function update(
  id: number,
  data: UpdateLevelData,
  pool: PoolClient
): Promise<levelModel> {
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (data.level_code !== undefined) {
    fields.push(`level_code = $${index++}`);
    values.push(data.level_code);
  }
  if (data.level_name !== undefined) {
    fields.push(`level_name = $${index++}`);
    values.push(data.level_name);
  }
  if (data.level_description !== undefined) {
    fields.push(`level_description = $${index++}`);
    values.push(data.level_description);
  }

  if (fields.length === 0) {
    throw new AppError("Không có trường dữ liệu nào được cung cấp để cập nhật", 400);
  }

  values.push(id);
  const query = `
    UPDATE level
    SET ${fields.join(", ")}
    WHERE level_id = $${index}
    RETURNING level_id, level_code, level_name, level_description, create_at, update_at
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy thông tin cấp bậc để cập nhật", 404);
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

export default update;
