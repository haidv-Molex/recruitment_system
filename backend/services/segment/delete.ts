import { PoolClient } from "pg";
import deleteByIds from "@utilities/db/deleteByIds";

async function deleteSegment(
  idOrIds: number | number[],
  pool: PoolClient
): Promise<void> {
  await deleteByIds(pool, "segment", "segment_id", idOrIds, "Không tìm thấy phân khúc để xóa");
}

export default deleteSegment;
