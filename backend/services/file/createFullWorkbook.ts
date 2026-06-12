import { PoolClient } from "pg";
import ExcelJS from "exceljs";

// ─── Utility imports ───
import { createDataValidationSheet } from "@utilities/file/createDataValidationSheet";
import { createDatabaseSheet as createDatabaseSheetUtil } from "@utilities/file/createDatabaseSheet";
import { createIDLTrackingSheet as createIDLTrackingSheetUtil } from "@utilities/file/createIDLTrackingSheet";
import type { CandidateRow, JdLookupRow } from "@utilities/file/createDatabaseSheet";
import type { JdRow, CandidateRowForJd } from "@utilities/file/createIDLTrackingSheet";

// ─── Service imports ───
import { getStatuses } from "@services/candidate/getStatuses";
import { getAgencies } from "@services/candidate/getAgencies";
import Job from "@services/job/_Job";


// ======================== FILL STYLES ========================

/** 🔵 #305496 — Cross-sheet linked */
const CROSS_FILL: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF305496" },
};

/** 🟠 #ED7D31 — Extra/special (Database only) */
const EXTRA_FILL: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFED7D31" },
};

// 🔷 #002060 — Default (applied by sheetStyles.setupSheetHeader)

// ======================== HEADER COLOR CONFIG ========================

// ──── IDL tracking ────
// #305496: các cột tính từ candidate / liên kết Database
const IDL_CROSS_HEADERS = new Set([
    "Expected onboard date",
    "Status",
    "CV Sent",
    "Interview",
    "Offered",
    "Offer Accepted",
    "Onboarded",
    "Offer Rejected",
    "Source",
    "Candidate Name",
    "Onboard Date",
    "Offer Date",
]);
// Tất cả cột còn lại → #002060 (default)

// ──── Database ────
// #305496: các cột auto-fill từ JD / liên kết IDL
const DB_CROSS_HEADERS = new Set([
    "Input date (dd/mm/yyyy)",
    "Department",
    "Recruiter",
    "Job title",
    "EE Level",
    "Project",
    "Hiring manager",
    "DL/IDL",
    "Status",
    "Source",
    "Người giới thiệu",
    "Bộ phận",
]);

// #ED7D31: các cột đặc biệt
const DB_EXTRA_HEADERS = new Set([
    "Note",
    "Current salary \n(Gross M VND)",
    "Expected salary\n(Gross M VND)",
    "Targeted company",
    "Targeted company name",
]);
// Tất cả cột còn lại → #002060 (default)

// ======================== DATA VALIDATION DROPDOWN CONFIG ========================

// Vẫn giữ dropdown mapping (tách riêng khỏi màu sắc)
const IDL_VALIDATION_MAP: Record<string, string> = {
    "Dept.": "Dept",
    "EE Level": "EE Level",
    "Sites": "Data source",
    "Recruiter": "PIC",
    "Status": "Recruitment Status",
    "Source": "Source",
};

const DB_VALIDATION_MAP: Record<string, string> = {
    "Department": "Dept",
    "Recruiter": "PIC",
    "Status": "Final Status",
    "Source": "Source",
    "EE Level": "EE Level",
    "DL/IDL": "Data source",
    "Headhunt Agency": "Headhunt Agency",
};

// ======================== DEFAULTS ========================

const DEFAULT_DEPTS = [
    "CA", "OTC", "BOD", "FM/EHS", "GA", "HR", "LOG", "ME", "PC", "PUR", "QC", "SC", "AS", "MD", "PLT", "STP",
];
const DEFAULT_PICS = ["Tracy", "Annie", "Hein", "Kim", "Jun"];
const DEFAULT_FUNCTIONS = ["Operation", "Supporting", "Engineering", "Quality"];
const DEFAULT_SOURCES = [
    "Linkedin Job Post", "Linkedin Search", "Vietnamworks Job Post", "Vietnamworks Search",
    "TopCV Job Post", "TopCV Search", "Headhunt", "Internal referral", "Internal transfer",
    "Facebook", "Network", "Others",
];
const DEFAULT_LEVELS = [
    "Manager", "Supervisor", "Engineer", "Professional", "Technician",
    "Technical Operator", "Operator", "Leader", "Intern",
];
const DEFAULT_COST_CATEGORIES = [
    "Job Posting", "FB Advertising", "Internal Referral", "Job Fair", "Branding Activities", "Agency Fees",
];
const DEFAULT_RECRUITMENT_STATUSES = ["Onboarded", "Offered", "In progress", "Overdue"];
const DEFAULT_DATA_SOURCES = ["D", "S", "SK", "MXV"];

// ======================== HELPERS ========================

function colToLetter(col: number): string {
    let letter = "";
    while (col > 0) {
        const mod = (col - 1) % 26;
        letter = String.fromCharCode(65 + mod) + letter;
        col = Math.floor((col - 1) / 26);
    }
    return letter;
}

function buildHeaderMap(ws: ExcelJS.Worksheet): Map<string, number> {
    const map = new Map<string, number>();
    ws.getRow(1).eachCell((cell, colNumber) => {
        if (cell.value != null) {
            map.set(String(cell.value), colNumber);
        }
    });
    return map;
}

