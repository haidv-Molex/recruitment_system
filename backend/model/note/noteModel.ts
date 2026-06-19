import type { userOutputModel } from "@model/user/userModel";

export type noteModel = {
  note_id: number;
  user_id: number;
  text: string;
  create_at: Date;
  update_at: Date;
  job_id: number | null;
  candidate_id: number | null;
}

export type noteOutputModel = Omit<noteModel, 'user_id'> & {
  user: userOutputModel;
}
