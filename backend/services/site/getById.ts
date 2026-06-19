import { PoolClient } from "pg";
import type { siteModel } from "@model/site/siteModel";
import assertFirstRow from "@utilities/db/assertFirstRow";

async function getById(
  id: number,
  pool: PoolClient
): Promise<siteModel> {
  const query = `
    SELECT site_id, site_code, site_name, site_description, create_at, update_at
    FROM site
    WHERE site_id = $1
  `;
  const result = await pool.query(query, [id]);
  const row = assertFirstRow(result.rows, "Không tìm thấy địa điểm", 404);

  return {
    site_id: row.site_id,
    site_code: row.site_code,
    site_name: row.site_name,
    site_description: row.site_description,
    create_at: row.create_at,
    update_at: row.update_at
  } satisfies siteModel;
}

export default getById;
