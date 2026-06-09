import { PoolClient } from "pg";
import type { siteModel } from "@model/site/siteModel";
import type { PaginationQueryMetadata } from "@type/pagination";

type GetAllSitesParams = PaginationQueryMetadata & {
  search?: string;
};

type GetAllSitesResult = {
  items: siteModel[];
  total: number;
};

async function getAll(
  params: GetAllSitesParams,
  pool: PoolClient
): Promise<GetAllSitesResult> {
  const unlimited = params.unlimited === true;
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const offset = (page - 1) * limit;
  const search = params.search ? params.search.trim() : "";

  let countQuery = `SELECT COUNT(*) AS total FROM site`;
  let query = `SELECT site_id, site_code, site_name, site_description, create_at, update_at FROM site`;
  const values: any[] = [];
  let index = 1;

  if (search) {
    const filter = ` WHERE site_name ILIKE $${index} OR site_code ILIKE $${index}`;
    countQuery += filter;
    query += filter;
    values.push(`%${search}%`);
    index++;
  }

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY site_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    query += ` LIMIT $${index++} OFFSET $${index++}`;
    values.push(limit, offset);
  }

  const result = await pool.query(query, values);

  const items = result.rows.map((row) => ({
    site_id: row.site_id,
    site_code: row.site_code,
    site_name: row.site_name,
    site_description: row.site_description,
    create_at: row.create_at,
    update_at: row.update_at
  })) satisfies siteModel[];

  return {
    items,
    total
  };
}

export default getAll;
