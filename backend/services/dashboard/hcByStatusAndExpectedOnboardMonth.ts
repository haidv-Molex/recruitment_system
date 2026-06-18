import { PoolClient } from "pg";
import type { ChartDateRange, ChartDataPoint } from "@type/chart.d";
import buildDateRangeConditions from "@utilities/query/buildDateRangeConditions";
import buildWhereClause from "@utilities/query/buildWhereClause";

type Props = ChartDateRange & {
  status: string;
};



/**
 * HC Requested By Status & Expected Onboard Month
 * ─────────────────────────────────────────────────────────────
 * Trả về danh sách thống kê số lượng candidate theo status, nhóm theo tháng/năm của expected_onboard_date.
 * Yêu cầu: candidate bắt buộc phải có job_id gán kèm (job_id IS NOT NULL).
 */
async function hcByStatusAndExpectedOnboardMonth(
  props: Props,
  pool: PoolClient
): Promise<ChartDataPoint[]> {
  const conditions = [
    "status = $1",
    "job_id IS NOT NULL",
    "expected_onboard_date IS NOT NULL"
  ];
  const params: any[] = [props.status];
  buildDateRangeConditions(props, "expected_onboard_date", conditions, params);
  const whereClause = buildWhereClause(conditions);

  const query = `
    SELECT
      EXTRACT(YEAR FROM expected_onboard_date)::int AS year,
      EXTRACT(MONTH FROM expected_onboard_date)::int AS month,
      COUNT(*)::int AS value
    FROM candidate
    ${whereClause}
    GROUP BY EXTRACT(YEAR FROM expected_onboard_date), EXTRACT(MONTH FROM expected_onboard_date)
    ORDER BY year ASC, month ASC
  `;

  const result = await pool.query(query, params);

  // Determine the start and end year/month
  let startYear: number | null = null;
  let startMonth: number | null = null;
  let endYear: number | null = null;
  let endMonth: number | null = null;

  if (props.from !== undefined) {
    startYear = props.from.getFullYear();
    startMonth = props.from.getMonth() + 1;
  }
  if (props.to !== undefined) {
    endYear = props.to.getFullYear();
    endMonth = props.to.getMonth() + 1;
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

export default hcByStatusAndExpectedOnboardMonth;
