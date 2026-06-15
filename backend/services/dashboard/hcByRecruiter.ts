import { PoolClient } from "pg";
import type { ChartDateRange, ChartDataPoint } from "@type/chart.d";

type Props = ChartDateRange & {
  job_id?: number;
  department_id?: number;
};

/**
 * HC By Recruiter
 * ─────────────────────────────────────────────────────────────
 * Trả về số lượng candidate mà mỗi recruiter tuyển được.
 *
 * Query filters:
 *   - job_id (tùy chọn)
 *   - department_id (tùy chọn)
 *   - from & to (tùy chọn, lọc theo candidate.create_at)
 */
async function hcByRecruiter(
  props: Props,
  pool: PoolClient
): Promise<ChartDataPoint[]> {
  const { job_id, department_id, from, to } = props;
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (job_id !== undefined) {
    conditions.push(`c.job_id = $${paramIndex++}`);
    params.push(job_id);
  }

  if (department_id !== undefined) {
    conditions.push(`c.job_id IN (SELECT job_id FROM job_department WHERE department_id = $${paramIndex++})`);
    params.push(department_id);
  }

  if (from !== undefined) {
    conditions.push(`c.create_at >= $${paramIndex++}`);
    params.push(from);
  }

  if (to !== undefined) {
    conditions.push(`c.create_at <= $${paramIndex++}`);
    params.push(to);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      u.user_name AS label,
      COUNT(c.candidate_id)::int AS value
    FROM "user" u
    INNER JOIN candidate c ON c.recruiter = u.user_id
    ${whereClause}
    GROUP BY u.user_id, u.user_name
    ORDER BY value DESC
  `;

  const result = await pool.query(query, params);

  return result.rows.map((row) => ({
    label: row.label as string,
    value: row.value as number,
  }));
}

export default hcByRecruiter;
