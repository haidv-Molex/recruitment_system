import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { segmentModel } from "@model/segment/segmentModel";
import Segment from "@services/segment/_Segment";
import assertFirstRow from "@utilities/db/assertFirstRow";
import buildUpdateSet from "@utilities/db/buildUpdateSet";

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
  assertFirstRow(checkResult.rows, "Không tìm thấy phân khúc để cập nhật", 404);

  const updateSet = buildUpdateSet([
    { column: "segment_code", value: data.segment_code },
    { column: "segment_name", value: data.segment_name },
    { column: "segment_description", value: data.segment_description }
  ]);

  if (updateSet.setClauses.length === 0) {
    throw new AppError("Không có dữ liệu thay đổi", 400);
  }

  const values = updateSet.values;
  values.push(id);
  const query = `
    UPDATE segment
    SET ${updateSet.setClauses.join(", ")}, update_at = CURRENT_TIMESTAMP
    WHERE segment_id = $${updateSet.nextIndex}
    RETURNING segment_id
  `;
  const result = await pool.query(query, values);
  const row = assertFirstRow(result.rows, "Lỗi khi cập nhật phân khúc", 500);

  return await Segment.getById(row.segment_id, pool);
}

export default update;
