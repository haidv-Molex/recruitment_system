import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { companyModel } from "@model/company/companyModel";
import Company from "@services/company/_Company";
import assertFirstRow from "@utilities/db/assertFirstRow";
import buildUpdateSet from "@utilities/db/buildUpdateSet";

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
  assertFirstRow(checkResult.rows, "Không tìm thấy công ty để cập nhật", 404);

  const { setClauses, values, nextIndex } = buildUpdateSet([
    { column: "company_name", value: data.company_name },
    { column: "company_description", value: data.company_description }
  ]);

  if (setClauses.length === 0) {
    throw new AppError("Không có dữ liệu thay đổi", 400);
  }

  values.push(id);
  const query = `
    UPDATE company
    SET ${setClauses.join(", ")}
    WHERE company_id = $${nextIndex}
    RETURNING company_id
  `;
  const result = await pool.query(query, values);
  const row = assertFirstRow(result.rows, "Lỗi khi cập nhật công ty", 500);

  return await Company.getById(row.company_id, pool);
}

export default update;
