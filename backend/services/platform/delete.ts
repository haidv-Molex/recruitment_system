import { PoolClient } from "pg";
import deleteByIds from "@utilities/db/deleteByIds";

async function deletePlatform(
  idOrIds: number | number[],
  pool: PoolClient
): Promise<void> {
  await deleteByIds(pool, "platform", "platform_id", idOrIds, "Không tìm thấy nền tảng để xóa");
}

export default deletePlatform;
