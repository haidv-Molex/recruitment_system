import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";
import User from "@services/user/_User";

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
    RETURNING user_id
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  return await User.findById(result.rows[0].user_id, pool);
}

export default updateProfile;
