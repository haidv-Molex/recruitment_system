import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { departmentModel } from "@model/department/departmentModel";

async function getById(
  id: number,
  pool: PoolClient
): Promise<departmentModel> {
  const query = `
    SELECT d.department_id, d.department_code, d.department_name, d.department_description, d.user_id, d.create_at, d.update_at,
           u.user_name, u.user_description AS u_description, u.user_role, u.create_at AS u_create_at, u.update_at AS u_update_at
    FROM department d
    LEFT JOIN "user" u ON d.user_id = u.user_id
    WHERE d.department_id = $1
  `;
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy phòng ban", 404);
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

export default getById;
