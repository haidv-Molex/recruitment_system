import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

async function deleteSite(
  id: number,
  pool: PoolClient
): Promise<void> {
  const checkQuery = `SELECT site_id FROM site WHERE site_id = $1`;
  const checkResult = await pool.query(checkQuery, [id]);
  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy địa điểm để xóa", 404);
  }

  const query = `
    DELETE FROM site
    WHERE site_id = $1
  `;
  await pool.query(query, [id]);
}

export default deleteSite;
