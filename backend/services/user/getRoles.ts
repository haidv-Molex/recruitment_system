import { PoolClient } from "pg";

/**
 * Lấy danh sách các role hiện có của hệ thống.
 * 
 * @param pool Connection Pool Client từ PostgreSQL (tham số bắt buộc của service)
 * @returns Promise<string[]> Danh sách các vai trò (roles) trong hệ thống
 */
async function getRoles(pool: PoolClient): Promise<string[]> {
  return ["admin", "hr", "user", "banned"];
}

export default getRoles;
