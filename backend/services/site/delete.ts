import { PoolClient } from "pg";
import deleteByIds from "@utilities/db/deleteByIds";

async function deleteSite(
  idOrIds: number | number[],
  pool: PoolClient
): Promise<void> {
  await deleteByIds(pool, "site", "site_id", idOrIds, "Không tìm thấy địa điểm để xóa");
}

export default deleteSite;
