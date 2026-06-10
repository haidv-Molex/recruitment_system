import { PoolClient } from "pg";
import type { levelModel } from "@model/level/levelModel";
import type { PaginationQueryMetadata } from "@type/pagination";

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
  const unlimited = params.unlimited === true;
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const offset = (page - 1) * limit;
  const search = params.search ? params.search.trim() : "";

  let countQuery = `SELECT COUNT(*) AS total FROM level`;
  let query = `SELECT level_id, level_code, level_name, level_description, create_at, update_at FROM level`;
  const values: any[] = [];
  let index = 1;

  if (search) {
    const filter = ` WHERE level_name ILIKE $${index} OR level_code ILIKE $${index}`;
    countQuery += filter;
    query += filter;
    values.push(`%${search}%`);
    index++;
  }

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY level_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    query += ` LIMIT $${index++} OFFSET $${index++}`;
    values.push(limit, offset);
  }

  const result = await pool.query(query, values);

  const items = result.rows.map((row) => ({
    level_id: row.level_id,
    level_code: row.level_code,
    level_name: row.level_name,
    level_description: row.level_description,
    create_at: row.create_at,
    update_at: row.update_at
  })) satisfies levelModel[];

  return {
    items,
    total
  };
}

export default getAll;
