import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

async function deleteNote(
  idOrIds: number | number[],
  userId: number,
  pool: PoolClient
): Promise<void> {
  const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
  if (ids.length === 0) return;

  const checkResult = await pool.query(
    `SELECT note_id, user_id FROM note WHERE note_id = ANY($1::int[])`,
    [ids]
  );

  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy note để xóa", 404);
  }

  if (checkResult.rows.some((row) => row.user_id !== userId)) {
    throw new AppError("Bạn không có quyền xóa note này", 403);
  }

  await pool.query(
    `DELETE FROM note WHERE note_id = ANY($1::int[])`,
    [ids]
  );
}

export default deleteNote;