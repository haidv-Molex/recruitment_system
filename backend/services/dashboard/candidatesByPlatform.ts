import { PoolClient } from "pg";
import type { ChartDataPoint } from "@type/chart.d";

export interface CandidatesByPlatformParams {
  status?: string | string[];
  department_ids?: number[];
  job_ids?: number[];
}

/**
 * Candidates count grouped by Platform
 * ─────────────────────────────────────────────────────────────
 * Returns the count of candidates per platform matching the filters:
 * - status (string or array of strings, optional)
 * - job_ids (array of numbers, optional)
 * - department_ids (array of numbers, optional)
 */
async function candidatesByPlatform(
  params: CandidatesByPlatformParams,
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
    conditions.push(`c.job_id IN (SELECT job_id FROM job_department WHERE department_id = ANY($${sqlParams.length}))`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      p.platform_name AS label,
      COUNT(c.candidate_id)::int AS value
    FROM candidate c
    INNER JOIN platform p ON p.platform_id = c.platform_id
    ${whereClause}
    GROUP BY p.platform_id, p.platform_name
    ORDER BY value DESC
  `;

  const result = await pool.query(query, sqlParams);

  return result.rows.map((row) => ({
    label: row.label as string,
    value: row.value as number,
  }));
}

export default candidatesByPlatform;
