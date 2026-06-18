import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { departmentModel } from "@model/department/departmentModel";

type CreateDepartmentData = {
  department_code: string;
  department_name: string;
  department_description?: string | null;
  user_id?: number | null;
};

async function create(
  data: CreateDepartmentData,
  pool: PoolClient
): Promise<departmentModel> {
  const { department_code, department_name, department_description = null, user_id = null } = data;

  const query = `
    WITH inserted AS (
      INSERT INTO department (department_code, department_name, department_description, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING department_id, department_code, department_name, department_description, user_id, create_at, update_at
    )
    SELECT i.department_id, i.department_code, i.department_name, i.department_description, i.user_id, i.create_at, i.update_at,
           u.user_name, u.user_description AS u_description, u.user_role, u.create_at AS u_create_at, u.update_at AS u_update_at
    FROM inserted i
    LEFT JOIN "user" u ON i.user_id = u.user_id
  `;
  const result = await pool.query(query, [department_code, department_name, department_description, user_id]);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi tạo phòng ban mới", 500);
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

export default create;
