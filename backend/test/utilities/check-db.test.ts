import "dotenv/config";
import { Client } from "pg";
import { exec } from "child_process";
import * as path from "path";

const dbConfig = {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT || "5432", 10),
};

describe("check-db script", () => {
  let expect: any;
  const tempDbName = "check_db_test_temp_db";

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expect = localExpect;
  });

  // Helper to run the script with overridden environment variables
  function runCheckDb(envOverrides: Record<string, string>): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const scriptPath = path.resolve(__dirname, "../../utilities/check-db.ts");
      const childEnv = { ...process.env, ...envOverrides };
      exec(`npx ts-node "${scriptPath}"`, { env: childEnv }, (error, stdout, stderr) => {
        const code = error ? (error.code || 1) : 0;
        resolve({ code, stdout, stderr });
      });
    });
  }

  it("should exit 0 when database does not exist", async () => {
    const result = await runCheckDb({ PG_DATABASE: "non_existent_db_abc123" });
    expect(result.code).to.equal(0);
    expect(result.stdout).to.include("không tồn tại");
  });

  it("should exit 0 when database exists but has no tables", async () => {
    // 1. Create a temporary database
    const adminClient = new Client({ ...dbConfig, database: "postgres" });
    await adminClient.connect();
    try {
      await adminClient.query(`CREATE DATABASE "${tempDbName}"`);
    } catch (err) {
      console.error("Failed to create temp db:", err);
      throw err;
    } finally {
      await adminClient.end();
    }

    try {
      // 2. Run the check-db script against the empty database
      const result = await runCheckDb({ PG_DATABASE: tempDbName });
      expect(result.code).to.equal(0);
      expect(result.stdout).to.include("chưa có bảng nào");

      // 3. Create a table in the temporary database
      const tempClient = new Client({ ...dbConfig, database: tempDbName });
      await tempClient.connect();
      try {
        await tempClient.query("CREATE TABLE test_table (id serial PRIMARY KEY)");
      } finally {
        await tempClient.end();
      }

      // 4. Run the check-db script again (should exit 1 as tables now exist)
      const result2 = await runCheckDb({ PG_DATABASE: tempDbName });
      expect(result2.code).to.equal(1);
      expect(result2.stdout).to.include("đã có dữ liệu");
    } finally {
      // Cleanup: drop the temporary database
      const cleanupClient = new Client({ ...dbConfig, database: "postgres" });
      await cleanupClient.connect();
      try {
        // Disconnect any active connections first, just in case
        await cleanupClient.query(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = $1
            AND pid <> pg_backend_pid()
        `, [tempDbName]);
        await cleanupClient.query(`DROP DATABASE IF EXISTS "${tempDbName}"`);
      } finally {
        await cleanupClient.end();
      }
    }
  });
});
