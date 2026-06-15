import { PoolClient } from "pg";
import type { JobHCTracking } from "@type/chart.d";

type Props = {
  department_id?: number;
};

/**
 * Job Headcount Tracking
 * ─────────────────────────────────────────────────────────────
 * Trả về thông tin HC của các Job:
 *   - job_id
 *   - job_title (lấy từ các level liên kết qua job_title)
 *   - candidate_required
 *   - closed_count (số candidate có status = 'Onboarded')
 *   - open_count (candidate_required - closed_count)
 *
 * Query filters:
 *   - department_id (tùy chọn)
 */
async function jobHCTracking(
  props: Props,
  pool: PoolClient
): Promise<JobHCTracking[]> {
  const { department_id } = props;
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (department_id !== undefined) {
    conditions.push(`jd.department_id = $${paramIndex++}`);
    params.push(department_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      j.job_id,
      COALESCE((
        SELECT STRING_AGG(l.level_name, ', ')
        FROM job_title jt
        JOIN level l ON jt.level_id = l.level_id
        WHERE jt.job_id = j.job_id
      ), '') AS job_title,
      COALESCE(SUM(jd.candidate_required), 0)::int AS candidate_required,
      COALESCE((
        SELECT COUNT(*)::int
        FROM candidate c
        WHERE c.job_id = j.job_id AND c.status = 'Onboarded'
      ), 0) AS closed_count
    FROM job j
    INNER JOIN job_department jd ON jd.job_id = j.job_id
    ${whereClause}
    GROUP BY j.job_id, j.job_code
    ORDER BY j.job_id DESC
  `;

  const result = await pool.query(query, params);

  return result.rows.map((row) => {
    const candidate_required = row.candidate_required as number;
    const closed_count = row.closed_count as number;
    const open_count = Math.max(0, candidate_required - closed_count);

    return {
      job_id: row.job_id as number,
      job_title: row.job_title as string,
      candidate_required,
      closed_count,
      open_count,
    } satisfies JobHCTracking;
  });
}

export default jobHCTracking;
