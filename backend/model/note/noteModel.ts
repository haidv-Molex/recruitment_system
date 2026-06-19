import type { userOutputModel } from "@model/user/userModel";

export type noteModel = {
  note_id: number;
  user_id: number;
  message: string;
  create_at: Date;
  update_at: Date;
}

export type noteOutputModel = noteModel & {
  user?: userOutputModel | null;
}