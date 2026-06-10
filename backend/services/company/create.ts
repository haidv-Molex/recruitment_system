import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { companyModel } from "@model/company/companyModel";

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
    RETURNING company_id, company_name, company_description
  `;
  const result = await pool.query(query, [company_name, company_description]);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi tạo công ty mới", 500);
  }

  return {
    company_id: result.rows[0].company_id,
    company_name: result.rows[0].company_name,
    company_description: result.rows[0].company_description
  } satisfies companyModel;
}

export default create;
