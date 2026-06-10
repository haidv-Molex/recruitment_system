import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { fileModel } from "@model/file/fileModel";

async function getById(
  id: number,
  pool: PoolClient
): Promise<fileModel> {
  const query = `
    SELECT file_id, file_path
    FROM file
    WHERE file_id = $1
  `;
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy thông tin file", 404);
  }

  return {
    file_id: result.rows[0].file_id,
    file_path: result.rows[0].file_path
  } satisfies fileModel;
}

export default getById;
