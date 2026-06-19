import { PoolClient } from "pg";
import deleteByIds from "@utilities/db/deleteByIds";

/**
 * Xóa tài khoản người dùng bằng user_id.
 */
async function deleteAccount(userId: number, pool: PoolClient): Promise<void> {
  await deleteByIds(pool, "user", "user_id", userId, "Không tìm thấy người dùng để xoá");
}

export default deleteAccount;
