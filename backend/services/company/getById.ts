import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { companyModel } from "@model/company/companyModel";

async function getById(
  id: number,
  pool: PoolClient
): Promise<companyModel> {
  const query = `
    SELECT company_id, company_name, company_description
    FROM company
    WHERE company_id = $1
  `;
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy công ty", 404);
  }

  return {
    company_id: result.rows[0].company_id,
    company_name: result.rows[0].company_name,
    company_description: result.rows[0].company_description
  } satisfies companyModel;
}

export default getById;
