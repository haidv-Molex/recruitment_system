import { PoolClient } from "pg";
import type { jobOutputModel } from "@model/job/jobModel";
import type { PaginationQueryMetadata } from "@type/pagination";
import { populateJobRelations } from "./populate";

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
  const unlimited = params.unlimited === true;
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const offset = (page - 1) * limit;

  const values: any[] = [];
  let index = 1;
  const conditions: string[] = [];

  // Global full-text search across all main fields + relations
  if (params.search && params.search.trim()) {
    const s = `%${params.search.trim()}%`;
    conditions.push(`(
      j.job_code ILIKE $${index}
      OR j.project ILIKE $${index}
      OR j.note ILIKE $${index}
      OR CAST(j.request_date AS TEXT) ILIKE $${index}
      OR EXISTS (SELECT 1 FROM job_department jd JOIN department d ON jd.department_id = d.department_id WHERE jd.job_id = j.job_id AND (d.department_code ILIKE $${index} OR d.department_name ILIKE $${index}))
      OR EXISTS (SELECT 1 FROM job_segment js JOIN segment sg ON js.segment_id = sg.segment_id WHERE js.job_id = j.job_id AND (sg.segment_code ILIKE $${index} OR sg.segment_name ILIKE $${index}))
      OR EXISTS (SELECT 1 FROM job_site jsi JOIN site si ON jsi.site_id = si.site_id WHERE jsi.job_id = j.job_id AND (si.site_code ILIKE $${index} OR si.site_name ILIKE $${index}))
      OR EXISTS (SELECT 1 FROM job_title jt JOIN level l ON jt.level_id = l.level_id WHERE jt.job_id = j.job_id AND (l.level_code ILIKE $${index} OR l.level_name ILIKE $${index}))
      OR EXISTS (SELECT 1 FROM employee_level el JOIN level l ON el.level_id = l.level_id WHERE el.job_id = j.job_id AND (l.level_code ILIKE $${index} OR l.level_name ILIKE $${index}))
      OR EXISTS (SELECT 1 FROM hiring_manager hm JOIN "user" u ON hm.user_id = u.user_id WHERE hm.job_id = j.job_id AND u.user_name ILIKE $${index})
      OR EXISTS (SELECT 1 FROM job_department jd JOIN department d ON jd.department_id = d.department_id JOIN "user" u ON d.user_id = u.user_id WHERE jd.job_id = j.job_id AND u.user_name ILIKE $${index})
    )`);
    values.push(s);
    index++;
  }

  // Field-specific filters
  if (params.job_code) {
    conditions.push(`j.job_code ILIKE $${index++}`);
    values.push(`%${params.job_code}%`);
  }
  if (params.project) {
    conditions.push(`j.project ILIKE $${index++}`);
    values.push(`%${params.project}%`);
  }
  if (params.note) {
    conditions.push(`j.note ILIKE $${index++}`);
    values.push(`%${params.note}%`);
  }
  if (params.request_date_from) {
    conditions.push(`j.request_date >= $${index++}`);
    values.push(params.request_date_from);
  }
  if (params.request_date_to) {
    conditions.push(`j.request_date <= $${index++}`);
    values.push(params.request_date_to);
  }
  if (params.department) {
    conditions.push(`EXISTS (SELECT 1 FROM job_department jd JOIN department d ON jd.department_id = d.department_id WHERE jd.job_id = j.job_id AND (d.department_code ILIKE $${index} OR d.department_name ILIKE $${index}))`);
    values.push(`%${params.department}%`);
    index++;
  }
  if (params.segment) {
    conditions.push(`EXISTS (SELECT 1 FROM job_segment js JOIN segment sg ON js.segment_id = sg.segment_id WHERE js.job_id = j.job_id AND (sg.segment_code ILIKE $${index} OR sg.segment_name ILIKE $${index}))`);
    values.push(`%${params.segment}%`);
    index++;
  }
  if (params.site) {
    conditions.push(`EXISTS (SELECT 1 FROM job_site jsi JOIN site si ON jsi.site_id = si.site_id WHERE jsi.job_id = j.job_id AND (si.site_code ILIKE $${index} OR si.site_name ILIKE $${index}))`);
    values.push(`%${params.site}%`);
    index++;
  }
  if (params.job_title) {
    conditions.push(`EXISTS (SELECT 1 FROM job_title jt JOIN level l ON jt.level_id = l.level_id WHERE jt.job_id = j.job_id AND (l.level_code ILIKE $${index} OR l.level_name ILIKE $${index}))`);
    values.push(`%${params.job_title}%`);
    index++;
  }
  if (params.ee_level) {
    conditions.push(`EXISTS (SELECT 1 FROM employee_level el JOIN level l ON el.level_id = l.level_id WHERE el.job_id = j.job_id AND (l.level_code ILIKE $${index} OR l.level_name ILIKE $${index}))`);
    values.push(`%${params.ee_level}%`);
    index++;
  }
  if (params.manager) {
    conditions.push(`EXISTS (SELECT 1 FROM hiring_manager hm JOIN "user" u ON hm.user_id = u.user_id WHERE hm.job_id = j.job_id AND u.user_name ILIKE $${index++})`);
    values.push(`%${params.manager}%`);
  }
  if (params.partner) {
    conditions.push(`EXISTS (SELECT 1 FROM job_department jd JOIN department d ON jd.department_id = d.department_id JOIN "user" u ON d.user_id = u.user_id WHERE jd.job_id = j.job_id AND u.user_name ILIKE $${index++})`);
    values.push(`%${params.partner}%`);
  }

  const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";

  const sortBy = params.sort_by || "job_id";
  const sortOrder = params.sort_order === "asc" ? "ASC" : "DESC";
  const needsGroupBy = sortBy === "candidate_required";
  const orderByClause = needsGroupBy
    ? `COALESCE(SUM(jd_sort.candidate_required), 0) ${sortOrder}, j.job_id DESC`
    : `j.job_id ${sortOrder}`;

  const countQuery = `SELECT COUNT(*) AS total FROM job j${whereClause}`;
  const dataQuery = `
    SELECT j.job_id, j.job_code, j.project, j.note, j.request_date, j.create_at, j.update_at, j.file_id,
           f.file_path
    FROM job j
    LEFT JOIN file f ON j.file_id = f.file_id
    ${needsGroupBy ? "LEFT JOIN job_department jd_sort ON jd_sort.job_id = j.job_id" : ""}
    ${whereClause}
    ${needsGroupBy ? "GROUP BY j.job_id, j.job_code, j.project, j.note, j.request_date, j.create_at, j.update_at, j.file_id, f.file_path" : ""}
    ORDER BY ${orderByClause}
  `;

  // Count total matching records
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Fetch paginated data
  const pageValues = [...values];
  let paginatedQuery = dataQuery;
  if (!unlimited) {
    paginatedQuery += ` LIMIT $${index++} OFFSET $${index++}`;
    pageValues.push(limit, offset);
  }

  const result = await pool.query(paginatedQuery, pageValues);
  const host = process.env.HOST || "http://localhost:3000";

  const items = await Promise.all(result.rows.map(async (row) => {
    const relations = await populateJobRelations(row.job_id, pool);
    return {
      job_id: row.job_id,
      job_code: row.job_code,
      project: row.project,
      note: row.note,
      request_date: row.request_date,
      create_at: row.create_at,
      update_at: row.update_at,
      file: row.file_id ? {
        file_id: row.file_id,
        file_path: row.file_path,
        file_url: `${host}/file/${row.file_path}`
      } : null,
      ...relations
    };
  })) satisfies jobOutputModel[];

  return { items, total };
}

export default getAll;
