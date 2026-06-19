import { PoolClient } from "pg";
import Candidate from "@services/candidate/_Candidate";
import buildPagination from "@utilities/query/buildPagination";
import buildWhereClause from "@utilities/query/buildWhereClause";

export interface GetAllCandidatesOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  search_at?: string[];
  offer_date_from?: Date;
  offer_date_to?: Date;
  onboard_date_from?: Date;
  onboard_date_to?: Date;
  expected_onboard_date_from?: Date;
  expected_onboard_date_to?: Date;
  feedback_date_from?: Date;
  feedback_date_to?: Date;

  // Specific advanced filters
  candidate_code?: string;
  candidate_name?: string;
  candidate_email?: string;
  candidate_phone?: string;
  agency?: string;
  note?: string;
  current_salary?: string;
  expected_salary?: string;
  job_code?: string;
  project?: string;
  platform?: string;
  reference?: string;
  company?: string;
}

export async function getAll(
  options: GetAllCandidatesOptions,
  pool: PoolClient
) {
  const { limit, offset } = buildPagination({ page: options.page, limit: options.limit });

  const conditions: string[] = [];
  const values: any[] = [];

  if (options.search) {
    const columnMap: Record<string, string> = {
      name: "c.candidate_name",
      code: "c.candidate_code",
      email: "c.candidate_email",
      phone: "c.candidate_phone",
      agency: "c.agency",
      note: "c.note",
      current_salary: "cd.current_salary::text",
      expected_salary: "cd.expected_salary::text",
      offer_date: "cd.offer_date::text",
      onboard_date: "cd.onboard_date::text",
      expected_onboard_date: "cd.expected_onboard_date::text",
      feedback_date: "cd.feedback_date::text",
      job_name: "j.project",
      job_code: "j.job_code",
      platform: "p.platform_name",
      platform_code: "p.platform_code",
      platform_name: "p.platform_name",
      reference: "ref.user_name",
      company: "comp.company_name"
    };

    const defaultSearchColumns = Object.values(columnMap);
    const searchColumns = (options.search_at && options.search_at.length > 0)
      ? options.search_at.map(key => columnMap[key]).filter(Boolean)
      : defaultSearchColumns;

    if (searchColumns.length > 0) {
      values.push(`%${options.search}%`);
      const placeholder = `$${values.length}`;
      const orConditions = searchColumns.map(col => `${col} ILIKE ${placeholder}`).join(" OR ");
      conditions.push(`(${orConditions})`);
    }
  }

  if (options.status) {
    values.push(options.status);
    conditions.push(`c.status = $${values.length}`);
  }

  // Handle specific advanced filters
  const addFilterCondition = (field: string, val: string | undefined) => {
    if (val && val.trim()) {
      values.push(`%${val.trim()}%`);
      conditions.push(`${field} ILIKE $${values.length}`);
    }
  };

  addFilterCondition("c.candidate_code", options.candidate_code);
  addFilterCondition("c.candidate_name", options.candidate_name);
  addFilterCondition("c.candidate_email", options.candidate_email);
  addFilterCondition("c.candidate_phone", options.candidate_phone);
  addFilterCondition("c.agency", options.agency);
  addFilterCondition("c.note", options.note);
  addFilterCondition("cd.current_salary::text", options.current_salary);
  addFilterCondition("cd.expected_salary::text", options.expected_salary);
  addFilterCondition("j.job_code", options.job_code);
  addFilterCondition("j.project", options.project);
  if (options.platform && options.platform.trim()) {
    values.push(`%${options.platform.trim()}%`);
    conditions.push(`(p.platform_code ILIKE $${values.length} OR p.platform_name ILIKE $${values.length})`);
  }
  addFilterCondition("ref.user_name", options.reference);
  addFilterCondition("comp.company_name", options.company);

  const addDateCondition = (field: string, fromVal: Date | undefined, toVal: Date | undefined) => {
    if (fromVal && toVal) {
      values.push(fromVal, toVal);
      conditions.push(`${field} >= $${values.length - 1} AND ${field} <= $${values.length}`);
    } else if (fromVal) {
      values.push(fromVal);
      conditions.push(`${field} = $${values.length}`);
    } else if (toVal) {
      values.push(toVal);
      conditions.push(`${field} = $${values.length}`);
    }
  };

  addDateCondition("cd.offer_date", options.offer_date_from, options.offer_date_to);
  addDateCondition("cd.onboard_date", options.onboard_date_from, options.onboard_date_to);
  addDateCondition("cd.expected_onboard_date", options.expected_onboard_date_from, options.expected_onboard_date_to);
  addDateCondition("cd.feedback_date", options.feedback_date_from, options.feedback_date_to);

  const whereClause = buildWhereClause(conditions);

  const fromClause = `
    FROM candidate c
    LEFT JOIN candidate_detail cd ON c.candidate_detail_id = cd.candidate_detail_id
    LEFT JOIN job j ON c.job_id = j.job_id
    LEFT JOIN platform p ON c.platform_id = p.platform_id
    LEFT JOIN "user" ref ON c.reference = ref.user_id
    LEFT JOIN company comp ON c.targeted_company = comp.company_id
  `;

  // Count total items
  const countQuery = `
    SELECT COUNT(DISTINCT c.candidate_id) as total 
    ${fromClause}
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, values);
  const totalItems = parseInt(countResult.rows[0].total, 10);

  // Get items
  const selectQuery = `
    SELECT DISTINCT c.candidate_id
    ${fromClause}
    ${whereClause}
    ORDER BY c.candidate_id DESC
  `;
  const selectValues = [...values, limit, offset];
  const paginatedSelectQuery = `${selectQuery} LIMIT $${selectValues.length - 1} OFFSET $${selectValues.length}`;
  const itemsResult = await pool.query(paginatedSelectQuery, selectValues);

  const populatedItems = await Promise.all(
    itemsResult.rows.map((row) => Candidate.getById(row.candidate_id, pool))
  );

  return {
    items: populatedItems,
    total: totalItems
  };
}
