// createDataValidationSheet.ts

import ExcelJS from "exceljs";

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

// ======================== STYLES ========================

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

// ======================== FUNCTION ========================

export function createDataValidationSheet(
    workbook: ExcelJS.Workbook,
    input: DataValidationInput
): ExcelJS.Worksheet {
    const ws = workbook.addWorksheet("Data Validation");

    const headers = Object.keys(input.columns);
    const colCount = headers.length;

    // Tìm số dòng data nhiều nhất
    const maxRows = Math.max(...Object.values(input.columns).map((v) => v.length), 0);

    // --- Column widths: auto theo header length, tối thiểu 14 ---
    headers.forEach((h, i) => {
        ws.getColumn(i + 1).width = Math.max(h.length + 4, 14);
    });

    // --- Header row ---
    const headerRow = ws.getRow(1);
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { ...HEADER_FONT };
        cell.fill = { ...HEADER_FILL } as ExcelJS.Fill;
        cell.border = { ...THIN_BORDER };
        cell.alignment = { vertical: "middle", wrapText: true };
    });
    headerRow.height = 20;
    headerRow.commit();

    // --- Data rows ---
    for (let r = 0; r < maxRows; r++) {
        const row = ws.getRow(r + 2);
        headers.forEach((h, colIdx) => {
            const val = input.columns[h][r] ?? null;
            const cell = row.getCell(colIdx + 1);
            cell.value = val;
            cell.font = { ...DATA_FONT };
            cell.border = { ...THIN_BORDER };
            cell.alignment = { vertical: "middle" };
        });
        row.commit();
    }

    // --- Extra sections ---
    if (input.extra_sections?.length) {
        let currentRow = maxRows + 2 + 1; // +1 dòng trống

        for (const section of input.extra_sections) {
            for (const rowData of section.rows) {
                const row = ws.getRow(currentRow);
                rowData.forEach((val, colIdx) => {
                    if (val === null) return;
                    const cell = row.getCell(colIdx + 1);
                    cell.value = val;
                    cell.font = { ...DATA_FONT };
                    cell.alignment = { vertical: "middle" };
                });
                row.commit();
                currentRow++;
            }
            currentRow++; // dòng trống giữa các section
        }
    }

    return ws;
}