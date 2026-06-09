export type jobModel = {
  job_id: number;
  job_code: string;
  project: string;
  candidate_required: number;
  note: string | null;
  expected_onboard_date: Date;
  create_at: Date;
  update_at: Date;
  file_id: number | null;
}