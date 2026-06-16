import { PoolClient } from "pg";
import type { ChartDataPoint } from "@type/chart.d";

export interface CandidatesByDepartmentParams {
  status?: string | string[];
  department_ids?: number[];
  job_ids?: number[];
}

/**
 * Candidates count grouped by Department
 * ─────────────────────────────────────────────────────────────
 * Returns the count of candidates per department matching the filters:
 * - status (string or array of strings, optional)
 * - department_ids (array of numbers, optional)
 * - job_ids (array of numbers, optional)
 * 
 * Slices are labeled with department_code or department_name (prioritizing department_code).
 */
async function candidatesByDepartment(
  params: CandidatesByDepartmentParams,
  pool: PoolClient
): Promise<ChartDataPoint[]> {
  const conditions: string[] = [];
  const sqlParams: any[] = [];

  if (params.status !== undefined && params.status !== null && params.status !== '') {
    if (Array.isArray(params.status)) {
      if (params.status.length > 0) {
        sqlParams.push(params.status);
        conditions.push(`c.status = ANY($${sqlParams.length})`);
      }
    } else {
      sqlParams.push(params.status);
      conditions.push(`c.status = $${sqlParams.length}`);
    }
  }

  if (params.job_ids && params.job_ids.length > 0) {
    sqlParams.push(params.job_ids);
    conditions.push(`c.job_id = ANY($${sqlParams.length})`);
  }

  if (params.department_ids && params.department_ids.length > 0) {
    sqlParams.push(params.department_ids);
    conditions.push(`jd.department_id = ANY($${sqlParams.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      COALESCE(NULLIF(d.department_code, ''), d.department_name) AS label,
      COUNT(DISTINCT c.candidate_id)::int AS value
    FROM candidate c
    INNER JOIN job j ON j.job_id = c.job_id
    INNER JOIN job_department jd ON jd.job_id = j.job_id
    INNER JOIN department d ON d.department_id = jd.department_id
    ${whereClause}
    GROUP BY d.department_id, d.department_code, d.department_name
    ORDER BY value DESC
  `;

  const result = await pool.query(query, sqlParams);

  return result.rows.map((row) => ({
    label: row.label || "N/A",
    value: row.value,
  }));
}

export default candidatesByDepartment;
