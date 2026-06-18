import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";

/**
 * Cập nhật thông tin cá nhân của người dùng (tên và mô tả).
 */
async function updateProfile(
  userId: number,
  data: { username?: string; description?: string },
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

  if (fields.length === 0) {
    throw new AppError("Không có thông tin nào để cập nhật", 400);
  }

  values.push(userId);
  const query = `
    UPDATE "user"
    SET ${fields.join(", ")}
    WHERE user_id = $${index}
    RETURNING user_id, user_name, user_description, user_role, create_at, update_at
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
    update_at: row.update_at
  } satisfies userOutputModel;
}

export default updateProfile;
