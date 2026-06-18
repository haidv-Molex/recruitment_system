export function buildWhereClause(conditions: string[], keyword = "WHERE"): string {
  const activeConditions = conditions.map((condition) => condition.trim()).filter(Boolean);
  return activeConditions.length > 0 ? `${keyword} ${activeConditions.join(" AND ")}` : "";
}

export default buildWhereClause;