import { PoolClient } from "pg";
import Department from "@services/department/_Department";
import Level from "@services/level/_Level";
import Segment from "@services/segment/_Segment";
import Site from "@services/site/_Site";
import User from "@services/user/_User";
import Note from "@services/note/_Note";

export async function populateJobRelations(jobId: number, pool: PoolClient) {
  const partnersQuery = `
    SELECT DISTINCT u.user_id
    FROM job_department jd
    JOIN department d ON jd.department_id = d.department_id
    JOIN "user" u ON d.user_id = u.user_id
    WHERE jd.job_id = $1
  `;
  const departmentsQuery = `
    SELECT d.department_id, jd.candidate_required
    FROM job_department jd
    JOIN department d ON jd.department_id = d.department_id
    WHERE jd.job_id = $1
  `;
  const segmentsQuery = `
    SELECT s.segment_id
    FROM job_segment js
    JOIN segment s ON js.segment_id = s.segment_id
    WHERE js.job_id = $1
  `;
  const sitesQuery = `
    SELECT si.site_id
    FROM job_site js
    JOIN site si ON js.site_id = si.site_id
    WHERE js.job_id = $1
  `;
  const titlesQuery = `
    SELECT l.level_id
    FROM job_title jt
    JOIN level l ON jt.level_id = l.level_id
    WHERE jt.job_id = $1
  `;
  const managersQuery = `
    SELECT u.user_id
    FROM hiring_manager hm
    JOIN "user" u ON hm.user_id = u.user_id
    WHERE hm.job_id = $1
  `;
  const employeeLevelsQuery = `
    SELECT l.level_id
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
    employeeLevelsRes,
    notes
  ] = await Promise.all([
    pool.query(partnersQuery, [jobId]),
    pool.query(departmentsQuery, [jobId]),
    pool.query(segmentsQuery, [jobId]),
    pool.query(sitesQuery, [jobId]),
    pool.query(titlesQuery, [jobId]),
    pool.query(managersQuery, [jobId]),
    pool.query(employeeLevelsQuery, [jobId]),
    Note.getByJobId(jobId, pool)
  ]);

  const departmentsList = await Promise.all(
    departmentsRes.rows.map(async (row) => ({
      ...(await Department.getById(row.department_id, pool)),
      candidate_required: row.candidate_required
    }))
  );

  const [partners, segments, sites, titles, managers, employeeLevels] = await Promise.all([
    Promise.all(partnersRes.rows.map((row) => User.findById(row.user_id, pool))),
    Promise.all(segmentsRes.rows.map((row) => Segment.getById(row.segment_id, pool))),
    Promise.all(sitesRes.rows.map((row) => Site.getById(row.site_id, pool))),
    Promise.all(titlesRes.rows.map((row) => Level.getById(row.level_id, pool))),
    Promise.all(managersRes.rows.map((row) => User.findById(row.user_id, pool))),
    Promise.all(employeeLevelsRes.rows.map((row) => Level.getById(row.level_id, pool)))
  ]);

  return {
    partners,
    departments: departmentsList,
    segments,
    sites,
    titles,
    managers,
    employee_levels: employeeLevels,
    notes
  };
}
