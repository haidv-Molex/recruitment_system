import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

async function deleteSegment(
  id: number,
  pool: PoolClient
): Promise<void> {
  const checkQuery = `SELECT segment_id FROM segment WHERE segment_id = $1`;
  const checkResult = await pool.query(checkQuery, [id]);
  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy phân khúc để xóa", 404);
  }

  const query = `
    DELETE FROM segment
    WHERE segment_id = $1
  `;
  await pool.query(query, [id]);
}

export default deleteSegment;
