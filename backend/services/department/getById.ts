import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { departmentModel } from "@model/department/departmentModel";

async function getById(
  id: number,
  pool: PoolClient
): Promise<departmentModel> {
  const query = `
    SELECT department_id, department_code, department_name, department_description, create_at, update_at
    FROM department
    WHERE department_id = $1
  `;
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy phòng ban", 404);
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

export default getById;
