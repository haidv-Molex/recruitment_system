import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

async function deleteJob(
  id: number,
  pool: PoolClient
): Promise<void> {
  const checkQuery = `SELECT job_id FROM job WHERE job_id = $1`;
  const checkResult = await pool.query(checkQuery, [id]);

  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy thông tin công việc để xóa", 404);
  }

  const query = `DELETE FROM job WHERE job_id = $1`;
  await pool.query(query, [id]);
}

export default deleteJob;
