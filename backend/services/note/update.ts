import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { noteOutputModel } from "@model/note/noteModel";
import assertFirstRow from "@utilities/db/assertFirstRow";
import buildUpdateSet from "@utilities/db/buildUpdateSet";
import getById from "@services/note/getById";
import { insertLinkRows } from "@utilities/db/linking";

type UpdateNoteData = {
  user_id: number;
  message?: string;
  candidate_id?: number | null;
  job_id?: number | null;
};

async function update(
  id: number,
  data: UpdateNoteData,
  pool: PoolClient
): Promise<noteOutputModel> {
  const checkResult = await pool.query(
    `SELECT note_id, user_id FROM note WHERE note_id = $1`,
    [id]
  );
  const existingNote = assertFirstRow(checkResult.rows, "Không tìm thấy note để cập nhật", 404);

  if (existingNote.user_id !== data.user_id) {
    throw new AppError("Bạn không có quyền cập nhật note này", 403);
  }

  const hasCandidateId = Object.prototype.hasOwnProperty.call(data, "candidate_id");
  const hasJobId = Object.prototype.hasOwnProperty.call(data, "job_id");
  const message = data.message !== undefined ? data.message.trim() : undefined;

  if (message !== undefined && !message) {
    throw new AppError("Nội dung note không được để trống", 400);
  }

  const { setClauses, values, nextIndex } = buildUpdateSet([
    { column: "message", value: message }
  ]);

  if (setClauses.length === 0 && !hasCandidateId && !hasJobId) {
    throw new AppError("Không có dữ liệu thay đổi", 400);
  }

  if (setClauses.length > 0) {
    values.push(id);
    const query = `
      UPDATE note
      SET ${setClauses.join(", ")}, update_at = CURRENT_TIMESTAMP
      WHERE note_id = $${nextIndex}
    `;
    await pool.query(query, values);
  }

  if (hasCandidateId) {
    await pool.query(`DELETE FROM candidate_note WHERE note_id = $1`, [id]);
    if (data.candidate_id != null) {
      const candidateResult = await pool.query(
        `SELECT candidate_id FROM candidate WHERE candidate_id = $1`,
        [data.candidate_id]
      );
      assertFirstRow(candidateResult.rows, "Không tìm thấy ứng viên để gắn note", 404);
      await insertLinkRows(pool, "candidate_note", [{ candidate_id: data.candidate_id, note_id: id }]);
    }
  }

  if (hasJobId) {
    await pool.query(`DELETE FROM job_note WHERE note_id = $1`, [id]);
    if (data.job_id != null) {
      const jobResult = await pool.query(
        `SELECT job_id FROM job WHERE job_id = $1`,
        [data.job_id]
      );
      assertFirstRow(jobResult.rows, "Không tìm thấy công việc để gắn note", 404);
      await insertLinkRows(pool, "job_note", [{ job_id: data.job_id, note_id: id }]);
    }
  }

  return await getById(id, pool);
}

export default update;