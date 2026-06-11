import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { AppError } from "@middlewares/AppError";

// ======================== CONFIG ========================

const TEMPLATE_PATH = "./utilities/file/excelTemplate.xlsx";

// Format ngày dùng cho các cột date
const DATE_FMT = "mm/dd/yyyy";

// ======================== TYPES ========================

type SheetOption = "IDL tracking" | "Database" | "ALL";

export interface JdRow {
    job_code: string;
    project: string;
    dept: string;
    hc_requested: number;
    job_title: string;
    ee_level: string;
    sites: string;
    project_segment: string | null;
    hiring_manager: string;
    hrbp: string;
    recruiter: string;
    myhr_request_date: string | Date;
    note?: string | null;
}

export interface CandidateRow {
    input_date: string | Date;
    name: string;
    email: string;
    phone_number: string;
    job_code: string;
    status: string;
    source: string;
    // ---- TÙY CHỌN ----
    expected_onboard_date?: string | Date;
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
}

export interface ExportData {
    jd?: JdRow[];
    candidate?: CandidateRow[];
}

// ======================== DATE COLUMNS (normalized) ========================

/** Cột date trong IDL tracking */
const JD_DATE_HEADERS = new Set([
    "MyHR request date",
    "Expected onboard date",
    "Onboard Date",
    "Offer Date",
]);

/** Cột date trong Database */
const DB_DATE_HEADERS = new Set([
    "Input date (dd/mm/yyyy)",
    "Onboarding Date (DD/MM/YYYY)",
    "Offer Sent date\n(DD/MM/YYYY)",
    "Candidate result feedback date",
]);

// ======================== FIELD MAPPING ========================

const JD_FIELD_MAP: Record<string, string> = {
    job_code: "Job Code",
    project: "Project",
    dept: "Dept.",
    hc_requested: "HC Requested",
    job_title: "Job title",
    ee_level: "EE Level",
    sites: "Sites",
    project_segment: "Project Segment",
    hiring_manager: "Hiring manager",
    hrbp: "HRBP",
    recruiter: "Recruiter",
    myhr_request_date: "MyHR request date",
    note: "Note",
};

const CANDIDATE_FIELD_MAP: Record<string, string> = {
    input_date: "Input date (dd/mm/yyyy)",
    department: "Department",
    name: "Name",
    email: "Email",
    phone_number: "Phone number",
    recruiter: "Recruiter",
    job_code: "Job code",
    job_title: "Job title",
    ee_level: "EE Level",
    project: "Project",
    hiring_manager: "Hiring manager",
    dl_idl: "DL/IDL",
    status: "Status",
    onboarding_date: "Onboarding Date (DD/MM/YYYY)",
    offer_sent_date: "Offer Sent date\n(DD/MM/YYYY)",
    source: "Source",
    employee_code: "Mã nhân viên",
    referrer: "Người giới thiệu",
    referrer_department: "Bộ phận",
    note: "Note",
    current_salary: "Current salary \n(Gross M VND)",
    expected_salary: "Expected salary\n(Gross M VND)",
    candidate_result_feedback_date: "Candidate result feedback date",
    headhunt_agency: "Headhunt Agency",
    targeted_company: "Targeted company",
    targeted_company_name: "Targeted company name",
};

const DB_FROM_JD: Record<string, string> = {
    department: "dept",
    job_title: "job_title",
    ee_level: "ee_level",
    project: "project",
    hiring_manager: "hiring_manager",
    recruiter: "recruiter",
    dl_idl: "sites",
};

// ======================== HELPERS ========================

function toExcelValue(val: any): any {
    if (val === null || val === undefined) return null;
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
        return new Date(val);
    }
    return val;
}

