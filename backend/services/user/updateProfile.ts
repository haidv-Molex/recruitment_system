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
    UPDATE "user"
    SET ${fields.join(", ")}
    WHERE user_id = $${index}
    RETURNING user_id, user_name, user_description, user_role, department_id, create_at, update_at
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  return {
    user_id: result.rows[0].user_id,
    user_name: result.rows[0].user_name,
    user_description: result.rows[0].user_description,
    user_role: result.rows[0].user_role,
    department_id: result.rows[0].department_id,
    create_at: result.rows[0].create_at,
    update_at: result.rows[0].update_at
  } satisfies userOutputModel;
}

export default updateProfile;
