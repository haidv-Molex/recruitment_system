import { PoolClient } from "pg";
import type { noteOutputModel } from "@model/note/noteModel";
import getById from "./getById";
import assertFirstRow from "@utilities/db/assertFirstRow";

type CreateNoteData = {
  user_id: number;
  text: string;
  job_id?: number | null;
  candidate_id?: number | null;
};

async function create(
  data: CreateNoteData,
  pool: PoolClient
): Promise<noteOutputModel> {
  const { user_id, text, job_id = null, candidate_id = null } = data;

  const query = `
    INSERT INTO note (user_id, text, job_id, candidate_id)
    VALUES ($1, $2, $3, $4)
    RETURNING note_id
  `;
  const result = await pool.query(query, [user_id, text, job_id, candidate_id]);
  const row = assertFirstRow(result.rows, "Lỗi khi tạo ghi chú mới", 500);

  return await getById(row.note_id, pool);
}

export default create;
