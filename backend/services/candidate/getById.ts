import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import { populateCandidateRelations } from "./populate";

export async function getById(id: number, pool: PoolClient) {
  const query = "SELECT * FROM candidate WHERE candidate_id = $1";
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy thông tin ứng viên", 404);
  }

  return await populateCandidateRelations(result.rows[0], pool);
}
