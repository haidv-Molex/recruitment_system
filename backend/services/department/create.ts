import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { departmentModel } from "@model/department/departmentModel";

type CreateDepartmentData = {
  department_code: string;
  department_name: string;
  department_description?: string | null;
};

async function create(
  data: CreateDepartmentData,
  pool: PoolClient
): Promise<departmentModel> {
  const { department_code, department_name, department_description = null } = data;

  const query = `
    INSERT INTO department (department_code, department_name, department_description)
    VALUES ($1, $2, $3)
    RETURNING department_id, department_code, department_name, department_description, create_at, update_at
  `;
  const result = await pool.query(query, [department_code, department_name, department_description]);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi tạo phòng ban mới", 500);
  }

  return {
    department_id: result.rows[0].department_id,
    department_code: result.rows[0].department_code,
    department_name: result.rows[0].department_name,
    department_description: result.rows[0].department_description,
    create_at: result.rows[0].create_at,
    update_at: result.rows[0].update_at
  } satisfies departmentModel;
}

export default create;
