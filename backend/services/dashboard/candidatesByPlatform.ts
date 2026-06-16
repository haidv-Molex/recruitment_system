import { PoolClient } from "pg";
import type { ChartDataPoint } from "@type/chart.d";

export interface CandidatesByPlatformParams {
  job_id?: number;
  department_id?: number;
  status?: string;
}

/**
 * Candidates count grouped by Platform
 * ─────────────────────────────────────────────────────────────
 * Returns the count of candidates per platform matching the filters:
 * - status (string, optional)
 * - job_id (number, optional)
 * - department_id (number, optional)
 */
async function candidatesByPlatform(
  params: CandidatesByPlatformParams,
  pool: PoolClient
): Promise<ChartDataPoint[]> {
  const conditions: string[] = [];
  const sqlParams: any[] = [];
  let paramIndex = 1;

  if (params.status !== undefined && params.status !== "") {
    conditions.push(`c.status = $${paramIndex++}`);
    sqlParams.push(params.status);
  }

  if (params.job_id !== undefined) {
    conditions.push(`c.job_id = $${paramIndex++}`);
    sqlParams.push(params.job_id);
  }

  if (params.department_id !== undefined) {
    conditions.push(`c.job_id IN (SELECT job_id FROM job_department WHERE department_id = $${paramIndex++})`);
    sqlParams.push(params.department_id);
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
