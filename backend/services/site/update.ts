import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { siteModel } from "@model/site/siteModel";

type UpdateSiteData = {
  site_code?: string | null;
  site_name?: string;
  site_description?: string | null;
};

async function update(
  id: number,
  data: UpdateSiteData,
  pool: PoolClient
): Promise<siteModel> {
  const checkQuery = `SELECT site_id FROM site WHERE site_id = $1`;
  const checkResult = await pool.query(checkQuery, [id]);
  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy địa điểm để cập nhật", 404);
  }

  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (data.site_code !== undefined) {
    fields.push(`site_code = $${index++}`);
    values.push(data.site_code);
  }
  if (data.site_name !== undefined) {
    fields.push(`site_name = $${index++}`);
    values.push(data.site_name);
  }
  if (data.site_description !== undefined) {
    fields.push(`site_description = $${index++}`);
    values.push(data.site_description);
  }

  if (fields.length === 0) {
    throw new AppError("Không có dữ liệu thay đổi", 400);
  }

  values.push(id);
  const query = `
    UPDATE site
    SET ${fields.join(", ")}, update_at = CURRENT_TIMESTAMP
    WHERE site_id = $${index}
    RETURNING site_id, site_code, site_name, site_description, create_at, update_at
  `;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi cập nhật địa điểm", 500);
  }

  return {
    site_id: result.rows[0].site_id,
    site_code: result.rows[0].site_code,
    site_name: result.rows[0].site_name,
    site_description: result.rows[0].site_description,
    create_at: result.rows[0].create_at,
    update_at: result.rows[0].update_at
  } satisfies siteModel;
}

export default update;
