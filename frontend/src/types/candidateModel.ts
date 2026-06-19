
import type { levelModel } from "./levelModel";

export type candidateDetailModel = {
  candidate_detail_id: number;
  summary: string | null;
  date_of_birth: Date | string | null;
  gender: 'male' | 'female' | string | null;
  marital_status: 'single' | 'married' | string | null;
  nationality: string | null;
  location: string | null;
  links: string[];
  skills: string[];
  languages: string[];
  language_details: any[];
  education: string | null;
  education_details: any[];
  experience_years: string | null;
  current_position: string | null;
  current_level: string | null;
  current_salary: number | string | null;
  last_company: string | null;
  work_experience: string | null;
  work_experience_details: any[];
  certifications: string[];
  expected_position: string | null;
  expected_level: string | null;
  expected_salary: number | string | null;
  expected_work_location: string | null;
  offer_date: Date | string | null;
  expected_onboard_date: Date | string | null;
  onboard_date: Date | string | null;
  feedback_date: Date | string | null;
  salary_currency: string;
  create_at: Date | string;
  update_at: Date | string;
};

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
  | 'Offer'
  | 'Overdue'
  | 'In progress'
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
  offer_date?: Date | string | null;
  expected_onboard_date?: Date | string | null;
  onboard_date?: Date | string | null;
  feedback_date?: Date | string | null;
  current_salary?: string | number | null;
  expected_salary?: string | number | null;
  status: candidateStatus | string;
  note: string | null;
  create_at: Date;
  update_at: Date;
  candidate_detail_id?: number | null;
  candidate_detail?: candidateDetailModel | null;
  platform_id: number | null;
  job_id: number | null;
  targeted_company: number | null;
  reference: number | null;
  file_id: number | null;
  candidate_levels?: levelModel[];
}
