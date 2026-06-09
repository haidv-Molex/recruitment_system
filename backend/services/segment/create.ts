import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { segmentModel } from "@model/segment/segmentModel";

type CreateSegmentData = {
  segment_code?: string | null;
  segment_name: string;
  segment_description?: string | null;
};

async function create(
  data: CreateSegmentData,
  pool: PoolClient
): Promise<segmentModel> {
  const { segment_code = null, segment_name, segment_description = null } = data;

  const query = `
    INSERT INTO segment (segment_code, segment_name, segment_description)
    VALUES ($1, $2, $3)
    RETURNING segment_id, segment_code, segment_name, segment_description, create_at, update_at
  `;
  const result = await pool.query(query, [segment_code, segment_name, segment_description]);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi tạo phân khúc mới", 500);
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

export default create;
