import { PoolClient } from "pg";
import type { platformModel } from "@model/platform/platformModel";
import type { PaginationQueryMetadata } from "@type/pagination";

type GetAllPlatformsParams = PaginationQueryMetadata & {
  search?: string;
};

type GetAllPlatformsResult = {
  items: platformModel[];
  total: number;
};

async function getAll(
  params: GetAllPlatformsParams,
  pool: PoolClient
): Promise<GetAllPlatformsResult> {
  const unlimited = params.unlimited === true;
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const offset = (page - 1) * limit;
  const search = params.search ? params.search.trim() : "";

  let countQuery = `SELECT COUNT(*) AS total FROM platform`;
  let query = `SELECT platform_id, platform_name, platform_description FROM platform`;
  const values: any[] = [];
  let index = 1;

  if (search) {
    const filter = ` WHERE platform_name ILIKE $${index++}`;
    countQuery += filter;
    query += filter;
    values.push(`%${search}%`);
  }

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY platform_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    query += ` LIMIT $${index++} OFFSET $${index++}`;
    values.push(limit, offset);
  }

  const result = await pool.query(query, values);

  const items = result.rows.map((row) => ({
    platform_id: row.platform_id,
    platform_name: row.platform_name,
    platform_description: row.platform_description
  })) satisfies platformModel[];

  return {
    items,
    total
  };
}

export default getAll;
