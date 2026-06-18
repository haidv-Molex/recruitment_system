import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { departmentModel } from "@model/department/departmentModel";
import User from "@services/user/_User";

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
    INSERT INTO department (department_code, department_name, department_description, user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await pool.query(query, [department_code, department_name, department_description, user_id]);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi tạo phòng ban mới", 500);
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

export default create;
