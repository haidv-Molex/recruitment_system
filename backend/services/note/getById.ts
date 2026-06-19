import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { noteOutputModel } from "@model/note/noteModel";
import assertFirstRow from "@utilities/db/assertFirstRow";
import User from "@services/user/_User";

async function getById(noteId: number, pool: PoolClient): Promise<noteOutputModel> {
  const query = `
    SELECT note_id, user_id, text, create_at, update_at, job_id, candidate_id
    FROM note
    WHERE note_id = $1
  `;
  const result = await pool.query(query, [noteId]);
  const row = assertFirstRow(result.rows, "Không tìm thấy ghi chú", 404);

  const user = await User.findById(row.user_id, pool);

  return {
    note_id: row.note_id,
    text: row.text,
    create_at: row.create_at,
    update_at: row.update_at,
    job_id: row.job_id,
    candidate_id: row.candidate_id,
    user
  } satisfies noteOutputModel;
}

export default getById;
