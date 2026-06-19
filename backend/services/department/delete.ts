import { PoolClient } from "pg";
import deleteByIds from "@utilities/db/deleteByIds";

async function deleteDepartment(
  idOrIds: number | number[],
  pool: PoolClient
): Promise<void> {
  await deleteByIds(pool, "department", "department_id", idOrIds, "Không tìm thấy phòng ban để xóa");
}

export default deleteDepartment;
