import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { siteModel } from "@model/site/siteModel";

type CreateSiteData = {
  site_code?: string | null;
  site_name: string;
  site_description?: string | null;
};

async function create(
  data: CreateSiteData,
  pool: PoolClient
): Promise<siteModel> {
  const { site_code = null, site_name, site_description = null } = data;

  const query = `
    INSERT INTO site (site_code, site_name, site_description)
    VALUES ($1, $2, $3)
    RETURNING site_id, site_code, site_name, site_description, create_at, update_at
  `;
  const result = await pool.query(query, [site_code, site_name, site_description]);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi tạo địa điểm mới", 500);
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

export default create;
