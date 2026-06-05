import pg from "pg";
import "dotenv/config";

const { PG_USER, PG_HOST, PG_DATABASE, PG_PASSWORD, PG_PORT } = process.env;

if (!PG_USER || !PG_HOST || !PG_DATABASE || !PG_PASSWORD || !PG_PORT) {
  throw new Error("Thiếu biến môi trường cấu hình database");
}

const db = new pg.Client({
  user: PG_USER,
  host: PG_HOST,
  database: PG_DATABASE,
  password: PG_PASSWORD,
  port: parseInt(PG_PORT, 10),
});

db.connect().catch((err) => {
  console.error("Lỗi kết nối database:", err);
  process.exit(1);
});

const pool = new pg.Pool({
  user: PG_USER,
  host: PG_HOST,
  database: PG_DATABASE,
  password: PG_PASSWORD,
  port: parseInt(PG_PORT, 10),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Lỗi kết nối database trong pool:", err);
});

export default db
export { pool }