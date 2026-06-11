/**
 * Parse a single worksheet into a JSON array.
 */
import ExcelJS from "exceljs";
import getCellValue from "./getCellValue";
import parseCellValue from "./parseCellValue";
import detectHeaderRow from "./detectHeaderRow";

export default function parseWorksheet(
    worksheet: ExcelJS.Worksheet,
    headerRowNum?: number
): any[] {
    const colCount = worksheet.columnCount;
    if (!colCount || colCount === 0) return [];

    const actualHeaderRow = headerRowNum ?? detectHeaderRow(worksheet, colCount);
    const headerRow = worksheet.getRow(actualHeaderRow);
    const headers: (string | undefined)[] = [];

    for (let i = 1; i <= colCount; i++) {
        const val = getCellValue(headerRow.getCell(i));
        if (val !== undefined && val !== null && String(val).trim() !== "") {
            headers[i] = String(val).trim();
        }
    }

    const jsonData: any[] = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= actualHeaderRow) return;

        const rowData: any = {};
        let hasData = false;

        for (let i = 1; i <= colCount; i++) {
            if (headers[i] === undefined) continue;
            const cellVal = getCellValue(row.getCell(i));

            // ---- THAY ĐỔI: luôn gán giá trị, trống thì null ----
            if (cellVal !== undefined && cellVal !== null) {
                rowData[headers[i]!] = parseCellValue(cellVal);
                hasData = true;
            } else {
                rowData[headers[i]!] = null;
            }
        }

        if (hasData) {
            jsonData.push(rowData);
        }
    });

    return jsonData;
}