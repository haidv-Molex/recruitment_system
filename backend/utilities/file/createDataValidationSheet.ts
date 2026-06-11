import ExcelJS from "exceljs";
import {
    applyHeaderStyle,
    applyDataStyle,
} from "./sheetStyles";


// ======================== TYPES ========================

/**
 * Mỗi key = tên header, value = danh sách giá trị trong cột đó.
 *
 * Ví dụ:
 * {
 *   "Dept":         ["CA", "OTC", "BOD", "FM/EHS", ...],
 *   "PIC":          ["Tracy", "Annie", "Hein", "Kim", "Jun"],
 *   "Final Status": ["CV Sent", "Interview", "Hold", ...],
 * }
 */
export type ValidationColumns = Record<string, (string | null)[]>;

/**
 * Section phụ bên dưới bảng chính (Expected onboard date, Vendor...).
 * Mỗi section = mảng các dòng, mỗi dòng = mảng giá trị theo cột.
 */
export interface ExtraSection {
    rows: (string | null)[][];
}

export interface DataValidationInput {
    columns: ValidationColumns;
    extra_sections?: ExtraSection[];
}

// ======================== FUNCTION ========================

export function createDataValidationSheet(
    workbook: ExcelJS.Workbook,
    input: DataValidationInput
): ExcelJS.Worksheet {
    const ws = workbook.addWorksheet("Data Validation");

    const headers = Object.keys(input.columns);
    const maxRows = Math.max(...Object.values(input.columns).map((col) => col.length), 0);

    // --- Column widths ---
    headers.forEach((_, i) => {
        ws.getColumn(i + 1).width = 22;
    });

    // --- Header row ---
    const headerRow = ws.getRow(1);
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        applyHeaderStyle(cell);
    });
    headerRow.height = 30;
    headerRow.commit();

    // --- Freeze header ---
    ws.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

    // --- Data rows ---
    for (let r = 0; r < maxRows; r++) {
        const row = ws.getRow(r + 2);
        headers.forEach((h, colIdx) => {
            const cell = row.getCell(colIdx + 1);
            const val = input.columns[h]?.[r] ?? null;
            cell.value = val;
            applyDataStyle(cell);
        });
        row.commit();
    }

    // --- Extra sections ---
    if (input.extra_sections) {
        let currentRow = maxRows + 3; // 1 dòng trống
        for (const section of input.extra_sections) {
            for (const sectionRow of section.rows) {
                const row = ws.getRow(currentRow);
                sectionRow.forEach((val, colIdx) => {
                    const cell = row.getCell(colIdx + 1);
                    cell.value = val;
                    applyDataStyle(cell);
                });
                row.commit();
                currentRow++;
            }
            currentRow++; // gap giữa sections
        }
    }

    return ws;
}
