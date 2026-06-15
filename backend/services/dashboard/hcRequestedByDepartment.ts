import { PoolClient } from "pg";
import type { ChartDateRange, ChartDataPoint } from "@type/chart.d";

/**
 * HC Requested by Department
 * ─────────────────────────────────────────────────────────────
 * Trả về mảng { label: department_code, value: tổng HC } theo từng phòng ban.
 *
 * - Nếu range.from và range.to đều được truyền → lọc theo job.request_date.
 * - Nếu không truyền → lấy toàn bộ dữ liệu (không lọc theo ngày).
 *
 * SQL join: job → job_department → department
 * Kết quả sắp xếp giảm dần theo tổng HC.
 */
async function hcRequestedByDepartment(
  range: ChartDateRange,
  pool: PoolClient
): Promise<ChartDataPoint[]> {
  const hasDateFilter = range.from !== undefined && range.to !== undefined;

  const query = hasDateFilter
    ? `
        SELECT
          d.department_code AS label,
          COALESCE(SUM(jd.candidate_required), 0)::int AS value
        FROM department d
        INNER JOIN job_department jd ON jd.department_id = d.department_id
        INNER JOIN job j ON j.job_id = jd.job_id
        WHERE j.request_date >= $1
          AND j.request_date <= $2
        GROUP BY d.department_id, d.department_code
        ORDER BY value DESC
      `
    : `
        SELECT
          d.department_code AS label,
          COALESCE(SUM(jd.candidate_required), 0)::int AS value
        FROM department d
        INNER JOIN job_department jd ON jd.department_id = d.department_id
        INNER JOIN job j ON j.job_id = jd.job_id
        GROUP BY d.department_id, d.department_code
        ORDER BY value DESC
      `;

  const params = hasDateFilter ? [range.from, range.to] : [];
  const result = await pool.query(query, params);

  return result.rows.map((row) => ({
    label: row.label as string,
    value: row.value as number,
  }));
}

export default hcRequestedByDepartment;
