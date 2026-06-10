import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { segmentModel } from "@model/segment/segmentModel";

type UpdateSegmentData = {
  segment_code?: string | null;
  segment_name?: string;
  segment_description?: string | null;
};

async function update(
  id: number,
  data: UpdateSegmentData,
  pool: PoolClient
): Promise<segmentModel> {
  const checkQuery = `SELECT segment_id FROM segment WHERE segment_id = $1`;
  const checkResult = await pool.query(checkQuery, [id]);
  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy phân khúc để cập nhật", 404);
  }

  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (data.segment_code !== undefined) {
    fields.push(`segment_code = $${index++}`);
    values.push(data.segment_code);
  }
  if (data.segment_name !== undefined) {
    fields.push(`segment_name = $${index++}`);
    values.push(data.segment_name);
  }
  if (data.segment_description !== undefined) {
    fields.push(`segment_description = $${index++}`);
    values.push(data.segment_description);
  }

  if (fields.length === 0) {
    throw new AppError("Không có dữ liệu thay đổi", 400);
  }

  values.push(id);
  const query = `
    UPDATE segment
    SET ${fields.join(", ")}, update_at = CURRENT_TIMESTAMP
    WHERE segment_id = $${index}
    RETURNING segment_id, segment_code, segment_name, segment_description, create_at, update_at
  `;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi cập nhật phân khúc", 500);
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

export default update;
