import { PoolClient } from "pg";
import type { accessModel } from "@model/access/accessModel";
import assertFirstRow from "@utilities/db/assertFirstRow";

async function findById(accessId: number, pool: PoolClient): Promise<accessModel> {
  const query = `
    SELECT access_id, user_id, candidate_id, job_id, create_at, update_at
    FROM access
    WHERE access_id = $1
  `;
  const result = await pool.query(query, [accessId]);
  const row = assertFirstRow(result.rows, "Không tìm thấy thông tin phân quyền", 404);
  return {
    access_id: row.access_id,
    user_id: row.user_id,
    candidate_id: row.candidate_id,
    job_id: row.job_id,
    create_at: row.create_at,
    update_at: row.update_at
  } satisfies accessModel;
}

export default findById;
