import ExcelJS from "exceljs";
import fs from "fs";
import { AppError } from "@middlewares/AppError";
import parseWorksheet from "./parseWorksheet";

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

