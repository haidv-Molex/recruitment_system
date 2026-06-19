import { PoolClient } from "pg";
import User from "@services/user/_User";
import type { noteOutputModel } from "@model/note/noteModel";

export async function mapNoteRow(row: any, pool: PoolClient): Promise<noteOutputModel> {
  const user = row.user_id ? await User.findById(row.user_id, pool) : null;

  return {
    note_id: row.note_id,
    user_id: row.user_id,
    message: row.message,
    create_at: row.create_at,
    update_at: row.update_at,
    user
  } satisfies noteOutputModel;
}