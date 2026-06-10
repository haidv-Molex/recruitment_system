import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { siteModel } from "@model/site/siteModel";

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

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy địa điểm", 404);
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

export default getById;
