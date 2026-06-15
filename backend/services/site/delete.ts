import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

async function deleteSite(
  idOrIds: number | number[],
  pool: PoolClient
): Promise<void> {
  const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
  if (ids.length === 0) return;

  const checkQuery = `SELECT site_id FROM site WHERE site_id = ANY($1::int[])`;
  const checkResult = await pool.query(checkQuery, [ids]);
  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy địa điểm để xóa", 404);
  }

  const query = `
    DELETE FROM site
    WHERE site_id = ANY($1::int[])
  `;
  await pool.query(query, [ids]);
}

export default deleteSite;
