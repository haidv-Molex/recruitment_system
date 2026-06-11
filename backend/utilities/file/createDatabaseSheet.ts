// createDatabaseSheet.ts

import ExcelJS from "exceljs";

// ======================== TYPES ========================

export interface CandidateRow {
    // ---- BẮT BUỘC ----
    input_date: string | Date;
    name: string;
    email: string;
    phone_number: string;
    job_code: string;
    status: string;
    source: string;

    // ---- TÙY CHỌN ----
    expected_onboard_date?: string | Date | null;
    onboarding_date?: string | Date | null;
    offer_sent_date?: string | Date | null;
    employee_code?: string | null;
    referrer?: string | null;
    referrer_department?: string | null;
    note?: string | null;
    current_salary?: number | null;
    expected_salary?: number | null;
    candidate_result_feedback_date?: string | Date | null;
    headhunt_agency?: string | null;
    targeted_company?: string | null;
    targeted_company_name?: string | null;

    // ---- AUTO FROM JD (không cần nhập) ----
    department?: string | null;
    job_title?: string | null;
    ee_level?: string | null;
    project?: string | null;
    hiring_manager?: string | null;
    recruiter?: string | null;
    dl_idl?: string | null;
}

export interface JdLookupRow {
    job_code: string;
    dept: string;
    job_title: string;
    ee_level: string;
    project: string;
    hiring_manager: string;
    recruiter: string;
    sites: string;
}

export interface DatabaseSheetInput {
    candidates: CandidateRow[];
    jd_list?: JdLookupRow[];
}

// ======================== FIELD MAPPING ========================

/** snake_case → Excel header (THỨ TỰ = thứ tự cột) */
const FIELD_ORDER: { key: string; header: string; width: number; isDate?: boolean }[] = [
    { key: "input_date", header: "Input date (dd/mm/yyyy)", width: 18, isDate: true },
    { key: "department", header: "Department", width: 14 },
    { key: "name", header: "Name", width: 20 },
    { key: "email", header: "Email", width: 26 },
    { key: "phone_number", header: "Phone number", width: 16 },
    { key: "recruiter", header: "Recruiter", width: 14 },
    { key: "job_code", header: "Job code", width: 12 },
    { key: "job_title", header: "Job title", width: 22 },
    { key: "ee_level", header: "EE Level", width: 14 },
    { key: "project", header: "Project", width: 22 },
    { key: "hiring_manager", header: "Hiring manager", width: 20 },
    { key: "dl_idl", header: "DL/IDL", width: 10 },
    { key: "status", header: "Status", width: 16 },
    { key: "onboarding_date", header: "Onboarding Date (DD/MM/YYYY)", width: 18, isDate: true },
    { key: "offer_sent_date", header: "Offer Sent date\n(DD/MM/YYYY)", width: 18, isDate: true },
    { key: "source", header: "Source", width: 24 },
    { key: "employee_code", header: "Mã nhân viên", width: 16 },
    { key: "referrer", header: "Người giới thiệu", width: 24 },
    { key: "referrer_department", header: "Bộ phận", width: 12 },
    { key: "note", header: "Note", width: 20 },
    { key: "current_salary", header: "Current salary \n(Gross M VND)", width: 18 },
    { key: "expected_salary", header: "Expected salary\n(Gross M VND)", width: 18 },
    { key: "candidate_result_feedback_date", header: "Candidate result feedback date", width: 18, isDate: true },
    { key: "headhunt_agency", header: "Headhunt Agency", width: 18 },
    { key: "targeted_company", header: "Targeted company", width: 18 },
    { key: "targeted_company_name", header: "Targeted company name", width: 22 },
];

/** Candidate auto-fill từ JD */
const DB_FROM_JD: Record<string, string> = {
    department: "dept",
    job_title: "job_title",
    ee_level: "ee_level",
    project: "project",
    hiring_manager: "hiring_manager",
    recruiter: "recruiter",
    dl_idl: "sites",
};

// ======================== STYLES ========================

const DATE_FMT = "mm/dd/yyyy";

const HEADER_FONT: Partial<ExcelJS.Font> = {
    name: "Calibri", size: 11, bold: true,
};

const DATA_FONT: Partial<ExcelJS.Font> = {
    name: "Calibri", size: 11, bold: false,
};

const HEADER_FILL: ExcelJS.Fill = {
    type: "pattern", pattern: "solid",
    fgColor: { argb: "FFD9E1F2" },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
};

// ======================== HELPERS ========================

function toExcelValue(val: any): any {
    if (val === null || val === undefined) return null;
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
        return new Date(val);
    }
    return val;
}

function enrichCandidate(
    candidate: CandidateRow,
    jdLookup: Map<string, JdLookupRow>
): Record<string, any> {
    const enriched: Record<string, any> = { ...candidate };
    const jd = jdLookup.get(candidate.job_code);
    if (!jd) return enriched;

    for (const [dbField, jdField] of Object.entries(DB_FROM_JD)) {
        if (enriched[dbField] === undefined || enriched[dbField] === null) {
            enriched[dbField] = (jd as any)[jdField] ?? null;
        }
    }
    return enriched;
}

// ======================== FUNCTION ========================

/**
 * Tạo sheet "Database" — tự tạo header + style, không cần template.
 *
 * Các trường auto (department, job_title, ee_level, project,
 * hiring_manager, recruiter, dl_idl) sẽ tự fill từ jd_list qua job_code.
 */
export function createDatabaseSheet(
    workbook: ExcelJS.Workbook,
    input: DatabaseSheetInput
): ExcelJS.Worksheet {
    const ws = workbook.addWorksheet("Database");

    // --- Build JD lookup ---
    const jdLookup = new Map<string, JdLookupRow>();
    if (input.jd_list) {
        for (const jd of input.jd_list) jdLookup.set(jd.job_code, jd);
    }

    // --- Column widths ---
    FIELD_ORDER.forEach((f, i) => {
        ws.getColumn(i + 1).width = f.width;
    });

    // --- Header row ---
    const headerRow = ws.getRow(1);
    FIELD_ORDER.forEach((f, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = f.header;
        cell.font = { ...HEADER_FONT };
        cell.fill = { ...HEADER_FILL } as ExcelJS.Fill;
        cell.border = { ...THIN_BORDER };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });
    headerRow.height = 30;
    headerRow.commit();

    // --- Freeze header ---
    ws.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

    // --- Data rows ---
    input.candidates.forEach((candidate, rowIdx) => {
        const enriched = enrichCandidate(candidate, jdLookup);
        const row = ws.getRow(rowIdx + 2);

        FIELD_ORDER.forEach((f, colIdx) => {
            const cell = row.getCell(colIdx + 1);
            const val = toExcelValue(enriched[f.key] ?? null);
            cell.value = val;
            cell.font = { ...DATA_FONT };
            cell.border = { ...THIN_BORDER };
            cell.alignment = { vertical: "middle" };

            // Date format
            if (f.isDate && val instanceof Date) {
                cell.numFmt = DATE_FMT;
            }
        });

        row.commit();
    });

    return ws;
}