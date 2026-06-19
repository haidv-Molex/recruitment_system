import { PoolClient } from "pg";
import type { siteModel } from "@model/site/siteModel";
import type { PaginationQueryMetadata } from "@type/pagination";
import Site from "@services/site/_Site";
import buildPagination from "@utilities/query/buildPagination";
import buildWhereClause from "@utilities/query/buildWhereClause";

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
  const { unlimited, limit, offset } = buildPagination(params);
  const search = params.search ? params.search.trim() : "";

  const values: any[] = [];
  const conditions: string[] = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`site_name ILIKE $${values.length} OR site_code ILIKE $${values.length}`);
  }

  const whereClause = buildWhereClause(conditions);
  const countQuery = `SELECT COUNT(*) AS total FROM site ${whereClause}`;
  let query = `SELECT site_id FROM site ${whereClause}`;

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY site_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    values.push(limit, offset);
    query += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;
  }

  const result = await pool.query(query, values);

  const items = await Promise.all(
    result.rows.map((row) => Site.getById(row.site_id, pool))
  ) satisfies siteModel[];

  return {
    items,
    total
  };
}

export default getAll;
