import { Client } from "pg";
import "dotenv/config";

async function checkDatabase(): Promise<void> {
  const { PG_USER, PG_HOST, PG_DATABASE, PG_PASSWORD, PG_PORT } = process.env;

  if (!PG_USER || !PG_HOST || !PG_DATABASE || !PG_PASSWORD || !PG_PORT) {
    console.error("❌ Thiếu biến môi trường cấu hình database");
    process.exit(1);
  }

  const client = new Client({
    user: PG_USER,
    host: PG_HOST,
    database: PG_DATABASE,
    password: PG_PASSWORD,
    port: parseInt(PG_PORT, 10),
  });

  try {
    await client.connect();
  } catch (err: any) {
    // Nếu database không tồn tại (lỗi 3D000)
    if (err.code === '3D000') {
      console.log(`Database "${PG_DATABASE}" không tồn tại. Coi như không có dữ liệu.`);
      process.exit(0);
    }
    console.error("❌ Lỗi kết nối database:", err.message);
    process.exit(1);
  }

  try {
    const res = await client.query(`
      SELECT COUNT(*) AS count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const count = parseInt(res.rows[0].count, 10);
    if (count > 0) {
      console.log(`Database đã có dữ liệu (${count} bảng). Bỏ qua chạy run-init-db.`);
      process.exit(1);
    } else {
      console.log("Database chưa có bảng nào. Sẽ chạy run-init-db.");
      process.exit(0);
    }
  } catch (err: any) {
    console.error("❌ Lỗi truy vấn database:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkDatabase();
