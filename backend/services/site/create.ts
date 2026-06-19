import { PoolClient } from "pg";
import type { siteModel } from "@model/site/siteModel";
import Site from "@services/site/_Site";
import assertFirstRow from "@utilities/db/assertFirstRow";

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
    RETURNING site_id
  `;
  const result = await pool.query(query, [site_code, site_name, site_description]);
  const row = assertFirstRow(result.rows, "Lỗi khi tạo địa điểm mới", 500);

  return await Site.getById(row.site_id, pool);
}

export default create;
