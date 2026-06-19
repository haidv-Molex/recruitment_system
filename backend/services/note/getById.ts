import { PoolClient } from "pg";
import type { noteOutputModel } from "@model/note/noteModel";
import assertFirstRow from "@utilities/db/assertFirstRow";
import { mapNoteRow } from "@services/note/mapper";

async function getById(
  id: number,
  pool: PoolClient
): Promise<noteOutputModel> {
  const query = `
    SELECT note_id, user_id, message, create_at, update_at
    FROM note
    WHERE note_id = $1
  `;
  const result = await pool.query(query, [id]);
  const row = assertFirstRow(result.rows, "Không tìm thấy note", 404);

  return await mapNoteRow(row, pool);
}

export default getById;