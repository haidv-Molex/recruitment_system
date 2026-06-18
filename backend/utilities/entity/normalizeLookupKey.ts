export function normalizeLookupKey(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

export default normalizeLookupKey;