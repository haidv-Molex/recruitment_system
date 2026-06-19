import { PoolClient } from "pg";
import type { CandidateDetail } from "@model/candidate_detail/candidate_detailModel";
import CandidateDetailService from "@services/candidate_detail/_CandidateDetail";
import assertFirstRow from "@utilities/db/assertFirstRow";
import type { CandidateDetailWriteData } from "./types";
import { candidateDetailWriteFields } from "./types";
import { prepareCandidateDetailValue } from "./types";

async function create(
  data: CandidateDetailWriteData,
  pool: PoolClient
): Promise<CandidateDetail> {
  const fields = candidateDetailWriteFields
    .filter((field) => data[field] !== undefined)
    .map((field) => ({
      column: field,
      value: prepareCandidateDetailValue(field, data[field])
    }));

  if (fields.length === 0) {
    const result = await pool.query(`
      INSERT INTO candidate_detail DEFAULT VALUES
      RETURNING candidate_detail_id
    `);
    const row = assertFirstRow(result.rows, "Lỗi khi tạo chi tiết ứng viên", 500);
    return await CandidateDetailService.getById(row.candidate_detail_id, pool);
  }

  const columns = fields.map((field) => field.column).join(", ");
  const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");
  const values = fields.map((field) => field.value);

  const query = `
    INSERT INTO candidate_detail (${columns})
    VALUES (${placeholders})
    RETURNING candidate_detail_id
  `;
  const result = await pool.query(query, values);
  const row = assertFirstRow(result.rows, "Lỗi khi tạo chi tiết ứng viên", 500);

  return await CandidateDetailService.getById(row.candidate_detail_id, pool);
}

export default create;