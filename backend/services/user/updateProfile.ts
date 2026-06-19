import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";
import findById from "@services/user/findById";
import assertFirstRow from "@utilities/db/assertFirstRow";
import buildUpdateSet from "@utilities/db/buildUpdateSet";

/**
 * Cập nhật thông tin cá nhân của người dùng (tên và mô tả).
 */
async function updateProfile(
  userId: number,
  data: { username?: string; description?: string },
  pool: PoolClient
): Promise<userOutputModel> {
  const { setClauses, values, nextIndex } = buildUpdateSet([
    { column: "user_name", value: data.username },
    { column: "user_description", value: data.description }
  ]);

  if (setClauses.length === 0) {
    throw new AppError("Không có thông tin nào để cập nhật", 400);
  }

  values.push(userId);
  const query = `
    UPDATE "user"
    SET ${setClauses.join(", ")}
    WHERE user_id = $${nextIndex}
    RETURNING user_id
  `;

  const result = await pool.query(query, values);
  const row = assertFirstRow(result.rows, "Không tìm thấy người dùng", 404);

  return await findById(row.user_id, pool);
}

export default updateProfile;
