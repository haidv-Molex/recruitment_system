import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

async function deleteNote(id: number, pool: PoolClient): Promise<void> {
  const check = await pool.query("SELECT note_id FROM note WHERE note_id = $1", [id]);
  if (check.rows.length === 0) {
    throw new AppError("Không tìm thấy ghi chú để xóa", 404);
  }

  await pool.query("DELETE FROM note WHERE note_id = $1", [id]);
}

export default deleteNote;
