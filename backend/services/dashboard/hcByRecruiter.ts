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

  if (job_id !== undefined) {
    params.push(job_id);
    conditions.push(`c.job_id = $${params.length}`);
  }

  if (department_id !== undefined) {
    params.push(department_id);
    conditions.push(`c.job_id IN (SELECT job_id FROM job_department WHERE department_id = $${params.length})`);
  }

  buildDateRangeConditions({ from, to }, "c.create_at", conditions, params);

  const whereClause = buildWhereClause(conditions);

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

  return mapChartRows(result.rows);
}

export default hcByRecruiter;
