import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { companyModel } from "@model/company/companyModel";

type UpdateCompanyData = {
  company_name?: string;
  company_description?: string | null;
};

async function update(
  id: number,
  data: UpdateCompanyData,
  pool: PoolClient
): Promise<companyModel> {
  // Check if company exists
  const checkQuery = `SELECT company_id FROM company WHERE company_id = $1`;
  const checkResult = await pool.query(checkQuery, [id]);
  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy công ty để cập nhật", 404);
  }

  // Build dynamic update query
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (data.company_name !== undefined) {
    fields.push(`company_name = $${index++}`);
    values.push(data.company_name);
  }
  if (data.company_description !== undefined) {
    fields.push(`company_description = $${index++}`);
    values.push(data.company_description);
  }

  if (fields.length === 0) {
    throw new AppError("Không có dữ liệu thay đổi", 400);
  }

  values.push(id);
  const query = `
    UPDATE company
    SET ${fields.join(", ")}
    WHERE company_id = $${index}
    RETURNING company_id, company_name, company_description
  `;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi cập nhật công ty", 500);
  }

  return {
    company_id: result.rows[0].company_id,
    company_name: result.rows[0].company_name,
    company_description: result.rows[0].company_description
  } satisfies companyModel;
}

export default update;
