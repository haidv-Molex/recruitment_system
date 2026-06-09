import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { jobOutputModel } from "@model/job/jobModel";
import { populateJobRelations } from "./populate";

async function getById(
  id: number,
  pool: PoolClient
): Promise<jobOutputModel> {
  const query = `
    SELECT j.job_id, j.job_code, j.project, j.candidate_required, j.note, j.create_at, j.update_at, j.file_id,
           f.file_path
    FROM job j
    LEFT JOIN file f ON j.file_id = f.file_id
    WHERE j.job_id = $1
  `;
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy thông tin công việc", 404);
  }

  const row = result.rows[0];
  const host = process.env.HOST || "http://localhost:3000";

  const relations = await populateJobRelations(row.job_id, pool);

  return {
    job_id: row.job_id,
    job_code: row.job_code,
    project: row.project,
    candidate_required: row.candidate_required,
    note: row.note,
    create_at: row.create_at,
    update_at: row.update_at,
    file: row.file_id ? {
      file_id: row.file_id,
      file_path: row.file_path,
      file_url: `${host}/file/${row.file_path}`
    } : null,
    ...relations
  } satisfies jobOutputModel;
}

export default getById;
