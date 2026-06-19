import { PoolClient } from "pg";
import type { ChartDateRange, ChartDataPoint } from "@type/chart.d";
import buildDateRangeConditions from "@utilities/query/buildDateRangeConditions";
import buildWhereClause from "@utilities/query/buildWhereClause";
import mapChartRows from "@utilities/query/mapChartRows";

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

  if (job_id !== undefined) {
    params.push(job_id);
    conditions.push(`jd.job_id = $${params.length}`);
  }

  if (department_id !== undefined) {
    params.push(department_id);
    conditions.push(`jd.department_id = $${params.length}`);
  }

  buildDateRangeConditions({ from, to }, "j.request_date", conditions, params);

  const whereClause = buildWhereClause(conditions);

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

  return mapChartRows(result.rows);
}

export default hcRequestedByHrbp;
