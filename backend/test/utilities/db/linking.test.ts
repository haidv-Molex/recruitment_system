import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { insertLinkRows, replaceLinkRows } from "@utilities/db/linking";

describe("linking utilities", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query(`
      CREATE TEMP TABLE test_link_rows (
        parent_id INT NOT NULL,
        child_id INT NOT NULL,
        required_count INT,
        PRIMARY KEY (parent_id, child_id)
      )
    `);
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should insert multiple link rows", async () => {
    await insertLinkRows(client, "test_link_rows", [
      { parent_id: 1, child_id: 10, required_count: 2 },
      { parent_id: 1, child_id: 20, required_count: 3 }
    ]);

    const result = await client.query(`SELECT * FROM test_link_rows ORDER BY child_id ASC`);

    expect(result.rows).to.deep.include({ parent_id: 1, child_id: 10, required_count: 2 });
    expect(result.rows).to.deep.include({ parent_id: 1, child_id: 20, required_count: 3 });
  });

  it("should do nothing when inserting an empty row list", async () => {
    await insertLinkRows(client, "test_link_rows", []);

    const result = await client.query(`SELECT * FROM test_link_rows`);
    expect(result.rows).to.have.lengthOf(0);
  });

  it("should replace rows for one parent only", async () => {
    await insertLinkRows(client, "test_link_rows", [
      { parent_id: 1, child_id: 10, required_count: 2 },
      { parent_id: 2, child_id: 20, required_count: 3 }
    ]);

    await replaceLinkRows(client, "test_link_rows", "parent_id", 1, [
      { parent_id: 1, child_id: 30, required_count: 4 }
    ]);

    const result = await client.query(`SELECT * FROM test_link_rows ORDER BY parent_id ASC, child_id ASC`);

    expect(result.rows).to.deep.equal([
      { parent_id: 1, child_id: 30, required_count: 4 },
      { parent_id: 2, child_id: 20, required_count: 3 }
    ]);
  });

  it("should delete existing rows when replacing with an empty row list", async () => {
    await insertLinkRows(client, "test_link_rows", [
      { parent_id: 1, child_id: 10, required_count: 2 }
    ]);

    await replaceLinkRows(client, "test_link_rows", "parent_id", 1, []);

    const result = await client.query(`SELECT * FROM test_link_rows`);
    expect(result.rows).to.have.lengthOf(0);
  });

  it("should reject invalid identifiers", async () => {
    try {
      await insertLinkRows(client, "test_link_rows; DROP TABLE test_link_rows;", [
        { parent_id: 1, child_id: 10 }
      ]);
      expect.fail("Expected invalid identifier to throw");
    } catch (error: any) {
      expect(error.message).to.contain("Invalid SQL identifier");
    }
  });
});