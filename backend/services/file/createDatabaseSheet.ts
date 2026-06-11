import { PoolClient } from "pg";
import ExcelJS from "exceljs";
import { createDatabaseSheet as createDatabaseSheetUtil } from "@utilities/file/createDatabaseSheet";
import type { CandidateRow, JdLookupRow } from "@utilities/file/createDatabaseSheet";
import Job from "@services/job/_Job";

async function createDatabaseSheet(pool: PoolClient): Promise<ExcelJS.Workbook> {
  // 1. Query all candidates with all required joins
  const candidateRes = await pool.query<{
    candidate_id: number;
    candidate_name: string;
    candidate_email: string | null;
    candidate_phone: string | null;
    candidate_code: string | null;
    agency: string | null;
    offer_date: Date | null;
    onboard_date: Date | null;
    expected_onboard_date: Date | null;
    feedback_date: Date | null;
    current_salary: string | null;
    expected_salary: string | null;
    status: string;
    note: string | null;
    create_at: Date;
    job_id: number | null;
    recruiter: number | null;
    job_code: string | null;
    platform_name: string | null;
    recruiter_name: string | null;
    reference_name: string | null;
    reference_department: string | null;
    targeted_company_name: string | null;
  }>(`
    SELECT
      c.candidate_id, c.candidate_name, c.candidate_email, c.candidate_phone,
      c.candidate_code, c.agency, c.offer_date, c.onboard_date,
      c.expected_onboard_date, c.feedback_date, c.current_salary,
      c.expected_salary, c.status, c.note, c.create_at,
      c.job_id, c.recruiter,
      j.job_code,
      p.platform_name,
      u.user_name  AS recruiter_name,
      ref.user_name AS reference_name,
      ref_dept.department_name AS reference_department,
      comp.company_name AS targeted_company_name
    FROM candidate c
    LEFT JOIN job j ON c.job_id = j.job_id
    LEFT JOIN platform p ON c.platform_id = p.platform_id
    LEFT JOIN "user" u ON c.recruiter = u.user_id
    LEFT JOIN "user" ref ON c.reference = ref.user_id
    LEFT JOIN department ref_dept ON ref.department_id = ref_dept.department_id
    LEFT JOIN company comp ON c.targeted_company = comp.company_id
    ORDER BY c.candidate_id ASC
  `);

  const candidateRows = candidateRes.rows;

  // 2. Fetch all jobs with their populated relations
  const jobsResult = await Job.getAll({ unlimited: true }, pool);
  const jobs = jobsResult.items;

  // 3. Map jobs → JdLookupRow[]
  const jd_list: JdLookupRow[] = jobs.map((job) => ({
    job_code: job.job_code,
    dept: job.departments?.[0]?.department_code ?? "",
    job_title: job.titles?.[0]?.level_name ?? "",
    ee_level: job.employee_levels?.[0]?.level_name ?? "",
    project: job.project,
    hiring_manager: job.managers?.map((m) => m.user_name).join(", ") ?? "",
    recruiter: "", // recruiter giờ nằm ở từng candidate row
    sites: job.sites?.map((s) => s.site_code).join(", ") ?? "",
  }));

  // 4. Map candidate DB rows → CandidateRow[]
  const candidates: CandidateRow[] = candidateRows.map((row) => ({
    input_date: row.create_at,
    name: row.candidate_name,
    email: row.candidate_email ?? "",
    phone_number: row.candidate_phone ?? "",
    job_code: row.job_code ?? "",
    status: row.status,
    source: row.platform_name ?? "",
    expected_onboard_date: row.expected_onboard_date ?? null,
    onboarding_date: row.onboard_date ?? null,
    offer_sent_date: row.offer_date ?? null,
    employee_code: row.candidate_code ?? null,
    referrer: row.reference_name ?? null,
    referrer_department: row.reference_department ?? null,
    note: row.note ?? null,
    // ✅ FIX 1: Dùng recruiter riêng của từng candidate
    recruiter: row.recruiter_name ?? "",
    // ✅ FIX 2: Xóa dấu phẩy trước khi parseFloat
    current_salary: row.current_salary != null
      ? parseFloat(row.current_salary.replace(/,/g, "")) || null
      : null,
    expected_salary: row.expected_salary != null
      ? parseFloat(row.expected_salary.replace(/,/g, "")) || null
      : null,
    candidate_result_feedback_date: row.feedback_date ?? null,
    headhunt_agency: row.agency ?? null,
    targeted_company: row.targeted_company_name ?? null,
  }));

  // 5. Create workbook and call utility
  const workbook = new ExcelJS.Workbook();
  createDatabaseSheetUtil(workbook, { candidates, jd_list });

  return workbook;
}

export default createDatabaseSheet;