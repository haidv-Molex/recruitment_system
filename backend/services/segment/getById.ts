import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { segmentModel } from "@model/segment/segmentModel";

async function getById(
  id: number,
  pool: PoolClient
): Promise<segmentModel> {
  const query = `
    SELECT segment_id, segment_code, segment_name, segment_description, create_at, update_at
    FROM segment
    WHERE segment_id = $1
  `;
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy phân khúc", 404);
  }

  return {
    segment_id: result.rows[0].segment_id,
    segment_code: result.rows[0].segment_code,
    segment_name: result.rows[0].segment_name,
    segment_description: result.rows[0].segment_description,
    create_at: result.rows[0].create_at,
    update_at: result.rows[0].update_at
  } satisfies segmentModel;
}

export default getById;
