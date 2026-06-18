import { PoolClient } from "pg";
import type { segmentModel } from "@model/segment/segmentModel";
import assertFirstRow from "@utilities/db/assertFirstRow";

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
  const row = assertFirstRow(result.rows, "Không tìm thấy phân khúc", 404);

  return {
    segment_id: row.segment_id,
    segment_code: row.segment_code,
    segment_name: row.segment_name,
    segment_description: row.segment_description,
    create_at: row.create_at,
    update_at: row.update_at
  } satisfies segmentModel;
}

export default getById;
