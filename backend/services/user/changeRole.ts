import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

type HRRole = "hr" | "banned";

/**
 * Đổi role của một tài khoản giữa 'hr' và 'banned'.
 * - Chỉ hoạt động nếu user hiện tại đang có role 'hr' hoặc 'banned'.
 * - targetRole phải là 'hr' hoặc 'banned'.
 */
async function changeRole(
  userId: number,
  targetRole: HRRole,
  pool: PoolClient
): Promise<void> {
  const allowedRoles: HRRole[] = ["hr", "banned"];

  if (!allowedRoles.includes(targetRole)) {
    throw new AppError("Role không hợp lệ. Chỉ được phép chuyển sang 'hr' hoặc 'banned'", 400);
  }

  const query = `
    UPDATE "user"
    SET user_role = $2
    WHERE user_id = $1
      AND user_role = ANY($3::text[])
    RETURNING user_id
  `;

  // Chỉ update nếu role hiện tại là 1 trong 2 role được phép
  const oppositeRoles = allowedRoles.filter(r => r !== targetRole);
  const result = await pool.query(query, [userId, targetRole, oppositeRoles]);

  if (result.rowCount === 0) {
    throw new AppError(
      `Không tìm thấy tài khoản hoặc tài khoản không ở role có thể chuyển sang '${targetRole}'`,
      404
    );
  }
}

export default changeRole;
