export default function parseCellValue(val: any): any {
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
