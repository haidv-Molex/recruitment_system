import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { departmentModel } from "@model/department/departmentModel";
import User from "@services/user/_User";

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
  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy phòng ban để cập nhật", 404);
  }

  // Build dynamic update query
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (data.department_code !== undefined) {
    fields.push(`department_code = $${index++}`);
    values.push(data.department_code);
  }
  if (data.department_name !== undefined) {
    fields.push(`department_name = $${index++}`);
    values.push(data.department_name);
  }
  if (data.department_description !== undefined) {
    fields.push(`department_description = $${index++}`);
    values.push(data.department_description);
  }
  if (data.user_id !== undefined) {
    fields.push(`user_id = $${index++}`);
    values.push(data.user_id);
  }

  if (fields.length === 0) {
    throw new AppError("Không có dữ liệu thay đổi", 400);
  }

  values.push(id);
  const query = `
    UPDATE department
    SET ${fields.join(", ")}, update_at = CURRENT_TIMESTAMP
    WHERE department_id = $${index}
    RETURNING *
  `;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi cập nhật phòng ban", 500);
  }

  const row = result.rows[0];
  const user = row.user_id ? await User.findById(row.user_id, pool) : null;

  return {
    department_id: row.department_id,
    department_code: row.department_code,
    department_name: row.department_name,
    department_description: row.department_description,
    create_at: row.create_at,
    update_at: row.update_at,
    user
  } satisfies departmentModel;
}

export default update;
