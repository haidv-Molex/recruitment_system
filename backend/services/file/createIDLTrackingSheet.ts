import { PoolClient } from "pg";
import ExcelJS from "exceljs";
import { createIDLTrackingSheet as createIDLTrackingSheetUtil } from "@utilities/file/createIDLTrackingSheet";
import type { JdRow, CandidateRowForJd } from "@utilities/file/createIDLTrackingSheet";
import Job from "@services/job/_Job";

async function createIDLTrackingSheet(pool: PoolClient): Promise<ExcelJS.Workbook> {
  // 1. Fetch all jobs with their populated relations
  const jobsResult = await Job.getAll({ unlimited: true }, pool);
  const jobs = jobsResult.items;

  // 2. Query all candidates with minimal joins needed for IDL tracking
  const candidateRes = await pool.query<{
    candidate_id: number;
    candidate_name: string;
    status: string;
    expected_onboard_date: Date | null;
    onboard_date: Date | null;
    offer_date: Date | null;
    job_id: number | null;
    job_code: string | null;
    source: string | null;
  }>(`
    SELECT
      c.candidate_id, c.candidate_name, c.status,
      c.expected_onboard_date, c.onboard_date, c.offer_date,
      c.job_id,
      j.job_code,
      p.platform_name AS source
    FROM candidate c
    LEFT JOIN job j ON c.job_id = j.job_id
    LEFT JOIN platform p ON c.platform_id = p.platform_id
    ORDER BY c.candidate_id ASC
  `);

  const candidateRows = candidateRes.rows;

  // 4. Map jobs → JdRow[]
  const jd_list: JdRow[] = jobs.map((job) => ({
    job_code: job.job_code,
    project: job.project,
    dept: job.departments?.map((d) => d.department_code || d.department_name || "").filter(Boolean).join(", ") || "",
    hc_requested: job.departments?.reduce((sum, d) => sum + (d.candidate_required || 0), 0) || 0,
    job_title: job.titles?.map((t) => t.level_name).filter(Boolean).join(", ") ?? "",
    ee_level: job.employee_levels?.map((el) => el.level_name).filter(Boolean).join(", ") ?? "",
    sites: job.sites?.map((s) => s.site_code || s.site_name || "").filter(Boolean).join(", ") ?? "",
    project_segment: job.segments?.[0]?.segment_name ?? null,
    hiring_manager: job.managers?.map((m) => m.user_name).join(", ") ?? "",
    hrbp: job.departments?.map((d) => d.user?.user_name || "").filter(Boolean).join(", ") ?? "",
    recruiter: job.recruiter?.user_name ?? "",
    myhr_request_date: (job as any).request_date ?? job.create_at,
    note: job.note ?? null,
  }));

  // 5. Map candidate DB rows → CandidateRowForJd[]
  const candidates: CandidateRowForJd[] = candidateRows.map((row) => ({
    job_code: row.job_code ?? "",
    name: row.candidate_name,
    status: row.status,
    source: row.source ?? "",
    expected_onboard_date: row.expected_onboard_date ?? null,
    onboarding_date: row.onboard_date ?? null,
    offer_sent_date: row.offer_date ?? null,
  }));

  // 6. Create workbook and call utility
  const workbook = new ExcelJS.Workbook();
  createIDLTrackingSheetUtil(workbook, { jd_list, candidates });

  return workbook;
}

export default createIDLTrackingSheet;
