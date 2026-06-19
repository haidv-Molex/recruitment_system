import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import resolveAndCreateEntities from "@utilities/entity/resolveAndCreateEntities";

describe("resolveAndCreateEntities", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query(`CREATE TEMP TABLE test_entity_lookup (entity_id SERIAL PRIMARY KEY, entity_name VARCHAR(255) NOT NULL)`);
    await client.query(`INSERT INTO test_entity_lookup (entity_name) VALUES ($1)`, ["Existing Name"]);
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should resolve existing entities case-insensitively and create missing entities once", async () => {
    const createdNames: string[] = [];
    const map = await resolveAndCreateEntities({
      names: new Set(["existing name", "New Name", "new name"]),
      tableName: "test_entity_lookup",
      idColumn: "entity_id",
      nameColumn: "entity_name",
      pool: client,
      create: async (name) => {
        createdNames.push(name);
        const result = await client.query(
          `INSERT INTO test_entity_lookup (entity_name) VALUES ($1) RETURNING entity_id`,
          [name]
        );
        return result.rows[0].entity_id;
      }
    });

    expect(map.get("existing name")).to.be.a("number");
    expect(map.get("new name")).to.be.a("number");
    expect(createdNames).to.deep.equal(["New Name"]);
  });

  it("should return an empty map when names are empty", async () => {
    const map = await resolveAndCreateEntities({
      names: new Set(["", "  "]),
      tableName: "test_entity_lookup",
      idColumn: "entity_id",
      nameColumn: "entity_name",
      pool: client,
      create: async () => 0
    });

    expect(map.size).to.equal(0);
  });
});