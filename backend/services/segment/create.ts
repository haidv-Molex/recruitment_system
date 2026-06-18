import { PoolClient } from "pg";
import type { segmentModel } from "@model/segment/segmentModel";
import Segment from "@services/segment/_Segment";
import assertFirstRow from "@utilities/db/assertFirstRow";

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
    RETURNING segment_id
  `;
  const result = await pool.query(query, [segment_code, segment_name, segment_description]);
  const row = assertFirstRow(result.rows, "Lỗi khi tạo phân khúc mới", 500);

  return await Segment.getById(row.segment_id, pool);
}

export default create;
