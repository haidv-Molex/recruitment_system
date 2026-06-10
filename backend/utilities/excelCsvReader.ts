import ExcelJS from "exceljs";
import fs from "fs";
import { AppError } from "@middlewares/AppError";

function getCellValue(cell: ExcelJS.Cell): any {
  const value = cell.value;
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "object") {
    // Formula — lấy result, nếu không có result thì trả null
    if ("formula" in value || "sharedFormula" in value) {
      return value.result !== undefined && value.result !== null
        ? value.result
        : null;
    }
    // Hyperlink
    if ("text" in value) {
      return value.text;
    }
    // RichText
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((rt: any) => rt.text || "").join("");
    }
  }
  return value;
}

function parseCellValue(val: any): any {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "") return val;
    const num = Number(trimmed);
    if (!isNaN(num)) {
      if (trimmed.startsWith("+")) return val;
      if (trimmed.startsWith("0") && trimmed !== "0" && !trimmed.startsWith("0.")) return val;
      if (trimmed.length > 15) return val;
      return num;
    }
    if (trimmed.toLowerCase() === "true") return true;
    if (trimmed.toLowerCase() === "false") return false;
  }
  return val;
}

function detectHeaderRow(worksheet: ExcelJS.Worksheet, colCount: number): number {
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

/**
 * Parse a single worksheet into a JSON array.
 */
function parseWorksheet(
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

// ===== Return type cho đọc nhiều sheet =====
export interface AllSheetsResult {
  [sheetName: string]: any[];
}

/**
 * Reads an Excel or CSV file.
 *
 * - Nếu truyền sheetName → trả về data của sheet đó (any[])
 * - Nếu KHÔNG truyền sheetName → trả về TẤT CẢ sheet ({ [sheetName]: any[] })
 *
 * @param filePath - Path to the file.
 * @param options
 *   - sheetName: read only this sheet (returns any[])
 *   - headerRow: 1-based header row number (default: auto-detect)
 */
export async function readExcelOrCsvToJson(
  filePath: string,
  options?: { sheetName?: string; headerRow?: number }
): Promise<any[] | AllSheetsResult> {
  if (!fs.existsSync(filePath)) {
    throw new AppError(`File not found: ${filePath}`, 404);
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const isCsv = filePath.toLowerCase().endsWith(".csv");

    if (isCsv) {
      await workbook.csv.readFile(filePath);
    } else {
      await workbook.xlsx.readFile(filePath);
    }

    const sheets = workbook.worksheets;
    if (sheets.length === 0) {
      throw new AppError("Workbook has no sheets", 400);
    }

    // --- Chỉ định 1 sheet ---
    if (options?.sheetName) {
      const worksheet = workbook.getWorksheet(options.sheetName);
      if (!worksheet) {
        throw new AppError(
          `Sheet "${options.sheetName}" not found in workbook`,
          400
        );
      }
      return parseWorksheet(worksheet, options.headerRow);
    }

    // --- Đọc tất cả sheet ---
    const result: AllSheetsResult = {};

    for (const worksheet of sheets) {
      // Bỏ qua sheet rỗng hoặc sheet ẩn
      if (worksheet.state === "hidden" || worksheet.state === "veryHidden") {
        continue;
      }
      result[worksheet.name] = parseWorksheet(worksheet, options?.headerRow);
    }

    return result;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to read Excel/CSV file: ${error.message}`, 400);
  }
}

/**
 * Writes JSON data to an Excel or CSV file.
 */
export async function writeJsonToExcelOrCsv(
  data: any[] | AllSheetsResult,
  filePath: string,
  options?: { sheetName?: string }
): Promise<void> {
  try {
    const workbook = new ExcelJS.Workbook();
    const isCsv = filePath.toLowerCase().endsWith(".csv");

    // Nếu data là object nhiều sheet
    if (!Array.isArray(data)) {
      for (const [name, rows] of Object.entries(data)) {
        const ws = workbook.addWorksheet(name);
        if (rows.length > 0) {
          const headers = Object.keys(rows[0]);
          ws.columns = headers.map((key) => ({ header: key, key }));
          ws.addRows(rows);
        }
      }
    } else {
      // Data là 1 array → ghi vào 1 sheet
      const sheetName = options?.sheetName || "Sheet1";
      const ws = workbook.addWorksheet(sheetName);
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        ws.columns = headers.map((key) => ({ header: key, key }));
        ws.addRows(data);
      }
    }

    if (isCsv) {
      await workbook.csv.writeFile(filePath);
    } else {
      await workbook.xlsx.writeFile(filePath);
    }
  } catch (error: any) {
    throw new AppError(`Failed to write Excel/CSV file: ${error.message}`, 500);
  }
}