// sheetStyles.ts
// Shared Excel styles cho tất cả các sheet trong hệ thống.
import ExcelJS from "exceljs";

// ======================== FONTS ========================

export const HEADER_FONT: Partial<ExcelJS.Font> = {
    name: "Segoe UI",
    size: 10,
    bold: true,
    color: { argb: "FFFFFFFF" }, // chữ trắng trên nền tối
};

export const DATA_FONT: Partial<ExcelJS.Font> = {
    name: "Segoe UI",
    size: 10,
    bold: false,
};

// ======================== FILLS ========================

export const HEADER_FILL: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF002060" }, // #002060
};

// ======================== BORDERS ========================

export const THIN_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
};

// ======================== ALIGNMENTS ========================

export const HEADER_ALIGNMENT: Partial<ExcelJS.Alignment> = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
};

export const DATA_ALIGNMENT: Partial<ExcelJS.Alignment> = {
    vertical: "middle",
    wrapText: false,
};

// ======================== DATE FORMAT ========================

export const DATE_FMT = "mm/dd/yyyy";

// ======================== HELPERS ========================

/**
 * Apply header style cho 1 cell
 */
export function applyHeaderStyle(cell: ExcelJS.Cell): void {
    cell.font = { ...HEADER_FONT };
    cell.fill = { ...HEADER_FILL } as ExcelJS.Fill;
    cell.border = { ...THIN_BORDER };
    cell.alignment = { ...HEADER_ALIGNMENT };
}

/**
 * Apply data style cho 1 cell
 */
export function applyDataStyle(cell: ExcelJS.Cell, isDate = false): void {
    cell.font = { ...DATA_FONT };
    cell.border = { ...THIN_BORDER };
    cell.alignment = { ...DATA_ALIGNMENT };
    if (isDate && cell.value instanceof Date) {
        cell.numFmt = DATE_FMT;
    }
}

/**
 * Tạo header row + freeze + set column widths cho 1 worksheet.
 * 
 * @param ws       - Worksheet cần setup
 * @param fields   - Danh sách cột { header, width, isDate? }
 * @param headerHeight - Chiều cao header row (default 30)
 */
export function setupSheetHeader(
    ws: ExcelJS.Worksheet,
    fields: { header: string; width: number }[],
    headerHeight = 30
): void {
    // Column widths
    fields.forEach((f, i) => {
        ws.getColumn(i + 1).width = f.width;
    });

    // Header row
    const headerRow = ws.getRow(1);
    fields.forEach((f, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = f.header;
        applyHeaderStyle(cell);
    });
    headerRow.height = headerHeight;
    headerRow.commit();

    // Freeze header
    ws.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];
}