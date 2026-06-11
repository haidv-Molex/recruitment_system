import ExcelJS from "exceljs";
import getCellValue from "./getCellValue";

export default function detectHeaderRow(worksheet: ExcelJS.Worksheet, colCount: number): number {
    let bestRow = 1;
    let bestCount = 0;
    const maxScan = Math.min(worksheet.rowCount, 10);

    for (let r = 1; r <= maxScan; r++) {
        const row = worksheet.getRow(r);
        let filled = 0;
        for (let c = 1; c <= colCount; c++) {
            const val = getCellValue(row.getCell(c));
            if (val !== undefined && val !== null && String(val).trim() !== "") {
                filled++;
            }
        }
        if (filled > bestCount) {
            bestCount = filled;
            bestRow = r;
        }
    }
    return bestRow;
}