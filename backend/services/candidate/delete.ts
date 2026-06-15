import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

export async function deleteCandidate(id: number | number[], pool: PoolClient) {
  const ids = Array.isArray(id) ? id : [id];
  if (ids.length === 0) return;

  const check = await pool.query("SELECT candidate_id FROM candidate WHERE candidate_id = ANY($1)", [ids]);
  if (check.rows.length === 0) {
    throw new AppError("Không tìm thấy thông tin ứng viên để xóa", 404);
  }

  await pool.query("DELETE FROM candidate WHERE candidate_id = ANY($1)", [ids]);
}
