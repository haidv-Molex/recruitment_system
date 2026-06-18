import { PoolClient } from "pg";
import type { ChartDateRange, ChartDataPoint } from "@type/chart.d";

type Props = ChartDateRange & {
  job_id?: number;
  department_id?: number;
};

/**
 * HC Requested By HRBP
 * ─────────────────────────────────────────────────────────────
 * Trả về tổng số candidate_required của các job_department được quản lý bởi từng HRBP (user).
 *
 * Query filters:
 *   - job_id (tùy chọn)
 *   - department_id (tùy chọn)
 *   - from & to (tùy chọn, lọc theo job.request_date)
 */
async function hcRequestedByHrbp(
  props: Props,
  pool: PoolClient
): Promise<ChartDataPoint[]> {
  const { job_id, department_id, from, to } = props;
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (job_id !== undefined) {
    conditions.push(`jd.job_id = $${paramIndex++}`);
    params.push(job_id);
  }

  if (department_id !== undefined) {
    conditions.push(`jd.department_id = $${paramIndex++}`);
    params.push(department_id);
  }

  if (from !== undefined) {
    conditions.push(`j.request_date >= $${paramIndex++}`);
    params.push(from);
  }

  if (to !== undefined) {
    conditions.push(`j.request_date <= $${paramIndex++}`);
    params.push(to);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      u.user_name AS label,
      COALESCE(SUM(jd.candidate_required), 0)::int AS value
    FROM "user" u
    INNER JOIN department d ON d.user_id = u.user_id
    INNER JOIN job_department jd ON jd.department_id = d.department_id
    INNER JOIN job j ON j.job_id = jd.job_id
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

export default hcRequestedByHrbp;
