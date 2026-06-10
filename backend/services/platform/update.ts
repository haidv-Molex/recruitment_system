import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { platformModel } from "@model/platform/platformModel";

type UpdatePlatformData = {
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
  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy nền tảng để cập nhật", 404);
  }

  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (data.platform_name !== undefined) {
    fields.push(`platform_name = $${index++}`);
    values.push(data.platform_name);
  }
  if (data.platform_description !== undefined) {
    fields.push(`platform_description = $${index++}`);
    values.push(data.platform_description);
  }

  if (fields.length === 0) {
    throw new AppError("Không có dữ liệu thay đổi", 400);
  }

  values.push(id);
  const query = `
    UPDATE platform
    SET ${fields.join(", ")}
    WHERE platform_id = $${index}
    RETURNING platform_id, platform_name, platform_description
  `;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi cập nhật nền tảng", 500);
  }

  return {
    platform_id: result.rows[0].platform_id,
    platform_name: result.rows[0].platform_name,
    platform_description: result.rows[0].platform_description
  } satisfies platformModel;
}

export default update;
