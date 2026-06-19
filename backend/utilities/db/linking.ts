import { PoolClient } from "pg";
import quoteIdentifier from "@utilities/db/quoteIdentifier";

export type LinkValue = string | number | boolean | Date | null;
export type LinkRow = Record<string, LinkValue>;

export async function insertLinkRows(
  pool: PoolClient,
  tableName: string,
  rows: LinkRow[]
): Promise<void> {
  if (rows.length === 0) return;

  const columns = Object.keys(rows[0]);
  if (columns.length === 0) return;

  for (const row of rows) {
    const rowColumns = Object.keys(row);
    if (rowColumns.length !== columns.length || rowColumns.some((column) => !columns.includes(column))) {
      throw new Error("All link rows must contain the same columns");
    }
  }

  const values: LinkValue[] = [];
  const placeholders = rows.map((row) => {
    const rowPlaceholders = columns.map((column) => {
      values.push(row[column]);
      return `$${values.length}`;
    });
    return `(${rowPlaceholders.join(", ")})`;
  });

  const query = `
    INSERT INTO ${quoteIdentifier(tableName)} (${columns.map(quoteIdentifier).join(", ")})
    VALUES ${placeholders.join(", ")}
  `;

  await pool.query(query, values);
}

export async function replaceLinkRows(
  pool: PoolClient,
  tableName: string,
  deleteColumn: string,
  deleteValue: LinkValue,
  rows: LinkRow[]
): Promise<void> {
  await pool.query(
    `DELETE FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier(deleteColumn)} = $1`,
    [deleteValue]
  );

  await insertLinkRows(pool, tableName, rows);
}
