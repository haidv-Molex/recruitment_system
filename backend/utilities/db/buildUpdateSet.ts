import quoteIdentifier from "@utilities/db/quoteIdentifier";

export type UpdateField = {
  column: string;
  value: any;
};

export function buildUpdateSet(
  fields: UpdateField[],
  startIndex = 1
): { setClauses: string[]; values: any[]; nextIndex: number } {
  const setClauses: string[] = [];
  const values: any[] = [];
  let index = startIndex;

  for (const field of fields) {
    if (field.value !== undefined) {
      setClauses.push(`${quoteIdentifier(field.column)} = $${index++}`);
      values.push(field.value);
    }
  }

  return { setClauses, values, nextIndex: index };
}

export default buildUpdateSet;