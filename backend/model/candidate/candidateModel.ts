
import type { levelModel } from "@model/level/levelModel";

export type HeadhuntAgency =
  | 'AsiaHr'
  | 'Navigos'
  | 'Adecco'
  | 'Manpower'
  | 'Talentrader'
  | 'Prosworks'
  | '40Hrs'
  | 'Persol'
  | 'Career Viet'
  | 'Job C'
  | 'EV search';

export type candidateStatus =
  | 'Searching'
  | 'CV Sent'
  | 'CV Fail'
  | 'Interview'
  | 'Interview Fail'
  | 'Hold'
  | 'Offered'
  | 'Offer Accepted'
  | 'Offer Rejected'
  | 'Onboarded'
  | 'Withdraw'
  | 'No-show';

export type candidateModel = {
  candidate_id: number;
  candidate_code: string | null;
  candidate_name: string;
  candidate_email: string | null;
  candidate_phone: string | null;
  agency: HeadhuntAgency | string | null;
  offer_date: Date | null;
  expected_onboard_date: Date | null;
  onboard_date: Date | null;
  feedback_date: Date | null;
  current_salary: string | null;
  expected_salary: string | null;
  status: candidateStatus | string;
  note: string | null;
  create_at: Date;
  update_at: Date;
  platform_id: number | null;
  recruiter: number | null;
  job_id: number | null;
  targeted_company: number | null;
  reference: number | null;
  file_id: number | null;
  candidate_levels?: levelModel[];
}
