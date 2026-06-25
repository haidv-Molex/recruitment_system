import type { userOutputModel } from './userModel';

export type accessModel = {
  access_id: number;
  user_id: number;
  candidate_id: number | null;
  job_id: number | null;
  create_at: string | Date;
  update_at: string | Date;
};

export type accessOutputModel = {
  access_id: number;
  user: userOutputModel;
  candidate: {
    candidate_id: number;
    candidate_code: string | null;
    candidate_name: string;
    candidate_email: string | null;
    candidate_phone: string | null;
  } | null;
  job: {
    job_id: number;
    job_code: string;
    project: string | null;
  } | null;
  create_at: string | Date;
  update_at: string | Date;
};
