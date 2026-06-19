import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import User from "@services/user/_User";
import assertFirstRow from "@utilities/db/assertFirstRow";
import { insertLinkRows } from "@utilities/db/linking";
import type { noteOutputModel } from "@model/note/noteModel";
import { mapNoteRow } from "@services/note/mapper";

type CreateNoteData = {
  user_id: number;
  message: string;
  candidate_id?: number | null;
  job_id?: number | null;
};

async function create(
  data: CreateNoteData,
  pool: PoolClient
): Promise<noteOutputModel> {
  const message = data.message.trim();
  if (!message) {
    throw new AppError("Nội dung note không được để trống", 400);
  }

  if (data.candidate_id == null && data.job_id == null) {
    throw new AppError("Cần gắn note với ứng viên hoặc công việc", 400);
  }

  await User.findById(data.user_id, pool);

  if (data.candidate_id != null) {
    const candidateResult = await pool.query(
      `SELECT candidate_id FROM candidate WHERE candidate_id = $1`,
      [data.candidate_id]
    );
    assertFirstRow(candidateResult.rows, "Không tìm thấy ứng viên để gắn note", 404);
  }

  if (data.job_id != null) {
    const jobResult = await pool.query(
      `SELECT job_id FROM job WHERE job_id = $1`,
      [data.job_id]
    );
    assertFirstRow(jobResult.rows, "Không tìm thấy công việc để gắn note", 404);
  }

  const query = `
    INSERT INTO note (user_id, message)
    VALUES ($1, $2)
    RETURNING note_id, user_id, message, create_at, update_at
  `;
  const result = await pool.query(query, [data.user_id, message]);
  const row = assertFirstRow(result.rows, "Lỗi khi tạo note", 500);

  if (data.candidate_id != null) {
    await insertLinkRows(pool, "candidate_note", [{ candidate_id: data.candidate_id, note_id: row.note_id }]);
  }

  if (data.job_id != null) {
    await insertLinkRows(pool, "job_note", [{ job_id: data.job_id, note_id: row.note_id }]);
  }

  return await mapNoteRow(row, pool);
}

export default create;