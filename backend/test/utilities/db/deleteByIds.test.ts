import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import { pool } from "@middlewares/database";
import deleteByIds from "@utilities/db/deleteByIds";

describe("deleteByIds", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query(`CREATE TEMP TABLE test_delete_by_ids (entity_id SERIAL PRIMARY KEY, entity_name VARCHAR(255))`);
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should delete rows by id array", async () => {
    const first = await client.query(`INSERT INTO test_delete_by_ids (entity_name) VALUES ($1) RETURNING entity_id`, ["A"]);
    const second = await client.query(`INSERT INTO test_delete_by_ids (entity_name) VALUES ($1) RETURNING entity_id`, ["B"]);

    await deleteByIds(client, "test_delete_by_ids", "entity_id", [first.rows[0].entity_id, second.rows[0].entity_id], "not found");

    const result = await client.query(`SELECT * FROM test_delete_by_ids`);
    expect(result.rows).to.have.lengthOf(0);
  });

  it("should do nothing for an empty id array", async () => {
    await deleteByIds(client, "test_delete_by_ids", "entity_id", [], "not found");
    const result = await client.query(`SELECT * FROM test_delete_by_ids`);
    expect(result.rows).to.have.lengthOf(0);
  });

  it("should throw AppError when no rows match", async () => {
    try {
      await deleteByIds(client, "test_delete_by_ids", "entity_id", 999, "not found");
      expect.fail("Expected deleteByIds to throw");
    } catch (error) {
      expect(error).to.be.instanceOf(AppError);
      expect((error as AppError).message).to.equal("not found");
      expect((error as AppError).statusCode).to.equal(404);
    }
  });
});