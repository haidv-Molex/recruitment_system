import { PoolClient } from "pg";
import type { accessModel } from "@model/access/accessModel";
import type { PaginationQueryMetadata } from "@type/pagination";
import buildPagination from "@utilities/query/buildPagination";
import buildWhereClause from "@utilities/query/buildWhereClause";
import findById from "./findById";

type GetAllAccessParams = PaginationQueryMetadata & {
  user_id?: number;
  candidate_id?: number;
  job_id?: number;
};

type GetAllAccessResult = {
  items: accessModel[];
  total: number;
};

async function getAll(
  params: GetAllAccessParams,
  pool: PoolClient
): Promise<GetAllAccessResult> {
  const { unlimited, limit, offset } = buildPagination(params);

  const values: any[] = [];
  const conditions: string[] = [];

  if (params.user_id !== undefined && params.user_id !== null) {
    values.push(params.user_id);
    conditions.push(`user_id = $${values.length}`);
  }

  if (params.candidate_id !== undefined && params.candidate_id !== null) {
    values.push(params.candidate_id);
    conditions.push(`candidate_id = $${values.length}`);
  }

  if (params.job_id !== undefined && params.job_id !== null) {
    values.push(params.job_id);
    conditions.push(`job_id = $${values.length}`);
  }

  const whereClause = buildWhereClause(conditions);
  const countQuery = `SELECT COUNT(*) AS total FROM access ${whereClause}`;
  let query = `SELECT access_id FROM access ${whereClause}`;

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY access_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    values.push(limit, offset);
    query += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;
  }

  const result = await pool.query(query, values);

  const items = await Promise.all(
    result.rows.map((row) => findById(row.access_id, pool))
  ) satisfies accessModel[];

  return {
    items,
    total
  };
}

export default getAll;
