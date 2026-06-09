import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

async function deletePlatform(
  id: number,
  pool: PoolClient
): Promise<void> {
  const checkQuery = `SELECT platform_id FROM platform WHERE platform_id = $1`;
  const checkResult = await pool.query(checkQuery, [id]);
  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy nền tảng để xóa", 404);
  }

  const query = `
    DELETE FROM platform
    WHERE platform_id = $1
  `;
  await pool.query(query, [id]);
}

export default deletePlatform;
