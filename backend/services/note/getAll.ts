import { PoolClient } from "pg";
import type { noteOutputModel } from "@model/note/noteModel";
import type { PaginationQueryMetadata } from "@type/pagination";
import buildPagination from "@utilities/query/buildPagination";
import buildWhereClause from "@utilities/query/buildWhereClause";
import getById from "@services/note/getById";

type GetAllNotesParams = PaginationQueryMetadata & {
  search?: string;
  user_id?: number;
  candidate_id?: number;
  job_id?: number;
};

type GetAllNotesResult = {
  items: noteOutputModel[];
  total: number;
};

async function getAll(
  params: GetAllNotesParams,
  pool: PoolClient
): Promise<GetAllNotesResult> {
  const { unlimited, limit, offset } = buildPagination(params);
  const values: any[] = [];
  const conditions: string[] = [];

  if (params.search?.trim()) {
    values.push(`%${params.search.trim()}%`);
    conditions.push(`n.message ILIKE $${values.length}`);
  }

  if (params.user_id !== undefined) {
    values.push(params.user_id);
    conditions.push(`n.user_id = $${values.length}`);
  }

  if (params.candidate_id !== undefined) {
    values.push(params.candidate_id);
    conditions.push(`EXISTS (SELECT 1 FROM candidate_note cn WHERE cn.note_id = n.note_id AND cn.candidate_id = $${values.length})`);
  }

  if (params.job_id !== undefined) {
    values.push(params.job_id);
    conditions.push(`EXISTS (SELECT 1 FROM job_note jn WHERE jn.note_id = n.note_id AND jn.job_id = $${values.length})`);
  }

  const whereClause = buildWhereClause(conditions);
  const countQuery = `SELECT COUNT(*) AS total FROM note n ${whereClause}`;
  let query = `SELECT n.note_id FROM note n ${whereClause} ORDER BY n.note_id DESC`;

  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  const queryValues = [...values];
  if (!unlimited) {
    queryValues.push(limit, offset);
    query += ` LIMIT $${queryValues.length - 1} OFFSET $${queryValues.length}`;
  }

  const result = await pool.query(query, queryValues);
  const items = await Promise.all(
    result.rows.map((row) => getById(row.note_id, pool))
  ) satisfies noteOutputModel[];

  return { items, total };
}

export default getAll;