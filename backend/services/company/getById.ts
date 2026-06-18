import { PoolClient } from "pg";
import type { companyModel } from "@model/company/companyModel";
import assertFirstRow from "@utilities/db/assertFirstRow";

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
  const row = assertFirstRow(result.rows, "Không tìm thấy công ty", 404);

  return {
    company_id: row.company_id,
    company_name: row.company_name,
    company_description: row.company_description
  } satisfies companyModel;
}

export default getById;
