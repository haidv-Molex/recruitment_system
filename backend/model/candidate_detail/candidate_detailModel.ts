import type {
  ParsedCVEducation,
  ParsedCVLanguage,
  ParsedCVLinks,
  ParsedCVWorkExperience,
} from "@type/cv.d";

export type CandidateDetail = {
  candidate_detail_id: number;
  summary: string | null;

  // ===== Thông tin cá nhân =====
  date_of_birth: Date | null;
  gender: 'male' | 'female' | null;
  marital_status: 'single' | 'married' | null;
  nationality: string | null;
  location: string | null;
  address: string | null;

  // ===== Liên kết & kỹ năng =====
  links: ParsedCVLinks;
  skills: string[];

  // ===== Ngôn ngữ =====
  languages: string[];
  language_details: ParsedCVLanguage[];

  // ===== Học vấn =====
  education: string | null;
  education_details: ParsedCVEducation[];

  // ===== Kinh nghiệm hiện tại =====
  experience_years: string | null;
  current_position: string | null;
  current_level: string | null;
  current_salary: number | null;
  last_company: string | null;
  work_experience: string | null;
  work_experience_details: ParsedCVWorkExperience[];
  certifications: string[];

  // ===== Mong muốn công việc =====
  expected_position: string | null;
  expected_level: string | null;
  expected_salary: number | null;
  expected_work_location: string | null;

  // ===== Quy trình tuyển dụng =====
  offer_date: Date | null;
  expected_onboard_date: Date | null;
  onboard_date: Date | null;
  feedback_date: Date | null;

  // ===== Thông tin khác =====
  salary_currency: string;

  // ===== Foreign Keys =====
  file_id: number | null;
  targeted_company: number | null;

  // ===== Metadata =====
  create_at: Date;
  update_at: Date;
};