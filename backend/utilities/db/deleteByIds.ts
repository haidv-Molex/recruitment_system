import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import quoteIdentifier from "@utilities/db/quoteIdentifier";

export async function deleteByIds(
  pool: PoolClient,
  tableName: string,
  idColumn: string,
  idOrIds: number | number[],
  notFoundMessage: string
): Promise<void> {
  const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
  if (ids.length === 0) return;

  const quotedTable = quoteIdentifier(tableName);
  const quotedIdColumn = quoteIdentifier(idColumn);
  const checkResult = await pool.query(
    `SELECT ${quotedIdColumn} FROM ${quotedTable} WHERE ${quotedIdColumn} = ANY($1::int[])`,
    [ids]
  );

  if (checkResult.rows.length === 0) {
    throw new AppError(notFoundMessage, 404);
  }

  await pool.query(
    `DELETE FROM ${quotedTable} WHERE ${quotedIdColumn} = ANY($1::int[])`,
    [ids]
  );
}

export default deleteByIds;