function buildValidationMeta(
    columns: Record<string, (string | null)[]>
): Map<string, { letter: string; count: number }> {
    const meta = new Map<string, { letter: string; count: number }>();
    Object.keys(columns).forEach((header, idx) => {
        meta.set(header, {
            letter: colToLetter(idx + 1),
            count: columns[header].filter((v) => v != null).length,
        });
    });
    return meta;
}

/**
 * Apply header colors cho 1 worksheet.
 * Priority: extraHeaders (#ED7D31) > crossHeaders (#305496) > default (#002060)
 */
function applyHeaderColors(
    ws: ExcelJS.Worksheet,
    crossHeaders: Set<string>,
    extraHeaders?: Set<string>
): void {
    const hMap = buildHeaderMap(ws);
    for (const [header, colNum] of hMap) {
        const cell = ws.getRow(1).getCell(colNum);
        if (extraHeaders?.has(header)) {
            cell.fill = { ...EXTRA_FILL };
        } else if (crossHeaders.has(header)) {
            cell.fill = { ...CROSS_FILL };
        }
        // else: #002060 (default from setupSheetHeader)
    }
}

/**
 * Apply data validation dropdowns (tách riêng, không đổi màu)
 */
function applyDropdowns(
    ws: ExcelJS.Worksheet,
    validationMap: Record<string, string>,
    meta: Map<string, { letter: string; count: number }>
): void {
    const hMap = buildHeaderMap(ws);
    const lastDataRow = ws.rowCount;

    for (const [sheetHeader, valHeader] of Object.entries(validationMap)) {
        const col = hMap.get(sheetHeader);
        const m = meta.get(valHeader);
        if (!col || !m || m.count === 0) continue;

        const formula = `'Data Validation'!$${m.letter}$2:$${m.letter}$${m.count + 1}`;
        for (let r = 2; r <= lastDataRow; r++) {
            ws.getRow(r).getCell(col).dataValidation = {
                type: "list",
                allowBlank: true,
                formulae: [formula],
            };
        }
    }
}

// ======================== MAIN FUNCTION ========================

