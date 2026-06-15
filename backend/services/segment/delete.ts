import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

async function deleteSegment(
  idOrIds: number | number[],
  pool: PoolClient
): Promise<void> {
  const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
  if (ids.length === 0) return;

  const checkQuery = `SELECT segment_id FROM segment WHERE segment_id = ANY($1::int[])`;
  const checkResult = await pool.query(checkQuery, [ids]);
  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy phân khúc để xóa", 404);
  }

  const query = `
    DELETE FROM segment
    WHERE segment_id = ANY($1::int[])
  `;
  await pool.query(query, [ids]);
}

export default deleteSegment;
