import { PoolClient } from "pg";
import type { companyModel } from "@model/company/companyModel";
import Company from "@services/company/_Company";
import assertFirstRow from "@utilities/db/assertFirstRow";

type CreateCompanyData = {
  company_name: string;
  company_description?: string | null;
};

async function create(
  data: CreateCompanyData,
  pool: PoolClient
): Promise<companyModel> {
  const { company_name, company_description = null } = data;

  const query = `
    INSERT INTO company (company_name, company_description)
    VALUES ($1, $2)
    RETURNING company_id
  `;
  const result = await pool.query(query, [company_name, company_description]);
  const row = assertFirstRow(result.rows, "Lỗi khi tạo công ty mới", 500);

  return await Company.getById(row.company_id, pool);
}

export default create;
