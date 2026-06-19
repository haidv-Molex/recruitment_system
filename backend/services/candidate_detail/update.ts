import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { CandidateDetail } from "@model/candidate_detail/candidate_detailModel";
import CandidateDetailService from "@services/candidate_detail/_CandidateDetail";
import assertFirstRow from "@utilities/db/assertFirstRow";
import buildUpdateSet from "@utilities/db/buildUpdateSet";
import type { CandidateDetailWriteData } from "./types";
import { candidateDetailWriteFields } from "./types";
import { prepareCandidateDetailValue } from "./types";

async function update(
  id: number,
  data: CandidateDetailWriteData,
  pool: PoolClient
): Promise<CandidateDetail> {
  const checkResult = await pool.query(
    "SELECT candidate_detail_id FROM candidate_detail WHERE candidate_detail_id = $1",
    [id]
  );
  assertFirstRow(checkResult.rows, "Không tìm thấy chi tiết ứng viên để cập nhật", 404);

  const { setClauses, values, nextIndex } = buildUpdateSet(
    candidateDetailWriteFields.map((field) => ({
      column: field,
      value: prepareCandidateDetailValue(field, data[field])
    }))
  );

  if (setClauses.length === 0) {
    throw new AppError("Không có dữ liệu thay đổi", 400);
  }

  values.push(id);
  const query = `
    UPDATE candidate_detail
    SET ${setClauses.join(", ")}, update_at = CURRENT_TIMESTAMP
    WHERE candidate_detail_id = $${nextIndex}
    RETURNING candidate_detail_id
  `;
  const result = await pool.query(query, values);
  const row = assertFirstRow(result.rows, "Lỗi khi cập nhật chi tiết ứng viên", 500);

  return await CandidateDetailService.getById(row.candidate_detail_id, pool);
}

export default update;