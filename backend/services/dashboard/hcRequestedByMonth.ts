import { PoolClient } from "pg";
import type { ChartDateRange, ChartDataPoint } from "@type/chart.d";

type Props = ChartDateRange & {
  department_id?: number;
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * HC Requested By Month
 * ─────────────────────────────────────────────────────────────
 * Trả về tổng số candidate_required theo từng tháng dựa trên job.request_date.
 *
 * Query filters:
 *   - department_id (tùy chọn)
 *   - from & to (tùy chọn, lọc theo job.request_date)
 */
async function hcRequestedByMonth(
  props: Props,
  pool: PoolClient
): Promise<ChartDataPoint[]> {
  const { department_id, from, to } = props;
  const conditions: string[] = ["j.request_date IS NOT NULL"];
  const params: any[] = [];
  let paramIndex = 1;

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

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const query = `
    SELECT
      EXTRACT(YEAR FROM j.request_date)::int AS year,
      EXTRACT(MONTH FROM j.request_date)::int AS month,
      COALESCE(SUM(jd.candidate_required), 0)::int AS value
    FROM job_department jd
    INNER JOIN job j ON j.job_id = jd.job_id
    ${whereClause}
    GROUP BY EXTRACT(YEAR FROM j.request_date), EXTRACT(MONTH FROM j.request_date)
    ORDER BY year ASC, month ASC
  `;

  const result = await pool.query(query, params);

  return result.rows.map((row) => {
    const year = row.year as number;
    const month = row.month as number;
    const value = row.value as number;
    const label = `${year} ${monthNames[month - 1]}`;
    return {
      label,
      value,
    } satisfies ChartDataPoint;
  });
}

export default hcRequestedByMonth;
