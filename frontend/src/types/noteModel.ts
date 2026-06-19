import type { userOutputModel } from './userModel';

export type noteModel = {
  note_id: number;
  user_id: number;
  text: string;
  create_at: string | Date;
  update_at: string | Date;
  job_id: number | null;
  candidate_id: number | null;
}

export type noteOutputModel = Omit<noteModel, 'user_id'> & {
  user: userOutputModel;
}
