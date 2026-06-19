import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { platformModel } from "@model/platform/platformModel";
import Platform from "@services/platform/_Platform";
import assertFirstRow from "@utilities/db/assertFirstRow";
import buildUpdateSet from "@utilities/db/buildUpdateSet";

type UpdatePlatformData = {
  platform_code?: string | null;
  platform_name?: string;
  platform_description?: string | null;
};

async function update(
  id: number,
  data: UpdatePlatformData,
  pool: PoolClient
): Promise<platformModel> {
  const checkQuery = `SELECT platform_id FROM platform WHERE platform_id = $1`;
  const checkResult = await pool.query(checkQuery, [id]);
  assertFirstRow(checkResult.rows, "Không tìm thấy nền tảng để cập nhật", 404);

  const { setClauses, values, nextIndex } = buildUpdateSet([
    { column: "platform_code", value: data.platform_code },
    { column: "platform_name", value: data.platform_name },
    { column: "platform_description", value: data.platform_description }
  ]);

  if (setClauses.length === 0) {
    throw new AppError("Không có dữ liệu thay đổi", 400);
  }

  values.push(id);
  const query = `
    UPDATE platform
    SET ${setClauses.join(", ")}
    WHERE platform_id = $${nextIndex}
    RETURNING platform_id
  `;
  const result = await pool.query(query, values);
  const row = assertFirstRow(result.rows, "Lỗi khi cập nhật nền tảng", 500);

  return await Platform.getById(row.platform_id, pool);
}

export default update;
