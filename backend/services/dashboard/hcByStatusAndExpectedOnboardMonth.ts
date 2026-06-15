import { PoolClient } from "pg";
import type { ChartDateRange, ChartDataPoint } from "@type/chart.d";

type Props = ChartDateRange & {
  status: string;
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
 * HC Requested By Status & Expected Onboard Month
 * ─────────────────────────────────────────────────────────────
 * Trả về danh sách thống kê số lượng candidate theo status, nhóm theo tháng/năm của expected_onboard_date.
 * Yêu cầu: candidate bắt buộc phải có job_id gán kèm (job_id IS NOT NULL).
 */
async function hcByStatusAndExpectedOnboardMonth(
  props: Props,
  pool: PoolClient
): Promise<ChartDataPoint[]> {
  const hasDateFilter = props.from !== undefined && props.to !== undefined;

  const query = hasDateFilter
    ? `
        SELECT
          EXTRACT(YEAR FROM expected_onboard_date)::int AS year,
          EXTRACT(MONTH FROM expected_onboard_date)::int AS month,
          COUNT(*)::int AS value
        FROM candidate
        WHERE status = $1
          AND job_id IS NOT NULL
          AND expected_onboard_date IS NOT NULL
          AND expected_onboard_date >= $2
          AND expected_onboard_date <= $3
        GROUP BY EXTRACT(YEAR FROM expected_onboard_date), EXTRACT(MONTH FROM expected_onboard_date)
        ORDER BY year ASC, month ASC
      `
    : `
        SELECT
          EXTRACT(YEAR FROM expected_onboard_date)::int AS year,
          EXTRACT(MONTH FROM expected_onboard_date)::int AS month,
          COUNT(*)::int AS value
        FROM candidate
        WHERE status = $1
          AND job_id IS NOT NULL
          AND expected_onboard_date IS NOT NULL
        GROUP BY EXTRACT(YEAR FROM expected_onboard_date), EXTRACT(MONTH FROM expected_onboard_date)
        ORDER BY year ASC, month ASC
      `;

  const params = hasDateFilter ? [props.status, props.from, props.to] : [props.status];
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

export default hcByStatusAndExpectedOnboardMonth;
