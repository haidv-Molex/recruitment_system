import type { CandidateDetail } from "@model/candidate_detail/candidate_detailModel";

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }

  if (value && typeof value === "object") {
    const raw = value as Record<string, unknown>;
    return [
      raw.github,
      raw.linkedin,
      raw.portfolio,
      ...(Array.isArray(raw.other) ? raw.other : [])
    ]
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }

  return [];
}

export function mapCandidateDetailRow(row: any): CandidateDetail {
  return {
    candidate_detail_id: row.candidate_detail_id,
    summary: row.summary,
    date_of_birth: row.date_of_birth,
    gender: row.gender,
    marital_status: row.marital_status,
    nationality: row.nationality,
    location: row.location,
    links: toStringArray(row.links),
    skills: toArray<string>(row.skills),
    languages: toArray<string>(row.languages),
    language_details: toArray(row.language_details),
    education: row.education,
    education_details: toArray(row.education_details),
    experience_years: row.experience_years,
    current_position: row.current_position,
    current_level: row.current_level,
    current_salary: toNumberOrNull(row.current_salary),
    last_company: row.last_company,
    work_experience: row.work_experience,
    work_experience_details: toArray(row.work_experience_details),
    certifications: toArray<string>(row.certifications),
    expected_position: row.expected_position,
    expected_level: row.expected_level,
    expected_salary: toNumberOrNull(row.expected_salary),
    expected_work_location: row.expected_work_location,
    offer_date: row.offer_date,
    expected_onboard_date: row.expected_onboard_date,
    onboard_date: row.onboard_date,
    feedback_date: row.feedback_date,
    salary_currency: row.salary_currency ?? "VND",
    create_at: row.create_at,
    update_at: row.update_at
  };
}

export default mapCandidateDetailRow;