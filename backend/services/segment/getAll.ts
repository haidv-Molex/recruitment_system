import { PoolClient } from "pg";
import type { segmentModel } from "@model/segment/segmentModel";
import type { PaginationQueryMetadata } from "@type/pagination";
import Segment from "@services/segment/_Segment";
import buildPagination from "@utilities/query/buildPagination";
import buildWhereClause from "@utilities/query/buildWhereClause";

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
  const { unlimited, limit, offset } = buildPagination(params);
  const search = params.search ? params.search.trim() : "";

  const values: any[] = [];
  const conditions: string[] = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`segment_name ILIKE $${values.length} OR segment_code ILIKE $${values.length}`);
  }

  const whereClause = buildWhereClause(conditions);
  const countQuery = `SELECT COUNT(*) AS total FROM segment ${whereClause}`;
  let query = `SELECT segment_id FROM segment ${whereClause}`;

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY segment_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    values.push(limit, offset);
    query += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;
  }

  const result = await pool.query(query, values);

  const items = await Promise.all(
    result.rows.map((row) => Segment.getById(row.segment_id, pool))
  ) satisfies segmentModel[];

  return {
    items,
    total
  };
}

export default getAll;
