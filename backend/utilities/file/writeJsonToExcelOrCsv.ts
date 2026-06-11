import ExcelJS from "exceljs";
import { AppError } from "@middlewares/AppError";
import { AllSheetsResult } from "./readExcelOrCsvToJson";
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