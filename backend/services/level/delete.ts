import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

async function deleteLevel(
  id: number,
  pool: PoolClient
): Promise<void> {
  const checkQuery = `SELECT level_id FROM level WHERE level_id = $1`;
  const checkResult = await pool.query(checkQuery, [id]);

  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy thông tin cấp bậc để xóa", 404);
  }

  const query = `DELETE FROM level WHERE level_id = $1`;
  await pool.query(query, [id]);
}

export default deleteLevel;
