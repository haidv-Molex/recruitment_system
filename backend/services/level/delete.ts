import { PoolClient } from "pg";
import deleteByIds from "@utilities/db/deleteByIds";

async function deleteLevel(
  idOrIds: number | number[],
  pool: PoolClient
): Promise<void> {
  await deleteByIds(pool, "level", "level_id", idOrIds, "Không tìm thấy thông tin cấp bậc để xóa");
}

export default deleteLevel;
