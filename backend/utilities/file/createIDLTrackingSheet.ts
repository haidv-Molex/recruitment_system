// createIDLTrackingSheet.ts

import ExcelJS from "exceljs";

// ======================== TYPES ========================

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

/** Dùng chung CandidateRow từ createDatabaseSheet hoặc define lại minimal */
export interface CandidateRowForJd {
    job_code: string;
    name: string;
    status: string;
    source: string;
    expected_onboard_date?: string | Date | null;
    onboarding_date?: string | Date | null;
    offer_sent_date?: string | Date | null;
}

export interface IDLTrackingInput {
    jd_list: JdRow[];
    candidates?: CandidateRowForJd[];
}

// ======================== FIELD CONFIG ========================

/** Cột nhập từ JdRow */
const JD_FIELDS: { key: string; header: string; width: number; isDate?: boolean }[] = [
    { key: "job_code", header: "Job Code", width: 12 },
    { key: "project", header: "Project", width: 24 },
    { key: "dept", header: "Dept.", width: 10 },
    { key: "hc_requested", header: "HC Requested", width: 14 },
    { key: "job_title", header: "Job title", width: 22 },
    { key: "ee_level", header: "EE Level", width: 12 },
    { key: "sites", header: "Sites", width: 10 },
    { key: "project_segment", header: "Project Segment", width: 16 },
    { key: "hiring_manager", header: "Hiring manager", width: 20 },
    { key: "hrbp", header: "HRBP", width: 10 },
    { key: "recruiter", header: "Recruiter", width: 14 },
    { key: "myhr_request_date", header: "MyHR request date", width: 18, isDate: true },
];

/** Cột auto-compute từ candidates */
const AUTO_FIELDS: { key: string; header: string; width: number; isDate?: boolean }[] = [
    { key: "expected_onboard_date", header: "Expected onboard date", width: 20, isDate: true },
    { key: "status", header: "Status", width: 16 },
    { key: "cv_sent", header: "CV Sent", width: 10 },
    { key: "interview", header: "Interview", width: 12 },
    { key: "offered", header: "Offered", width: 10 },
    { key: "offer_accepted", header: "Offer Accepted", width: 16 },
    { key: "onboarded", header: "Onboarded", width: 12 },
    { key: "offer_rejected", header: "Offer Rejected", width: 14 },
    { key: "source", header: "Source", width: 20 },
    { key: "candidate_name", header: "Candidate Name", width: 20 },
    { key: "onboard_date", header: "Onboard Date", width: 16, isDate: true },
    { key: "offer_date", header: "Offer Date", width: 16, isDate: true },
];

/** Cột cuối — từ JdRow */
const TAIL_FIELDS: { key: string; header: string; width: number }[] = [
    { key: "note", header: "Note", width: 20 },
];

const ALL_FIELDS = [...JD_FIELDS, ...AUTO_FIELDS, ...TAIL_FIELDS];

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

/**
 * Tính các trường auto cho 1 JD từ danh sách candidate.
 */
function computeAutoFields(
    jobCode: string,
    candidates: CandidateRowForJd[]
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

    const expectedDate = list.find((c) => c.expected_onboard_date)?.expected_onboard_date ?? null;

    return {
        expected_onboard_date: toExcelValue(expectedDate),
        status,
        cv_sent: cvSent,
        interview,
        offered,
        offer_accepted: offerAccepted,
        onboarded,
        offer_rejected: offerRejected,
        source: ob?.source ?? null,
        candidate_name: ob?.name ?? null,
        onboard_date: toExcelValue(ob?.onboarding_date ?? null),
        offer_date: toExcelValue(ob?.offer_sent_date ?? null),
    };
}

// ======================== FUNCTION ========================

/**
 * Tạo sheet "IDL tracking" — không cần template.
 *
 * Các trường auto (status, cv_sent, interview, offered, offer_accepted,
 * onboarded, offer_rejected, source, candidate_name, onboard_date,
 * offer_date, expected_onboard_date) tự tính từ candidates.
 */
export function createIDLTrackingSheet(
    workbook: ExcelJS.Workbook,
    input: IDLTrackingInput
): ExcelJS.Worksheet {
    const ws = workbook.addWorksheet("IDL tracking");

    // --- Column widths ---
    ALL_FIELDS.forEach((f, i) => {
        ws.getColumn(i + 1).width = f.width;
    });

    // --- Header row ---
    const headerRow = ws.getRow(1);
    ALL_FIELDS.forEach((f, i) => {
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
    input.jd_list.forEach((jd, rowIdx) => {
        const row = ws.getRow(rowIdx + 2);

        // Auto-compute từ candidates
        const auto = input.candidates?.length
            ? computeAutoFields(jd.job_code, input.candidates)
            : {};

        // Merge JD input + auto
        const rowData: Record<string, any> = { ...jd, ...auto };

        ALL_FIELDS.forEach((f, colIdx) => {
            const cell = row.getCell(colIdx + 1);
            const val = toExcelValue(rowData[f.key] ?? null);
            cell.value = val;
            cell.font = { ...DATA_FONT };
            cell.border = { ...THIN_BORDER };
            cell.alignment = { vertical: "middle" };

            if (val instanceof Date) {
                cell.numFmt = DATE_FMT;
            }
        });

        row.commit();
    });

    return ws;
}