import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { levelModel } from "@model/level/levelModel";
import Level from "@services/level/_Level";
import assertFirstRow from "@utilities/db/assertFirstRow";
import buildUpdateSet from "@utilities/db/buildUpdateSet";

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
  const { setClauses, values, nextIndex } = buildUpdateSet([
    { column: "level_code", value: data.level_code },
    { column: "level_name", value: data.level_name },
    { column: "level_description", value: data.level_description }
  ]);

  if (setClauses.length === 0) {
    throw new AppError("Không có trường dữ liệu nào được cung cấp để cập nhật", 400);
  }

  values.push(id);
  const query = `
    UPDATE level
    SET ${setClauses.join(", ")}
    WHERE level_id = $${nextIndex}
    RETURNING level_id
  `;

  const result = await pool.query(query, values);
  const row = assertFirstRow(result.rows, "Không tìm thấy thông tin cấp bậc để cập nhật", 404);

  return await Level.getById(row.level_id, pool);
}

export default update;
