import { PoolClient } from "pg";
import type { jobOutputModel } from "@model/job/jobModel";
import type { PaginationQueryMetadata } from "@type/pagination";
import Job from "@services/job/_Job";
import buildPagination from "@utilities/query/buildPagination";
import buildWhereClause from "@utilities/query/buildWhereClause";

type GetAllJobsParams = PaginationQueryMetadata & {
  search?: string;
  job_code?: string;
  project?: string;
  department?: string;
  segment?: string;
  site?: string;
  job_title?: string;
  ee_level?: string;
  manager?: string;
  partner?: string;
  recruiter?: string;
  note?: string;
  request_date_from?: string;
  request_date_to?: string;
  sort_by?: "job_id" | "candidate_required";
  sort_order?: "asc" | "desc";

};

type GetAllJobsResult = {
  items: jobOutputModel[];
  total: number;
};

async function getAll(
  params: GetAllJobsParams,
  pool: PoolClient
): Promise<GetAllJobsResult> {
  const { unlimited, limit, offset } = buildPagination(params);

  const values: any[] = [];
  const conditions: string[] = [];

  // Global full-text search across all main fields + relations
  if (params.search && params.search.trim()) {
    const s = `%${params.search.trim()}%`;
    values.push(s);
    const placeholder = `$${values.length}`;
    conditions.push(`(
      j.job_code ILIKE ${placeholder}
      OR j.project ILIKE ${placeholder}
      OR j.note ILIKE ${placeholder}
      OR CAST(j.request_date AS TEXT) ILIKE ${placeholder}
      OR EXISTS (SELECT 1 FROM job_department jd JOIN department d ON jd.department_id = d.department_id WHERE jd.job_id = j.job_id AND (d.department_code ILIKE ${placeholder} OR d.department_name ILIKE ${placeholder}))
      OR EXISTS (SELECT 1 FROM job_segment js JOIN segment sg ON js.segment_id = sg.segment_id WHERE js.job_id = j.job_id AND (sg.segment_code ILIKE ${placeholder} OR sg.segment_name ILIKE ${placeholder}))
      OR EXISTS (SELECT 1 FROM job_site jsi JOIN site si ON jsi.site_id = si.site_id WHERE jsi.job_id = j.job_id AND (si.site_code ILIKE ${placeholder} OR si.site_name ILIKE ${placeholder}))
      OR EXISTS (SELECT 1 FROM job_title jt JOIN level l ON jt.level_id = l.level_id WHERE jt.job_id = j.job_id AND (l.level_code ILIKE ${placeholder} OR l.level_name ILIKE ${placeholder}))
      OR EXISTS (SELECT 1 FROM employee_level el JOIN level l ON el.level_id = l.level_id WHERE el.job_id = j.job_id AND (l.level_code ILIKE ${placeholder} OR l.level_name ILIKE ${placeholder}))
      OR EXISTS (SELECT 1 FROM hiring_manager hm JOIN "user" u ON hm.user_id = u.user_id WHERE hm.job_id = j.job_id AND u.user_name ILIKE ${placeholder})
      OR EXISTS (SELECT 1 FROM "user" u WHERE j.recruiter_id = u.user_id AND u.user_name ILIKE ${placeholder})
      OR EXISTS (SELECT 1 FROM job_department jd JOIN department d ON jd.department_id = d.department_id JOIN "user" u ON d.user_id = u.user_id WHERE jd.job_id = j.job_id AND u.user_name ILIKE ${placeholder})
    )`);
  }

  // Field-specific filters
  if (params.job_code) {
    values.push(`%${params.job_code}%`);
    conditions.push(`j.job_code ILIKE $${values.length}`);
  }
  if (params.project) {
    values.push(`%${params.project}%`);
    conditions.push(`j.project ILIKE $${values.length}`);
  }
  if (params.note) {
    values.push(`%${params.note}%`);
    conditions.push(`j.note ILIKE $${values.length}`);
  }
  if (params.request_date_from) {
    values.push(params.request_date_from);
    conditions.push(`j.request_date >= $${values.length}`);
  }
  if (params.request_date_to) {
    values.push(params.request_date_to);
    conditions.push(`j.request_date <= $${values.length}`);
  }
  if (params.department) {
    values.push(`%${params.department}%`);
    conditions.push(`EXISTS (SELECT 1 FROM job_department jd JOIN department d ON jd.department_id = d.department_id WHERE jd.job_id = j.job_id AND (d.department_code ILIKE $${values.length} OR d.department_name ILIKE $${values.length}))`);
  }
  if (params.segment) {
    values.push(`%${params.segment}%`);
    conditions.push(`EXISTS (SELECT 1 FROM job_segment js JOIN segment sg ON js.segment_id = sg.segment_id WHERE js.job_id = j.job_id AND (sg.segment_code ILIKE $${values.length} OR sg.segment_name ILIKE $${values.length}))`);
  }
  if (params.site) {
    values.push(`%${params.site}%`);
    conditions.push(`EXISTS (SELECT 1 FROM job_site jsi JOIN site si ON jsi.site_id = si.site_id WHERE jsi.job_id = j.job_id AND (si.site_code ILIKE $${values.length} OR si.site_name ILIKE $${values.length}))`);
  }
  if (params.job_title) {
    values.push(`%${params.job_title}%`);
    conditions.push(`EXISTS (SELECT 1 FROM job_title jt JOIN level l ON jt.level_id = l.level_id WHERE jt.job_id = j.job_id AND (l.level_code ILIKE $${values.length} OR l.level_name ILIKE $${values.length}))`);
  }
  if (params.ee_level) {
    values.push(`%${params.ee_level}%`);
    conditions.push(`EXISTS (SELECT 1 FROM employee_level el JOIN level l ON el.level_id = l.level_id WHERE el.job_id = j.job_id AND (l.level_code ILIKE $${values.length} OR l.level_name ILIKE $${values.length}))`);
  }
  if (params.manager) {
    values.push(`%${params.manager}%`);
    conditions.push(`EXISTS (SELECT 1 FROM hiring_manager hm JOIN "user" u ON hm.user_id = u.user_id WHERE hm.job_id = j.job_id AND u.user_name ILIKE $${values.length})`);
  }
  if (params.partner) {
    values.push(`%${params.partner}%`);
    conditions.push(`EXISTS (SELECT 1 FROM job_department jd JOIN department d ON jd.department_id = d.department_id JOIN "user" u ON d.user_id = u.user_id WHERE jd.job_id = j.job_id AND u.user_name ILIKE $${values.length})`);
  }
  if (params.recruiter) {
    values.push(`%${params.recruiter}%`);
    conditions.push(`EXISTS (SELECT 1 FROM "user" u WHERE j.recruiter_id = u.user_id AND u.user_name ILIKE $${values.length})`);
  }

  const whereClause = buildWhereClause(conditions);

  const sortBy = params.sort_by || "job_id";
  const sortOrder = params.sort_order === "asc" ? "ASC" : "DESC";
  const needsGroupBy = sortBy === "candidate_required";
  const orderByClause = needsGroupBy
    ? `COALESCE(SUM(jd_sort.candidate_required), 0) ${sortOrder}, j.job_id DESC`
    : `j.job_id ${sortOrder}`;

  const countQuery = `SELECT COUNT(*) AS total FROM job j ${whereClause}`;
  const dataQuery = `
    SELECT j.job_id
    FROM job j
    ${needsGroupBy ? "LEFT JOIN job_department jd_sort ON jd_sort.job_id = j.job_id" : ""}
    ${whereClause}
    ${needsGroupBy ? "GROUP BY j.job_id" : ""}
    ORDER BY ${orderByClause}
  `;

  // Count total matching records
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Fetch paginated data
  const pageValues = [...values];
  let paginatedQuery = dataQuery;
  if (!unlimited) {
    pageValues.push(limit, offset);
    paginatedQuery += ` LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`;
  }

  const result = await pool.query(paginatedQuery, pageValues);

  const items = await Promise.all(
    result.rows.map((row) => Job.getById(row.job_id, pool))
  ) satisfies jobOutputModel[];

  return { items, total };
}

export default getAll;
