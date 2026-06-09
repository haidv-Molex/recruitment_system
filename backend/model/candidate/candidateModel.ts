export type candidateModel = {
  candidate_id: number;
  candidate_code: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  agency: string | null;
  offer_date: Date;
  onboard_date: Date;
  feedback_date: Date;
  current_salary: string;
  expected_salary: string;
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
