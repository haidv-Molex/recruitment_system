import type { CandidateDetail } from "@model/candidate_detail/candidate_detailModel";
import type {
  ParsedCVEducation,
  ParsedCVLanguage,
  ParsedCVWorkExperience,
} from "@type/cv.d";

export type CandidateDetailWriteData = {
  summary?: string | null;
  date_of_birth?: string | Date | null;
  gender?: CandidateDetail["gender"];
  marital_status?: CandidateDetail["marital_status"];
  nationality?: string | null;
  location?: string | null;
  links?: string[];
  skills?: string[];
  languages?: string[];
  language_details?: ParsedCVLanguage[];
  education?: string | null;
  education_details?: ParsedCVEducation[];
  experience_years?: string | null;
  current_position?: string | null;
  current_level?: string | null;
  current_salary?: number | string | null;
  last_company?: string | null;
  work_experience?: string | null;
  work_experience_details?: ParsedCVWorkExperience[];
  certifications?: string[];
  expected_position?: string | null;
  expected_level?: string | null;
  expected_salary?: number | string | null;
  expected_work_location?: string | null;
  offer_date?: string | Date | null;
  expected_onboard_date?: string | Date | null;
  onboard_date?: string | Date | null;
  feedback_date?: string | Date | null;
  salary_currency?: string;
};

export const candidateDetailWriteFields = [
  "summary",
  "date_of_birth",
  "gender",
  "marital_status",
  "nationality",
  "location",
  "links",
  "skills",
  "languages",
  "language_details",
  "education",
  "education_details",
  "experience_years",
  "current_position",
  "current_level",
  "current_salary",
  "last_company",
  "work_experience",
  "work_experience_details",
  "certifications",
  "expected_position",
  "expected_level",
  "expected_salary",
  "expected_work_location",
  "offer_date",
  "expected_onboard_date",
  "onboard_date",
  "feedback_date",
  "salary_currency"
] as const;

export type CandidateDetailWriteField = typeof candidateDetailWriteFields[number];

const jsonbFields = new Set<CandidateDetailWriteField>([
  "language_details",
  "education_details",
  "work_experience_details"
]);

export function prepareCandidateDetailValue(
  field: CandidateDetailWriteField,
  value: CandidateDetailWriteData[CandidateDetailWriteField]
): CandidateDetailWriteData[CandidateDetailWriteField] | string {
  if (value === undefined || value === null) return value;
  return jsonbFields.has(field) ? JSON.stringify(value) : value;
}