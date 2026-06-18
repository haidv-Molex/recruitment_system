import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { departmentModel } from "@model/department/departmentModel";
import Department from "@services/department/_Department";
import assertFirstRow from "@utilities/db/assertFirstRow";
import buildUpdateSet from "@utilities/db/buildUpdateSet";

type UpdateDepartmentData = {
  department_code?: string;
  department_name?: string;
  department_description?: string | null;
  user_id?: number | null;
};

async function update(
  id: number,
  data: UpdateDepartmentData,
  pool: PoolClient
): Promise<departmentModel> {
  // Check if exists
  const checkQuery = `SELECT department_id FROM department WHERE department_id = $1`;
  const checkResult = await pool.query(checkQuery, [id]);
  assertFirstRow(checkResult.rows, "Không tìm thấy phòng ban để cập nhật", 404);

  const updateSet = buildUpdateSet([
    { column: "department_code", value: data.department_code },
    { column: "department_name", value: data.department_name },
    { column: "department_description", value: data.department_description },
    { column: "user_id", value: data.user_id }
  ]);

  if (updateSet.setClauses.length === 0) {
    throw new AppError("Không có dữ liệu thay đổi", 400);
  }

  const values = updateSet.values;
  values.push(id);
  const query = `
    UPDATE department
    SET ${updateSet.setClauses.join(", ")}, update_at = CURRENT_TIMESTAMP
    WHERE department_id = $${updateSet.nextIndex}
    RETURNING department_id
  `;
  const result = await pool.query(query, values);
  const row = assertFirstRow(result.rows, "Lỗi khi cập nhật phòng ban", 500);

  return await Department.getById(row.department_id, pool);
}

export default update;
