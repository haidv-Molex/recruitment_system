import { PoolClient } from "pg";
import normalizeLookupKey from "@utilities/entity/normalizeLookupKey";

type ResolveAndCreateEntitiesOptions = {
  names: Iterable<string>;
  tableName: string;
  idColumn: string;
  nameColumn: string;
  pool: PoolClient;
  create: (name: string) => Promise<number>;
};

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

export async function resolveAndCreateEntities(
  options: ResolveAndCreateEntitiesOptions
): Promise<Map<string, number>> {
  const { names, tableName, idColumn, nameColumn, pool, create } = options;
  const nameMap = new Map<string, number>();
  const lowerToOriginal = new Map<string, string>();

  for (const name of names) {
    const key = normalizeLookupKey(name);
    if (key && !lowerToOriginal.has(key)) {
      lowerToOriginal.set(key, String(name).trim());
    }
  }

  const uniqueKeys = Array.from(lowerToOriginal.keys());
  if (uniqueKeys.length === 0) return nameMap;

  const quotedTable = quoteIdentifier(tableName);
  const quotedIdColumn = quoteIdentifier(idColumn);
  const quotedNameColumn = quoteIdentifier(nameColumn);

  const query = `
    SELECT ${quotedIdColumn} AS id, ${quotedNameColumn} AS name, LOWER(${quotedNameColumn}) AS lower_name
    FROM ${quotedTable}
    WHERE LOWER(${quotedNameColumn}) = ANY($1)
  `;
  const result = await pool.query(query, [uniqueKeys]);

  for (const row of result.rows) {
    const key = normalizeLookupKey(row.lower_name);
    if (key) {
      nameMap.set(key, Number(row.id));
    }
  }

  for (const key of uniqueKeys) {
    if (!nameMap.has(key)) {
      const originalName = lowerToOriginal.get(key)!;
      const newId = await create(originalName);
      nameMap.set(key, newId);
    }
  }

  return nameMap;
}

export default resolveAndCreateEntities;