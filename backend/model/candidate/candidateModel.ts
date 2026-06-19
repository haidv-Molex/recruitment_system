
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
  | 'In progress'
  | 'Overdue'
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
  status: candidateStatus | string;
  note: string | null;
  create_at: Date;
  update_at: Date;
  candidate_detail_id: number | null;
  platform_id: number | null;
  job_id: number | null;
  targeted_company: number | null;
  reference: number | null;
  file_id: number | null;
  candidate_levels?: levelModel[];
}
