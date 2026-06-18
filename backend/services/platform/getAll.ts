import { PoolClient } from "pg";
import type { platformModel } from "@model/platform/platformModel";
import type { PaginationQueryMetadata } from "@type/pagination";
import Platform from "@services/platform/_Platform";
import buildPagination from "@utilities/query/buildPagination";
import buildWhereClause from "@utilities/query/buildWhereClause";

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
  const { unlimited, limit, offset } = buildPagination(params);
  const search = params.search ? params.search.trim() : "";

  const values: any[] = [];
  const conditions: string[] = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`platform_name ILIKE $${values.length}`);
  }

  const whereClause = buildWhereClause(conditions);
  const countQuery = `SELECT COUNT(*) AS total FROM platform ${whereClause}`;
  let query = `SELECT platform_id FROM platform ${whereClause}`;

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY platform_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    values.push(limit, offset);
    query += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;
  }

  const result = await pool.query(query, values);

  const items = await Promise.all(
    result.rows.map((row) => Platform.getById(row.platform_id, pool))
  ) satisfies platformModel[];

  return {
    items,
    total
  };
}

export default getAll;
