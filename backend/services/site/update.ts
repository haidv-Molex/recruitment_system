import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { siteModel } from "@model/site/siteModel";
import Site from "@services/site/_Site";
import assertFirstRow from "@utilities/db/assertFirstRow";
import buildUpdateSet from "@utilities/db/buildUpdateSet";

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
  assertFirstRow(checkResult.rows, "Không tìm thấy địa điểm để cập nhật", 404);

  const updateSet = buildUpdateSet([
    { column: "site_code", value: data.site_code },
    { column: "site_name", value: data.site_name },
    { column: "site_description", value: data.site_description }
  ]);

  if (updateSet.setClauses.length === 0) {
    throw new AppError("Không có dữ liệu thay đổi", 400);
  }

  const values = updateSet.values;
  values.push(id);
  const query = `
    UPDATE site
    SET ${updateSet.setClauses.join(", ")}, update_at = CURRENT_TIMESTAMP
    WHERE site_id = $${updateSet.nextIndex}
    RETURNING site_id
  `;
  const result = await pool.query(query, values);
  const row = assertFirstRow(result.rows, "Lỗi khi cập nhật địa điểm", 500);

  return await Site.getById(row.site_id, pool);
}

export default update;
