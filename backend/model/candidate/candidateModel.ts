export type candidateModel = {
  candidate_id: number;
  candidate_code: string | null;
  candidate_name: string;
  candidate_email: string | null;
  candidate_phone: string | null;
  agency: string | null;
  offer_date: Date | null;
  expected_onboard_date: Date | null;
  onboard_date: Date | null;
  feedback_date: Date | null;
  current_salary: string | null;
  expected_salary: string | null;
  status: string;
  note: string;
  create_at: Date;
  update_at: Date;
  source: number;
  recruiter: number;
  job_id: number;
  targeted_company: number | null;
  reference: number | null;
  file_id: number | null;
}
