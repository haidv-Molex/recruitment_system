import { PoolClient } from "pg";
import deleteByIds from "@utilities/db/deleteByIds";

async function deleteAccess(
  idOrIds: number | number[],
  pool: PoolClient
): Promise<void> {
  await deleteByIds(pool, "access", "access_id", idOrIds, "Không tìm thấy thông tin phân quyền để xóa");
}

export default deleteAccess;
