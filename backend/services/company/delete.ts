import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

async function deleteCompany(
  id: number,
  pool: PoolClient
): Promise<void> {
  const checkQuery = `SELECT company_id FROM company WHERE company_id = $1`;
  const checkResult = await pool.query(checkQuery, [id]);
  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy công ty để xóa", 404);
  }

  const query = `
    DELETE FROM company
    WHERE company_id = $1
  `;
  await pool.query(query, [id]);
}

export default deleteCompany;
