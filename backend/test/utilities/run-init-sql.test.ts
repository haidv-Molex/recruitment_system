import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { executeSqlFiles } from "@utilities/run-init-sql";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { resolve } from "path";

describe("run-init-sql", () => {
  let client: PoolClient;
  let expect: any;
  const testDir = resolve(".test");

  before(async () => {
    // Dynamic import for Chai due to CommonJS/ESM compatibility
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expect = localExpect;
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();

    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should successfully execute SQL files in alphabetical order", async () => {
    const file1 = resolve(testDir, "001-create-temp-table.sql");
    const file2 = resolve(testDir, "002-insert-temp-data.sql");

    writeFileSync(
      file1,
      "CREATE TEMP TABLE test_init_run (id serial primary key, val varchar(50));"
    );
    writeFileSync(
      file2,
      "INSERT INTO test_init_run (val) VALUES ('test_value');"
    );

    await executeSqlFiles(client as any, testDir);

    const queryResult = await client.query("SELECT * FROM test_init_run;");
    expect(queryResult.rows).to.have.lengthOf(1);
    expect(queryResult.rows[0].val).to.equal("test_value");
  });

  it("should throw an error if the directory does not exist", async () => {
    const nonExistentDir = resolve(".test-non-existent");
    try {
      await executeSqlFiles(client as any, nonExistentDir);
      expect.fail("Should have thrown error");
    } catch (err: any) {
      expect(err.message).to.contain("Thư mục SQL không tồn tại");
    }
  });

  it("should do nothing if the directory contains no SQL files", async () => {
    // testDir is empty
    let error: any = null;
    try {
      await executeSqlFiles(client as any, testDir);
    } catch (err) {
      error = err;
    }
    expect(error).to.be.null;
  });
});
