import { PoolClient } from "pg";

export async function populateJobRelations(jobId: number, pool: PoolClient) {
  const partnersQuery = `
    SELECT DISTINCT u.user_id, u.user_name, u.user_description, u.user_role, u.create_at, u.update_at, u.department_id
    FROM job_department jd
    JOIN "user" u ON jd.user_id = u.user_id
    WHERE jd.job_id = $1
  `;
  const departmentsQuery = `
    SELECT d.department_id, d.department_code, d.department_name, d.department_description, d.create_at, d.update_at, jd.candidate_required, jd.user_id, u.user_name
    FROM job_department jd
    JOIN department d ON jd.department_id = d.department_id
    LEFT JOIN "user" u ON jd.user_id = u.user_id
    WHERE jd.job_id = $1
  `;
  const segmentsQuery = `
    SELECT s.segment_id, s.segment_code, s.segment_name, s.segment_description, s.create_at, s.update_at
    FROM job_segment js
    JOIN segment s ON js.segment_id = s.segment_id
    WHERE js.job_id = $1
  `;
  const sitesQuery = `
    SELECT si.site_id, si.site_code, si.site_name, si.site_description, si.create_at, si.update_at
    FROM job_site js
    JOIN site si ON js.site_id = si.site_id
    WHERE js.job_id = $1
  `;
  const titlesQuery = `
    SELECT l.level_id, l.level_code, l.level_name, l.level_description, l.create_at, l.update_at
    FROM job_title jt
    JOIN level l ON jt.level_id = l.level_id
    WHERE jt.job_id = $1
  `;
  const managersQuery = `
    SELECT u.user_id, u.user_name, u.user_description, u.user_role, u.create_at, u.update_at, u.department_id
    FROM hiring_manager hm
    JOIN "user" u ON hm.user_id = u.user_id
    WHERE hm.job_id = $1
  `;
  const employeeLevelsQuery = `
    SELECT l.level_id, l.level_code, l.level_name, l.level_description, l.create_at, l.update_at
    FROM employee_level el
    JOIN level l ON el.level_id = l.level_id
    WHERE el.job_id = $1
  `;

  const [
    partnersRes,
    departmentsRes,
    segmentsRes,
    sitesRes,
    titlesRes,
    managersRes,
    employeeLevelsRes
  ] = await Promise.all([
    pool.query(partnersQuery, [jobId]),
    pool.query(departmentsQuery, [jobId]),
    pool.query(segmentsQuery, [jobId]),
    pool.query(sitesQuery, [jobId]),
    pool.query(titlesQuery, [jobId]),
    pool.query(managersQuery, [jobId]),
    pool.query(employeeLevelsQuery, [jobId])
  ]);

  return {
    partners: partnersRes.rows,
    departments: departmentsRes.rows,
    segments: segmentsRes.rows,
    sites: sitesRes.rows,
    titles: titlesRes.rows,
    managers: managersRes.rows,
    employee_levels: employeeLevelsRes.rows
  };
}
