import { PoolClient } from "pg";
import type { CandidateDetail } from "@model/candidate_detail/candidate_detailModel";
import type { PaginationQueryMetadata } from "@type/pagination";
import CandidateDetailService from "@services/candidate_detail/_CandidateDetail";
import buildPagination from "@utilities/query/buildPagination";
import buildWhereClause from "@utilities/query/buildWhereClause";

export type GetAllCandidateDetailsParams = PaginationQueryMetadata & {
  search?: string;
  summary?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "";
  marital_status?: "single" | "married" | "";
  nationality?: string;
  location?: string;
  address?: string;
  links?: string;
  skills?: string;
  languages?: string;
  language_details?: string;
  education?: string;
  education_details?: string;
  experience_years?: string;
  current_position?: string;
  current_level?: string;
  current_salary?: string;
  last_company?: string;
  work_experience?: string;
  work_experience_details?: string;
  certifications?: string;
  expected_position?: string;
  expected_level?: string;
  expected_salary?: string;
  expected_work_location?: string;
  offer_date?: string;
  expected_onboard_date?: string;
  onboard_date?: string;
  feedback_date?: string;
  salary_currency?: string;
  targeted_company?: string;
};

type GetAllCandidateDetailsResult = {
  items: CandidateDetail[];
  total: number;
};

async function getAll(
  params: GetAllCandidateDetailsParams,
  pool: PoolClient
): Promise<GetAllCandidateDetailsResult> {
  const { unlimited, limit, offset } = buildPagination(params);
  const search = params.search ? params.search.trim() : "";
  const targetedCompany = params.targeted_company ? params.targeted_company.trim() : "";

  const values: any[] = [];
  const conditions: string[] = [];

  const addTextFilter = (param: string | undefined, expression: string) => {
    const value = param ? param.trim() : "";
    if (!value) return;

    values.push(`%${value}%`);
    conditions.push(`${expression} ILIKE $${values.length}`);
  };

  if (search) {
    values.push(`%${search}%`);
    const placeholder = `$${values.length}`;
    const searchColumns = [
      "cd.summary",
      "cd.date_of_birth::text",
      "cd.gender",
      "cd.marital_status",
      "cd.nationality",
      "cd.location",
      "cd.address",
      "cd.links::text",
      "array_to_string(cd.skills, ' ')",
      "array_to_string(cd.languages, ' ')",
      "cd.language_details::text",
      "cd.education",
      "cd.education_details::text",
      "cd.experience_years",
      "cd.current_position",
      "cd.current_level",
      "cd.current_salary::text",
      "cd.last_company",
      "cd.work_experience",
      "cd.work_experience_details::text",
      "array_to_string(cd.certifications, ' ')",
      "cd.expected_position",
      "cd.expected_level",
      "cd.expected_salary::text",
      "cd.expected_work_location",
      "cd.offer_date::text",
      "cd.expected_onboard_date::text",
      "cd.onboard_date::text",
      "cd.feedback_date::text",
      "cd.salary_currency",
      "comp.company_name",
      "comp.company_description"
    ];

    conditions.push(`(${searchColumns.map((column) => `${column} ILIKE ${placeholder}`).join(" OR ")})`);
  }

  if (params.gender) {
    values.push(params.gender);
    conditions.push(`cd.gender = $${values.length}`);
  }

  if (params.marital_status) {
    values.push(params.marital_status);
    conditions.push(`cd.marital_status = $${values.length}`);
  }

  addTextFilter(params.summary, "cd.summary");
  addTextFilter(params.date_of_birth, "cd.date_of_birth::text");
  addTextFilter(params.nationality, "cd.nationality");
  addTextFilter(params.location, "cd.location");
  addTextFilter(params.address, "cd.address");
  addTextFilter(params.links, "cd.links::text");
  addTextFilter(params.skills, "array_to_string(cd.skills, ' ')");
  addTextFilter(params.languages, "array_to_string(cd.languages, ' ')");
  addTextFilter(params.language_details, "cd.language_details::text");
  addTextFilter(params.education, "cd.education");
  addTextFilter(params.education_details, "cd.education_details::text");
  addTextFilter(params.experience_years, "cd.experience_years");
  addTextFilter(params.current_position, "cd.current_position");
  addTextFilter(params.current_level, "cd.current_level");
  addTextFilter(params.current_salary, "cd.current_salary::text");
  addTextFilter(params.last_company, "cd.last_company");
  addTextFilter(params.work_experience, "cd.work_experience");
  addTextFilter(params.work_experience_details, "cd.work_experience_details::text");
  addTextFilter(params.certifications, "array_to_string(cd.certifications, ' ')");
  addTextFilter(params.expected_position, "cd.expected_position");
  addTextFilter(params.expected_level, "cd.expected_level");
  addTextFilter(params.expected_salary, "cd.expected_salary::text");
  addTextFilter(params.expected_work_location, "cd.expected_work_location");
  addTextFilter(params.offer_date, "cd.offer_date::text");
  addTextFilter(params.expected_onboard_date, "cd.expected_onboard_date::text");
  addTextFilter(params.onboard_date, "cd.onboard_date::text");
  addTextFilter(params.feedback_date, "cd.feedback_date::text");
  addTextFilter(params.salary_currency, "cd.salary_currency");
  addTextFilter(targetedCompany, "comp.company_name");

  const whereClause = buildWhereClause(conditions);
  const fromClause = `
    FROM candidate_detail cd
    LEFT JOIN company comp ON cd.targeted_company = comp.company_id
  `;
  const countQuery = `SELECT COUNT(*) AS total ${fromClause} ${whereClause}`;
  let query = `SELECT cd.candidate_detail_id ${fromClause} ${whereClause}`;

  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  query += ` ORDER BY cd.candidate_detail_id DESC`;

  if (!unlimited) {
    values.push(limit, offset);
    query += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;
  }

  const result = await pool.query(query, values);
  const items = await Promise.all(
    result.rows.map((row) => CandidateDetailService.getById(row.candidate_detail_id, pool))
  );

  return {
    items,
    total
  };
}

export default getAll;