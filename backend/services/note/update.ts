import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { noteOutputModel } from "@model/note/noteModel";
import getById from "./getById";

type UpdateNoteData = {
  id: number;
  text: string;
  userId: number;
};

async function update(
  data: UpdateNoteData,
  pool: PoolClient
): Promise<noteOutputModel> {
  const { id, text, userId } = data;

  const check = await pool.query("SELECT user_id FROM note WHERE note_id = $1", [id]);
  if (check.rows.length === 0) {
    throw new AppError("Không tìm thấy ghi chú để cập nhật", 404);
  }

  const creatorId = check.rows[0].user_id;

  if (creatorId !== userId) {
    throw new AppError("Bạn không có quyền chỉnh sửa ghi chú của người khác", 403);
  }

  const result = await pool.query(
    `UPDATE note
     SET text = $1, update_at = CURRENT_TIMESTAMP
     WHERE note_id = $2
     RETURNING note_id`,
    [text, id]
  );

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi cập nhật ghi chú", 500);
  }

  return await getById(id, pool);
}

export default update;
