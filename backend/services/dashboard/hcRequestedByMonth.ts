import { PoolClient } from "pg";
import type { ChartDateRange, ChartDataPoint } from "@type/chart.d";

type Props = ChartDateRange & {
  department_id?: number;
};



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

  // Determine the start and end year/month
  let startYear: number | null = null;
  let startMonth: number | null = null;
  let endYear: number | null = null;
  let endMonth: number | null = null;

  if (from !== undefined) {
    startYear = from.getFullYear();
    startMonth = from.getMonth() + 1;
  }
  if (to !== undefined) {
    endYear = to.getFullYear();
    endMonth = to.getMonth() + 1;
  }

  // If start or end are not defined, fallback to query results
  if (result.rows.length > 0) {
    if (startYear === null || startMonth === null) {
      startYear = result.rows[0].year;
      startMonth = result.rows[0].month;
    }
    if (endYear === null || endMonth === null) {
      endYear = result.rows[result.rows.length - 1].year;
      endMonth = result.rows[result.rows.length - 1].month;
    }
  }

  // If we still don't have a valid range (e.g. no date filter and no rows in db), return empty list
  if (startYear === null || startMonth === null || endYear === null || endMonth === null) {
    return [];
  }

  const chartPoints: ChartDataPoint[] = [];
  let currYear = startYear;
  let currMonth = startMonth;

  while (currYear < endYear || (currYear === endYear && currMonth <= endMonth)) {
    const label = `${currMonth}/${currYear}`;
    const found = result.rows.find((row) => row.year === currYear && row.month === currMonth);
    const value = found ? (found.value as number) : 0;

    chartPoints.push({
      label,
      value,
    } satisfies ChartDataPoint);

    currMonth++;
    if (currMonth > 12) {
      currMonth = 1;
      currYear++;
    }
  }

  return chartPoints;
}

export default hcRequestedByMonth;
