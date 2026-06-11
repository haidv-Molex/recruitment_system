import ExcelJS from "exceljs";

export default function getCellValue(cell: ExcelJS.Cell): any {
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