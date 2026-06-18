import { PoolClient } from "pg";
import deleteByIds from "@utilities/db/deleteByIds";

async function deleteCompany(
  idOrIds: number | number[],
  pool: PoolClient
): Promise<void> {
  await deleteByIds(pool, "company", "company_id", idOrIds, "Không tìm thấy công ty để xóa");
}

export default deleteCompany;
