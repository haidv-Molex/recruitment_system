import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

async function deleteNote(
  id: number,
  userId: number,
  pool: PoolClient
): Promise<void> {
  const check = await pool.query("SELECT user_id FROM note WHERE note_id = $1", [id]);
  if (check.rows.length === 0) {
    throw new AppError("Không tìm thấy ghi chú để xóa", 404);
  }

  const creatorId = check.rows[0].user_id;

  if (creatorId !== userId) {
    throw new AppError("Bạn không có quyền xóa ghi chú của người khác", 403);
  }

  await pool.query("DELETE FROM note WHERE note_id = $1", [id]);
}

export default deleteNote;

