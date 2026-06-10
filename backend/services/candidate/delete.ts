import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

export async function deleteCandidate(id: number, pool: PoolClient) {
  const check = await pool.query("SELECT candidate_id FROM candidate WHERE candidate_id = $1", [id]);
  if (check.rows.length === 0) {
    throw new AppError("Không tìm thấy thông tin ứng viên để xóa", 404);
  }

  await pool.query("DELETE FROM candidate WHERE candidate_id = $1", [id]);
}
