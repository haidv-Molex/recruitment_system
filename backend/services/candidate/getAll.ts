import { PoolClient } from "pg";
import { populateCandidateList } from "./populate";

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
}

export async function getAll(
  options: GetAllCandidatesOptions,
  pool: PoolClient
) {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: any[] = [];
  let placeholderIndex = 1;

  if (options.search) {
    const columnMap: Record<string, string> = {
      name: "c.candidate_name",
      code: "c.candidate_code",
      email: "c.candidate_email",
      phone: "c.candidate_phone",
      agency: "c.agency",
      note: "c.note",
      current_salary: "c.current_salary",
      expected_salary: "c.expected_salary",
      job_name: "j.project",
      job_code: "j.job_code",
      platform: "p.platform_name",
      recruiter: "u.user_name",
      reference: "ref.user_name",
      company: "comp.company_name"
    };

    const defaultSearchColumns = Object.values(columnMap);
    const searchColumns = (options.search_at && options.search_at.length > 0)
      ? options.search_at.map(key => columnMap[key]).filter(Boolean)
      : defaultSearchColumns;

    if (searchColumns.length > 0) {
      const orConditions = searchColumns.map(col => `${col} ILIKE $${placeholderIndex}`).join(" OR ");
      conditions.push(`(${orConditions})`);
      values.push(`%${options.search}%`);
      placeholderIndex++;
    }
  }

  if (options.status) {
    conditions.push(`c.status = $${placeholderIndex}`);
    values.push(options.status);
    placeholderIndex++;
  }

  const addDateCondition = (field: string, fromVal: Date | undefined, toVal: Date | undefined) => {
    if (fromVal && toVal) {
      conditions.push(`${field} >= $${placeholderIndex} AND ${field} <= $${placeholderIndex + 1}`);
      values.push(fromVal, toVal);
      placeholderIndex += 2;
    } else if (fromVal) {
      conditions.push(`${field} = $${placeholderIndex}`);
      values.push(fromVal);
      placeholderIndex++;
    } else if (toVal) {
      conditions.push(`${field} = $${placeholderIndex}`);
      values.push(toVal);
      placeholderIndex++;
    }
  };

  addDateCondition("c.offer_date", options.offer_date_from, options.offer_date_to);
  addDateCondition("c.onboard_date", options.onboard_date_from, options.onboard_date_to);
  addDateCondition("c.expected_onboard_date", options.expected_onboard_date_from, options.expected_onboard_date_to);
  addDateCondition("c.feedback_date", options.feedback_date_from, options.feedback_date_to);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const fromClause = `
    FROM candidate c
    LEFT JOIN job j ON c.job_id = j.job_id
    LEFT JOIN platform p ON c.platform_id = p.platform_id
    LEFT JOIN "user" u ON c.recruiter = u.user_id
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
    SELECT c.* 
    ${fromClause}
    ${whereClause}
    ORDER BY c.candidate_id DESC
    LIMIT $${placeholderIndex} OFFSET $${placeholderIndex + 1}
  `;
  const selectValues = [...values, limit, offset];
  const itemsResult = await pool.query(selectQuery, selectValues);

  const populatedItems = await populateCandidateList(itemsResult.rows, pool);

  return {
    items: populatedItems,
    total: totalItems
  };
}
