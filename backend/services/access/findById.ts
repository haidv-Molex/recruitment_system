import { PoolClient } from "pg";
import type { accessOutputModel } from "@model/access/accessModel";
import assertFirstRow from "@utilities/db/assertFirstRow";

async function findById(accessId: number, pool: PoolClient): Promise<accessOutputModel> {
  const query = `
    SELECT 
      a.access_id,
      a.create_at,
      a.update_at,
      u.user_id,
      u.user_name,
      u.user_description,
      u.user_role,
      u.create_at AS user_create_at,
      u.update_at AS user_update_at,
      c.candidate_id,
      c.candidate_code,
      c.candidate_name,
      c.candidate_email,
      c.candidate_phone,
      j.job_id,
      j.job_code,
      j.project
    FROM access a
    JOIN "user" u ON a.user_id = u.user_id
    LEFT JOIN candidate c ON a.candidate_id = c.candidate_id
    LEFT JOIN job j ON a.job_id = j.job_id
    WHERE a.access_id = $1
  `;
  const result = await pool.query(query, [accessId]);
  const row = assertFirstRow(result.rows, "Không tìm thấy thông tin phân quyền", 404);
  
  return {
    access_id: row.access_id,
    user: {
      user_id: row.user_id,
      user_name: row.user_name,
      user_description: row.user_description,
      user_role: row.user_role,
      create_at: row.user_create_at,
      update_at: row.user_update_at
    },
    candidate: row.candidate_id ? {
      candidate_id: row.candidate_id,
      candidate_code: row.candidate_code,
      candidate_name: row.candidate_name,
      candidate_email: row.candidate_email,
      candidate_phone: row.candidate_phone
    } : null,
    job: row.job_id ? {
      job_id: row.job_id,
      job_code: row.job_code,
      project: row.project
    } : null,
    create_at: row.create_at,
    update_at: row.update_at
  } satisfies accessOutputModel;
}

export default findById;
