import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { departmentModel } from "@model/department/departmentModel";
import User from "@services/user/_User";

async function getById(
  id: number,
  pool: PoolClient
): Promise<departmentModel> {
  const query = `
    SELECT *
    FROM department 
    WHERE department_id = $1
  `;
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy phòng ban", 404);
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

export default getById;
