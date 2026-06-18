import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { departmentModel } from "@model/department/departmentModel";

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
    WITH updated AS (
      UPDATE department
      SET ${fields.join(", ")}, update_at = CURRENT_TIMESTAMP
      WHERE department_id = $${index}
      RETURNING department_id, department_code, department_name, department_description, user_id, create_at, update_at
    )
    SELECT u.department_id, u.department_code, u.department_name, u.department_description, u.user_id, u.create_at, u.update_at,
           usr.user_name, usr.user_description AS u_description, usr.user_role, usr.create_at AS u_create_at, usr.update_at AS u_update_at
    FROM updated u
    LEFT JOIN "user" usr ON u.user_id = usr.user_id
  `;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi cập nhật phòng ban", 500);
  }

  const row = result.rows[0];

  return {
    department_id: row.department_id,
    department_code: row.department_code,
    department_name: row.department_name,
    department_description: row.department_description,
    create_at: row.create_at,
    update_at: row.update_at,
    user: row.user_id ? {
      user_id: row.user_id,
      user_name: row.user_name,
      user_description: row.u_description,
      user_role: row.user_role,
      create_at: row.u_create_at,
      update_at: row.u_update_at
    } : null
  } satisfies departmentModel;
}

export default update;
