import { pool } from "@/middlewares/database";
import { PoolClient } from "pg";

export interface TransactionClient extends PoolClient {
  onRollback?: (() => Promise<void> | void)[];
}

export async function withTransaction<T>(
  callback: (client: TransactionClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect() as TransactionClient;
  client.onRollback = [];

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    
    // Thực thi các lệnh bù trừ (Compensating Transactions) nếu có
    if (client.onRollback && client.onRollback.length > 0) {
      for (const hook of client.onRollback) {
        try {
          await hook();
        } catch (hookErr) {
          console.error("Lỗi khi chạy onRollback hook:", hookErr);
        }
      }
    }
    throw err;
  } finally {
    delete client.onRollback;
    client.release();
  }
}