function normalizeHeader(s: string): string {
    return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function detectHeaderRow(ws: ExcelJS.Worksheet): number {
    let bestRow = 1;
    let bestCount = 0;
    const maxScan = Math.min(ws.rowCount, 10);
    for (let r = 1; r <= maxScan; r++) {
        let filled = 0;
        const row = ws.getRow(r);
        for (let c = 1; c <= ws.columnCount; c++) {
            const val = row.getCell(c).value;
            if (val !== null && val !== undefined && String(val).trim() !== "") filled++;
        }
        if (filled > bestCount) { bestCount = filled; bestRow = r; }
    }
    return bestRow;
}

function getHeaderMap(ws: ExcelJS.Worksheet, rowNum: number): Record<number, string> {
    const row = ws.getRow(rowNum);
    const map: Record<number, string> = {};
    for (let c = 1; c <= ws.columnCount; c++) {
        const val = row.getCell(c).value;
        if (val !== null && val !== undefined) {
            map[c] = normalizeHeader(String(val));
        }
    }
    return map;
}

/**
 * FIX: Đọc style từ dòng mẫu + đảm bảo font luôn có giá trị.
 * ExcelJS đôi khi mất font khi readFile, nên cần fallback.
 */
function getStyleMap(ws: ExcelJS.Worksheet, rowNum: number): Record<number, ExcelJS.Style> {
    const row = ws.getRow(rowNum);
    const map: Record<number, ExcelJS.Style> = {};

    // Tìm font mẫu từ cell đầu tiên có font rõ ràng
    let defaultFont: Partial<ExcelJS.Font> = { name: "Calibri", size: 11 };
    for (let c = 1; c <= ws.columnCount; c++) {
        const font = row.getCell(c).font;
        if (font && font.name && font.size) {
            defaultFont = JSON.parse(JSON.stringify(font));
            break;
        }
    }

    for (let c = 1; c <= ws.columnCount; c++) {
        const style: ExcelJS.Style = JSON.parse(JSON.stringify(row.getCell(c).style));

        // Đảm bảo font luôn có — không để ExcelJS dùng default khác
        if (!style.font || !style.font.name) {
            style.font = { ...defaultFont, ...(style.font || {}) };
        }

        map[c] = style;
    }
    return map;
}

/**
 * FIX: Lưu toàn bộ column widths của sheet.
 */
function saveColumnWidths(ws: ExcelJS.Worksheet): Record<number, number | undefined> {
    const map: Record<number, number | undefined> = {};
    for (let c = 1; c <= ws.columnCount; c++) {
        map[c] = ws.getColumn(c).width;
    }
    return map;
}

/**
 * FIX: Khôi phục column widths đã lưu.
 */
function restoreColumnWidths(ws: ExcelJS.Worksheet, widths: Record<number, number | undefined>): void {
    for (const [col, width] of Object.entries(widths)) {
        if (width !== undefined) {
            ws.getColumn(Number(col)).width = width;
        }
    }
}

// ======================== AUTO-COMPUTE ========================

function computeJdAutoFields(
    jobCode: string,
    candidates: CandidateRow[]
): Record<string, any> {
    const list = candidates.filter((c) => c.job_code === jobCode);

    const cvSent = list.length;
    const interview = list.filter((c) => ["Interview", "Interview Fail"].includes(c.status)).length;
    const offered = list.filter((c) => ["Offer", "Offered"].includes(c.status)).length;
    const offerAccepted = list.filter((c) => c.status === "Offer Accepted").length;
    const onboarded = list.filter((c) => c.status === "Onboarded").length;
    const offerRejected = list.filter((c) => c.status === "Offer Rejected").length;

    const ob = list.find((c) => c.status === "Onboarded");

    let status = "In progress";
    if (onboarded > 0) status = "Onboarded";
    else if (offerAccepted > 0) status = "Offer Accepted";
    else if (offered > 0) status = "Offered";

    // Lấy expected_onboard_date từ candidate đầu tiên có giá trị
    const expectedDate = list.find((c) => c.expected_onboard_date)?.expected_onboard_date ?? null;

    return {
        "Expected onboard date": toExcelValue(expectedDate),   // ← THÊM
        "Status": status,
        "CV Sent": cvSent,
        "Interview": interview,
        "Offered": offered,
        "Offer Accepted": offerAccepted,
        "Onboarded": onboarded,
        "Offer Rejected": offerRejected,
        "Source": ob?.source ?? null,
        "Candidate Name": ob?.name ?? null,
        "Onboard Date": toExcelValue(ob?.onboarding_date ?? null),
        "Offer Date": toExcelValue(ob?.offer_sent_date ?? null),
    };
}

function enrichCandidate(
    candidate: CandidateRow,
    jdLookup: Map<string, JdRow>
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

// ======================== FILL SHEET (FIXED) ========================

function fillSheet(
    workbook: ExcelJS.Workbook,
    sheetName: string,
    data: Record<string, any>[],
    dateHeaders: Set<string>             // ← NEW: biết cột nào là date
): void {
    const ws = workbook.getWorksheet(sheetName);
    if (!ws || data.length === 0) return;

    const headerRowNum = detectHeaderRow(ws);
    const startRow = headerRowNum + 1;
    const colCount = ws.columnCount;
    const headerMap = getHeaderMap(ws, headerRowNum);
    const styleMap = getStyleMap(ws, startRow);
    const templateRowHeight = ws.getRow(startRow).height;

    // FIX 1: Lưu column widths TRƯỚC khi sửa gì
    const savedWidths = saveColumnWidths(ws);

    // Build field→col + detect date columns
    const fieldToCol: Record<string, number> = {};
    const dateColSet = new Set<number>();

    for (const [col, name] of Object.entries(headerMap)) {
        const normalized = normalizeHeader(name);
        fieldToCol[normalized] = Number(col);
        if (dateHeaders.has(normalized)) {
            dateColSet.add(Number(col));
        }
    }

    // Xóa data cũ
    for (let r = ws.rowCount; r >= startRow; r--) {
        ws.getRow(r).eachCell((cell) => { cell.value = null; });
    }

    // Ghi data mới
    data.forEach((rowData, i) => {
        const row = ws.getRow(startRow + i);
        if (templateRowHeight) row.height = templateRowHeight;

        for (const [field, colIdx] of Object.entries(fieldToCol)) {
            const cell = row.getCell(colIdx);
            const val = toExcelValue(rowData[field] ?? null);
            cell.value = val;

            // Áp style template
            if (styleMap[colIdx]) {
                cell.style = JSON.parse(JSON.stringify(styleMap[colIdx]));
            }

            // FIX 2: Force numFmt cho cột date — ExcelJS hay mất numFmt
            if (dateColSet.has(colIdx) && val instanceof Date) {
                cell.numFmt = DATE_FMT;
            }
        }
        row.commit();
    });

    // FIX 3: Khôi phục column widths SAU khi ghi xong
    restoreColumnWidths(ws, savedWidths);
}

// ======================== MAIN ========================

export async function writeExcelFromTemplate(
    outputPath: string,
    data: ExportData,
    option: SheetOption = "ALL"
): Promise<void> {
    if (!fs.existsSync(TEMPLATE_PATH)) {
        throw new AppError(`Template not found: ${TEMPLATE_PATH}`, 404);
    }

    // 1. Clone template (binary copy — giữ 100%)
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    await fs.promises.copyFile(TEMPLATE_PATH, outputPath);

    // 2. Mở file clone
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(outputPath);

    // 3. Build JD lookup
    const jdLookup = new Map<string, JdRow>();
    if (data.jd) {
        for (const jd of data.jd) jdLookup.set(jd.job_code, jd);
    }

    // 4. Fill "IDL tracking"
    if ((option === "IDL tracking" || option === "ALL") && data.jd?.length) {
        const rows = data.jd.map((jd) => {
            const mapped: Record<string, any> = {};
            for (const [snake, header] of Object.entries(JD_FIELD_MAP)) {
                if ((jd as any)[snake] !== undefined) {
                    mapped[header] = (jd as any)[snake];
                }
            }
            if (data.candidate) {
                Object.assign(mapped, computeJdAutoFields(jd.job_code, data.candidate));
            }
            return mapped;
        });
        fillSheet(workbook, "IDL tracking", rows, JD_DATE_HEADERS);  // ← pass date headers
    }

    // 5. Fill "Database"
    if ((option === "Database" || option === "ALL") && data.candidate?.length) {
        const rows = data.candidate.map((c) => {
            const enriched = enrichCandidate(c, jdLookup);
            const mapped: Record<string, any> = {};
            for (const [snake, header] of Object.entries(CANDIDATE_FIELD_MAP)) {
                if (enriched[snake] !== undefined) {
                    mapped[normalizeHeader(header)] = enriched[snake];
                }
            }
            return mapped;
        });
        fillSheet(workbook, "Database", rows, DB_DATE_HEADERS);  // ← pass date headers
    }

    // 6. Save
    await workbook.xlsx.writeFile(outputPath);
}