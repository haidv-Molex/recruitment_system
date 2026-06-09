import { PoolClient } from "pg";

/**
 * Kiểm tra xem người dùng có bị khóa tài khoản không (dành cho logic mở rộng sau này).
 */
async function checkUserBanned(userId: number, pool: PoolClient): Promise<void> {
  // Để trống hoặc thêm điều kiện kiểm tra nếu có
  return;
}

export default checkUserBanned;
