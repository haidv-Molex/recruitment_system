import { PoolClient } from "pg";
import type { ChartDataPoint } from "@type/chart.d";
import buildWhereClause from "@utilities/query/buildWhereClause";

export interface RecruitmentFunnelParams {
  site_ids?: number[];
  job_ids?: number[];
  department_ids?: number[];
  recruiter_id?: number;
}

/**
 * Recruitment Funnel
 * ─────────────────────────────────────────────────────────────
 * Returns the cumulative counts for each funnel stage:
 * - CV Sent (Total candidates matching the filters)
 * - Interview (Candidates who reached at least the interview stage)
 * - Offered (Candidates who were offered)
 * - Offer Accepted (Candidates who accepted the offer)
 * - Onboarded (Candidates who have onboarded)
 */
async function recruitmentFunnel(
  params: RecruitmentFunnelParams,
  pool: PoolClient
): Promise<ChartDataPoint[]> {
  const conditions: string[] = [];
  const sqlParams: any[] = [];

  if (params.recruiter_id !== undefined) {
    sqlParams.push(params.recruiter_id);
    conditions.push(`c.recruiter = $${sqlParams.length}`);
  }

  if (params.job_ids && params.job_ids.length > 0) {
    sqlParams.push(params.job_ids);
    conditions.push(`c.job_id = ANY($${sqlParams.length})`);
  }

  if (params.site_ids && params.site_ids.length > 0) {
    sqlParams.push(params.site_ids);
    conditions.push(`EXISTS (
      SELECT 1 FROM job_site js
      WHERE js.job_id = c.job_id
        AND js.site_id = ANY($${sqlParams.length})
    )`);
  }

  if (params.department_ids && params.department_ids.length > 0) {
    sqlParams.push(params.department_ids);
    conditions.push(`EXISTS (
      SELECT 1 FROM job_department jd
      WHERE jd.job_id = c.job_id
        AND jd.department_id = ANY($${sqlParams.length})
    )`);
  }

  const whereClause = buildWhereClause(conditions);

  const query = `
    SELECT
      COUNT(*)::int AS total_count,
      COUNT(CASE WHEN c.status IN ('Interview', 'Interview Fail', 'Offered', 'Offer Accepted', 'Offer Rejected', 'Onboarded') THEN 1 END)::int AS interview_count,
      COUNT(CASE WHEN c.status IN ('Offered', 'Offer Accepted', 'Offer Rejected', 'Onboarded') THEN 1 END)::int AS offered_count,
      COUNT(CASE WHEN c.status IN ('Offer Accepted', 'Onboarded') THEN 1 END)::int AS accepted_count,
      COUNT(CASE WHEN c.status = 'Onboarded' THEN 1 END)::int AS onboarded_count
    FROM candidate c
    ${whereClause}
  `;

  const result = await pool.query(query, sqlParams);
  const row = result.rows[0] || {
    total_count: 0,
    interview_count: 0,
    offered_count: 0,
    accepted_count: 0,
    onboarded_count: 0,
  };

  return [
    { label: "CV Sent", value: row.total_count },
    { label: "Interview", value: row.interview_count },
    { label: "Offered", value: row.offered_count },
    { label: "Offer Accepted", value: row.accepted_count },
    { label: "Onboarded", value: row.onboarded_count },
  ];
}

export default recruitmentFunnel;