async function createFullWorkbook(pool: PoolClient): Promise<ExcelJS.Workbook> {

    // ─────────────────────────────────────────────
    // 1. QUERY ALL DATA
    // ─────────────────────────────────────────────

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
    const rows = candidateRes.rows;

    const jobsResult = await Job.getAll({ unlimited: true }, pool);
    const jobs = jobsResult.items;

    const [deptRes, picRes, sourceRes, levelRes, siteRes] = await Promise.all([
        pool.query<{ department_code: string }>(
            `SELECT DISTINCT department_code FROM department
       WHERE department_code IS NOT NULL AND department_code <> '' ORDER BY department_code`
        ),
        pool.query<{ user_name: string }>(
            `SELECT DISTINCT u.user_name FROM "user" u
       JOIN candidate c ON u.user_id = c.recruiter
       WHERE u.user_name IS NOT NULL AND u.user_name <> '' ORDER BY u.user_name`
        ),
        pool.query<{ platform_name: string }>(
            `SELECT DISTINCT platform_name FROM platform
       WHERE platform_name IS NOT NULL AND platform_name <> '' ORDER BY platform_name`
        ),
        pool.query<{ level_name: string }>(
            `SELECT DISTINCT level_name FROM level
       WHERE level_name IS NOT NULL AND level_name <> '' ORDER BY level_name`
        ),
        pool.query<{ site_code: string }>(
            `SELECT DISTINCT site_code FROM site
       WHERE site_code IS NOT NULL AND site_code <> '' ORDER BY site_code`
        ),
    ]);

    const depts = deptRes.rows.length > 0 ? deptRes.rows.map((r) => r.department_code) : DEFAULT_DEPTS;
    const pics = picRes.rows.length > 0 ? picRes.rows.map((r) => r.user_name) : DEFAULT_PICS;
    const statuses = await getStatuses(pool);
    const sources = sourceRes.rows.length > 0 ? sourceRes.rows.map((r) => r.platform_name) : DEFAULT_SOURCES;
    const eeLevels = levelRes.rows.length > 0 ? levelRes.rows.map((r) => r.level_name) : DEFAULT_LEVELS;
    const dataSources = siteRes.rows.length > 0 ? siteRes.rows.map((r) => r.site_code) : DEFAULT_DATA_SOURCES;
    const agencies = await getAgencies(pool);

    // ─────────────────────────────────────────────
    // 2. BUILD SHEET INPUTS
    // ─────────────────────────────────────────────

    const recruiterSetByJobId = new Map<number, Set<string>>();
    for (const row of rows) {
        if (row.job_id && row.recruiter_name) {
            if (!recruiterSetByJobId.has(row.job_id))
                recruiterSetByJobId.set(row.job_id, new Set());
            recruiterSetByJobId.get(row.job_id)!.add(row.recruiter_name);
        }
    }
    const recruitersByJobId = new Map<number, string>();
    for (const [jobId, names] of recruiterSetByJobId) {
        recruitersByJobId.set(jobId, Array.from(names).join(", "));
    }

    const jdList: JdRow[] = jobs.map((job) => ({
        job_code: job.job_code,
        project: job.project,
        dept: job.departments?.[0]?.department_code ?? "",
        hc_requested: job.candidate_required,
        job_title: job.titles?.[0]?.level_name ?? "",
        ee_level: job.employee_levels?.[0]?.level_name ?? "",
        sites: job.sites?.map((s) => s.site_code).join(", ") ?? "",
        project_segment: job.segments?.[0]?.segment_name ?? null,
        hiring_manager: job.managers?.map((m) => m.user_name).join(", ") ?? "",
        hrbp: job.partners?.map((p) => p.user_name).join(", ") ?? "",
        recruiter: recruitersByJobId.get(job.job_id) ?? "",
        myhr_request_date: (job as any).request_date ?? job.create_at,
        note: job.note ?? null,
    }));

    const candidatesForJd: CandidateRowForJd[] = rows.map((row) => ({
        job_code: row.job_code ?? "",
        name: row.candidate_name,
        status: row.status,
        source: row.platform_name ?? "",
        expected_onboard_date: row.expected_onboard_date ?? null,
        onboarding_date: row.onboard_date ?? null,
        offer_sent_date: row.offer_date ?? null,
    }));

    const jdLookupList: JdLookupRow[] = jobs.map((job) => ({
        job_code: job.job_code,
        dept: job.departments?.[0]?.department_code ?? "",
        job_title: job.titles?.[0]?.level_name ?? "",
        ee_level: job.employee_levels?.[0]?.level_name ?? "",
        project: job.project,
        hiring_manager: job.managers?.map((m) => m.user_name).join(", ") ?? "",
        recruiter: "",
        sites: job.sites?.map((s) => s.site_code).join(", ") ?? "",
    }));

    const candidatesForDb: CandidateRow[] = rows.map((row) => ({
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
        recruiter: row.recruiter_name ?? "",
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

    const validationColumns: Record<string, (string | null)[]> = {
        "Dept": depts,
        "PIC": pics,
        "Final Status": statuses,
        "Function": DEFAULT_FUNCTIONS,
        "Source": sources,
        "EE Level": eeLevels,
        "Recruitment costs categories": DEFAULT_COST_CATEGORIES,
        "Recruitment Status": DEFAULT_RECRUITMENT_STATUSES,
        "Data source": dataSources,
        "Headhunt Agency": agencies,
    };

    const extraSections = [
        {
            rows: [
                ["Expected onboard date:"],
                ["Tuyển mới", "<=15", "1 tuần"],
                ["Tuyển mới", "16<x<=30", "2 tuần"],
                ["Tuyển mới", "31<x<=45", "3 tuần"],
                ["Tuyển mới", ">45", "4 tuần"],
                ["Tuyển bù", "Đơn đủ", "2 tuần"],
                ["Tuyển bù", "Đơn thiếu", "1 tuần"],
            ],
        },
        {
            rows: [
                ["Vendor", "Email", "Email", "PW"],
                ["VNW", "Hoang.Huong0@molex.com", null, "Molex@123"],
                ["Top CV", "ngocanh.hoang@kochcc.com", "ngocanh.hoang@kochcc.com", "Molex12345$"],
            ],
        },
    ];

    // ─────────────────────────────────────────────
    // 3. CREATE WORKBOOK + 3 SHEETS
    // ─────────────────────────────────────────────

    const workbook = new ExcelJS.Workbook();

    createIDLTrackingSheetUtil(workbook, {
        jd_list: jdList,
        candidates: candidatesForJd,
    });

    createDatabaseSheetUtil(workbook, {
        candidates: candidatesForDb,
        jd_list: jdLookupList,
    });

    createDataValidationSheet(workbook, {
        columns: validationColumns,
        extra_sections: extraSections,
    });

    // ─────────────────────────────────────────────
    // 4. APPLY HEADER COLORS (tách riêng khỏi dropdown)
    // ─────────────────────────────────────────────

    const idlWs = workbook.getWorksheet("IDL tracking")!;
    applyHeaderColors(idlWs, IDL_CROSS_HEADERS);
    // IDL: chỉ có #002060 (default) + #305496 (cross)

    const dbWs = workbook.getWorksheet("Database")!;
    applyHeaderColors(dbWs, DB_CROSS_HEADERS, DB_EXTRA_HEADERS);
    // DB: #002060 (default) + #305496 (cross) + #ED7D31 (extra)

    // ─────────────────────────────────────────────
    // 5. APPLY DATA VALIDATION DROPDOWNS (không đổi màu)
    // ─────────────────────────────────────────────

    const meta = buildValidationMeta(validationColumns);
    applyDropdowns(idlWs, IDL_VALIDATION_MAP, meta);
    applyDropdowns(dbWs, DB_VALIDATION_MAP, meta);

    return workbook;
}

export default createFullWorkbook;