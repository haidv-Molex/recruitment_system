import pg from "pg";
import "dotenv/config";
import { readdirSync, readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

/**
 * Executes all SQL files found in the specified directory against the PostgreSQL client.
 * The files are sorted alphabetically.
 */
export async function executeSqlFiles(client: pg.Client, initDir: string): Promise<void> {
  if (!existsSync(initDir)) {
    throw new Error(`Thư mục SQL không tồn tại: ${initDir}`);
  }

  const files = readdirSync(initDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    return;
  }

  for (const file of files) {
    const filePath = join(initDir, file);
    const sql = readFileSync(filePath, "utf8");
    await client.query(sql);
  }
}

async function run() {
  const { PG_USER, PG_HOST, PG_DATABASE, PG_PASSWORD, PG_PORT } = process.env;

  if (!PG_USER || !PG_HOST || !PG_DATABASE || !PG_PASSWORD || !PG_PORT) {
    console.error("❌ Thiếu cấu hình database trong file .env");
    process.exit(1);
  }

  const dbConfig = {
    user: PG_USER,
    host: PG_HOST,
    password: PG_PASSWORD,
    port: parseInt(PG_PORT, 10),
  };

  let client = new pg.Client({ ...dbConfig, database: PG_DATABASE });
  try {
    await client.connect();
  } catch (err: any) {
    // 3D000 is invalid_catalog_name (database does not exist)
    if (err.code === "3D000") {
      console.log(`Database "${PG_DATABASE}" không tồn tại. Đang tiến hành tạo mới...`);
      const defaultClient = new pg.Client({ ...dbConfig, database: "postgres" });
      try {
        await defaultClient.connect();
        const escapedDbName = PG_DATABASE.replace(/"/g, '""');
        await defaultClient.query(`CREATE DATABASE "${escapedDbName}"`);
        console.log(`Đã tạo thành công database "${PG_DATABASE}"!`);
      } catch (createErr: any) {
        console.error("❌ Không thể tạo database:", createErr.message);
        process.exit(1);
      } finally {
        await defaultClient.end();
      }
      
      // Reconnect to the newly created database
      client = new pg.Client({ ...dbConfig, database: PG_DATABASE });
      await client.connect();
    } else {
      console.error("❌ Lỗi kết nối database:", err.message);
      process.exit(1);
    }
  }

  try {
    const initDir = resolve("./init-db");
    console.log(`Đang dọn dẹp database "${PG_DATABASE}" (xóa và tạo lại schema public)...`);
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");

    console.log(`Bắt đầu chạy các file SQL khởi tạo database từ: ${initDir}...\n`);
    
    const files = readdirSync(initDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.warn("⚠️ Không tìm thấy file SQL nào trong thư mục init-db.");
      process.exit(0);
    }

    for (const file of files) {
      console.log(`⏳ Đang chạy: ${file}...`);
      const filePath = join(initDir, file);
      const sql = readFileSync(filePath, "utf8");
      await client.query(sql);
      console.log(`✅ Hoàn thành: ${file}`);
    }

    console.log("\n🎉 Khởi tạo dữ liệu database thành công!");
  } catch (err: any) {
    console.error(`\n❌ Lỗi khi chạy SQL:`, err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run directly if executed via ts-node
if (require.main === module) {
  run();
}
