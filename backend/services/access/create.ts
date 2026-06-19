import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { accessModel } from "@model/access/accessModel";

type CreateProps = {
  user_id: number;
  candidate_id?: number | null;
  job_id?: number | null;
};

async function create(props: CreateProps, pool: PoolClient): Promise<accessModel> {
  const { user_id, candidate_id = null, job_id = null } = props;

  // 1. Validation: Exactly one target must be provided
  if ((candidate_id !== null && job_id !== null) || (candidate_id === null && job_id === null)) {
    throw new AppError("Phải cung cấp chính xác candidate_id hoặc job_id", 400);
  }

  // 2. Validate User exists
  const userCheck = await pool.query('SELECT user_id FROM "user" WHERE user_id = $1', [user_id]);
  if (userCheck.rows.length === 0) {
    throw new AppError("Người dùng không tồn tại", 404);
  }

  // 3. Validate Candidate exists (if provided)
  if (candidate_id !== null) {
    const candidateCheck = await pool.query('SELECT candidate_id FROM candidate WHERE candidate_id = $1', [candidate_id]);
    if (candidateCheck.rows.length === 0) {
      throw new AppError("Ứng viên không tồn tại", 404);
    }
  }

  // 4. Validate Job exists (if provided)
  if (job_id !== null) {
    const jobCheck = await pool.query('SELECT job_id FROM job WHERE job_id = $1', [job_id]);
    if (jobCheck.rows.length === 0) {
      throw new AppError("Công việc không tồn tại", 404);
    }
  }

  // 5. Check for duplicate
  const duplicateCheck = await pool.query(
    `SELECT access_id FROM access 
     WHERE user_id = $1 
       AND (candidate_id = $2 OR (candidate_id IS NULL AND $2 IS NULL))
       AND (job_id = $3 OR (job_id IS NULL AND $3 IS NULL))`,
    [user_id, candidate_id, job_id]
  );
  if (duplicateCheck.rows.length > 0) {
    throw new AppError("Thông tin phân quyền đã tồn tại", 400);
  }

  // 6. Insert new record
  const query = `
    INSERT INTO access (user_id, candidate_id, job_id)
    VALUES ($1, $2, $3)
    RETURNING access_id, user_id, candidate_id, job_id, create_at, update_at
  `;
  const result = await pool.query(query, [user_id, candidate_id, job_id]);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi hệ thống khi tạo phân quyền", 500);
  }

  const row = result.rows[0];
  return {
    access_id: row.access_id,
    user_id: row.user_id,
    candidate_id: row.candidate_id,
    job_id: row.job_id,
    create_at: row.create_at,
    update_at: row.update_at
  } satisfies accessModel;
}

export default create;
