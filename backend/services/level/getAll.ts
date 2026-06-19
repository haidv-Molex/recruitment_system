import { PoolClient } from "pg";
import type { levelModel } from "@model/level/levelModel";
import type { PaginationQueryMetadata } from "@type/pagination";
import Level from "@services/level/_Level";
import buildPagination from "@utilities/query/buildPagination";
import buildWhereClause from "@utilities/query/buildWhereClause";

type GetAllLevelsParams = PaginationQueryMetadata & {
  search?: string;
};

type GetAllLevelsResult = {
  items: levelModel[];
  total: number;
};

async function getAll(
  params: GetAllLevelsParams,
  pool: PoolClient
): Promise<GetAllLevelsResult> {
  const { unlimited, limit, offset } = buildPagination(params);
  const search = params.search ? params.search.trim() : "";

  const values: any[] = [];
  const conditions: string[] = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`level_name ILIKE $${values.length} OR level_code ILIKE $${values.length}`);
  }

  const whereClause = buildWhereClause(conditions);
  const countQuery = `SELECT COUNT(*) AS total FROM level ${whereClause}`;
  let query = `SELECT level_id FROM level ${whereClause}`;

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY level_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    values.push(limit, offset);
    query += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;
  }

  const result = await pool.query(query, values);

  const items = await Promise.all(
    result.rows.map((row) => Level.getById(row.level_id, pool))
  ) satisfies levelModel[];

  return {
    items,
    total
  };
}

export default getAll;
