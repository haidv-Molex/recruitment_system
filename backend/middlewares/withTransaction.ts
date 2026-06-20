import { pool } from "@/middlewares/database";
import { PoolClient } from "pg";
import { httpContext } from "./httpContext";

export interface TransactionClient extends PoolClient {
  onRollback?: (() => Promise<void> | void)[];
}

export async function withTransaction<T>(
  callback: (client: TransactionClient) => Promise<T>,
  user?: { user_id?: number; user_role?: string | null }
): Promise<T> {
  const client = await pool.connect() as TransactionClient;
  client.onRollback = [];

  const req = httpContext.getStore();
  const currentUser = user || (req ? (req.user as any) : undefined);

  try {
    await client.query("BEGIN");
    if (currentUser) {
      await client.query("SET ROLE app_user");
      if (currentUser.user_id !== undefined) {
        await client.query("SELECT set_config('app.current_user_id', $1, true)", [String(currentUser.user_id)]);
      }
      if (currentUser.user_role) {
        await client.query("SELECT set_config('app.current_user_role', $1, true)", [currentUser.user_role]);
      }
    }

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
    if (currentUser) {
      try {
        await client.query("RESET ROLE");
      } catch (resetErr) {
        console.error("Lỗi khi reset role trong database client:", resetErr);
      }
    }

    delete client.onRollback;
    client.release();
  }
}