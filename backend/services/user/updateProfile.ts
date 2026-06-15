import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";

/**
 * Cập nhật thông tin cá nhân của người dùng (tên và mô tả).
 */
async function updateProfile(
  userId: number,
  data: { username?: string; description?: string; departmentId?: number },
  pool: PoolClient
): Promise<userOutputModel> {
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (data.username !== undefined) {
    fields.push(`user_name = $${index++}`);
    values.push(data.username);
  }

  if (data.description !== undefined) {
    fields.push(`user_description = $${index++}`);
    values.push(data.description);
  }

  if (data.departmentId !== undefined) {
    fields.push(`department_id = $${index++}`);
    values.push(data.departmentId);
  }

  if (fields.length === 0) {
    throw new AppError("Không có thông tin nào để cập nhật", 400);
  }

  values.push(userId);
  const query = `
    WITH updated AS (
      UPDATE "user"
      SET ${fields.join(", ")}
      WHERE user_id = $${index}
      RETURNING user_id, user_name, user_description, user_role, department_id, create_at, update_at
    )
    SELECT
      u.user_id, u.user_name, u.user_description, u.user_role,
      u.create_at, u.update_at,
      d.department_id, d.department_code, d.department_name, d.department_description,
      d.create_at AS d_create_at, d.update_at AS d_update_at
    FROM updated u
    LEFT JOIN department d ON u.department_id = d.department_id
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  const row = result.rows[0];
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_description: row.user_description,
    user_role: row.user_role,
    create_at: row.create_at,
    update_at: row.update_at,
    department: row.department_id != null ? {
      department_id: row.department_id,
      department_code: row.department_code,
      department_name: row.department_name,
      department_description: row.department_description,
      create_at: row.d_create_at,
      update_at: row.d_update_at
    } : null
  } satisfies userOutputModel;
}

export default updateProfile;
