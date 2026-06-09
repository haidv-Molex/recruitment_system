import { PoolClient } from "pg";
import type { jobOutputModel } from "@model/job/jobModel";
import type { PaginationQueryMetadata } from "@type/pagination";

type GetAllJobsParams = PaginationQueryMetadata & {
  search?: string;
};

type GetAllJobsResult = {
  items: jobOutputModel[];
  total: number;
};

async function getAll(
  params: GetAllJobsParams,
  pool: PoolClient
): Promise<GetAllJobsResult> {
  const unlimited = params.unlimited === true;
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const offset = (page - 1) * limit;
  const search = params.search ? params.search.trim() : "";

  let countQuery = `SELECT COUNT(*) AS total FROM job j`;
  let query = `
    SELECT j.job_id, j.job_code, j.project, j.candidate_required, j.note, j.create_at, j.update_at, j.file_id,
           f.file_path
    FROM job j
    LEFT JOIN file f ON j.file_id = f.file_id
  `;
  const values: any[] = [];
  let index = 1;

  if (search) {
    const filter = ` WHERE j.job_code ILIKE $${index} OR j.project ILIKE $${index}`;
    countQuery += filter;
    query += filter;
    values.push(`%${search}%`);
    index++;
  }

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY j.job_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    query += ` LIMIT $${index++} OFFSET $${index++}`;
    values.push(limit, offset);
  }

  const result = await pool.query(query, values);
  const host = process.env.HOST || "http://localhost:3000";

  const items = result.rows.map((row) => ({
    job_id: row.job_id,
    job_code: row.job_code,
    project: row.project,
    candidate_required: row.candidate_required,
    note: row.note,
    create_at: row.create_at,
    update_at: row.update_at,
    file_id: row.file_id,
    file: row.file_id ? {
      file_id: row.file_id,
      file_path: row.file_path,
      file_url: `${host}/file/${row.file_path}`
    } : null
  })) satisfies jobOutputModel[];

  return {
    items,
    total
  };
}

export default getAll;
