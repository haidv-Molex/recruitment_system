import { PoolClient } from "pg";
import type { CandidateDetail } from "@model/candidate_detail/candidate_detailModel";
import assertFirstRow from "@utilities/db/assertFirstRow";
import mapCandidateDetailRow from "./mapCandidateDetailRow";

async function getById(
  id: number,
  pool: PoolClient
): Promise<CandidateDetail> {
  const query = `
    SELECT *
    FROM candidate_detail
    WHERE candidate_detail_id = $1
  `;
  const result = await pool.query(query, [id]);
  const row = assertFirstRow(result.rows, "Không tìm thấy chi tiết ứng viên", 404);

  return mapCandidateDetailRow(row);
}

export default getById;