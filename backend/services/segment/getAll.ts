import { PoolClient } from "pg";
import type { segmentModel } from "@model/segment/segmentModel";
import type { PaginationQueryMetadata } from "@type/pagination";

type GetAllSegmentsParams = PaginationQueryMetadata & {
  search?: string;
};

type GetAllSegmentsResult = {
  items: segmentModel[];
  total: number;
};

async function getAll(
  params: GetAllSegmentsParams,
  pool: PoolClient
): Promise<GetAllSegmentsResult> {
  const unlimited = params.unlimited === true;
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const offset = (page - 1) * limit;
  const search = params.search ? params.search.trim() : "";

  let countQuery = `SELECT COUNT(*) AS total FROM segment`;
  let query = `SELECT segment_id, segment_code, segment_name, segment_description, create_at, update_at FROM segment`;
  const values: any[] = [];
  let index = 1;

  if (search) {
    const filter = ` WHERE segment_name ILIKE $${index} OR segment_code ILIKE $${index}`;
    countQuery += filter;
    query += filter;
    values.push(`%${search}%`);
    index++;
  }

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY segment_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    query += ` LIMIT $${index++} OFFSET $${index++}`;
    values.push(limit, offset);
  }

  const result = await pool.query(query, values);

  const items = result.rows.map((row) => ({
    segment_id: row.segment_id,
    segment_code: row.segment_code,
    segment_name: row.segment_name,
    segment_description: row.segment_description,
    create_at: row.create_at,
    update_at: row.update_at
  })) satisfies segmentModel[];

  return {
    items,
    total
  };
}

export default getAll;
