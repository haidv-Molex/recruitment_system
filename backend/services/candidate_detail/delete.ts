import { PoolClient } from "pg";
import deleteByIds from "@utilities/db/deleteByIds";

async function deleteCandidateDetail(
  idOrIds: number | number[],
  pool: PoolClient
): Promise<void> {
  await deleteByIds(
    pool,
    "candidate_detail",
    "candidate_detail_id",
    idOrIds,
    "Không tìm thấy chi tiết ứng viên để xóa"
  );
}

export default deleteCandidateDetail;