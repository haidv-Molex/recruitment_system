import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import getAll from "@services/level/getAll";

describe("getAll (Level)", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should filter by level name or code", async () => {
    await client.query(
      `INSERT INTO level (level_code, level_name, level_description) VALUES ($1, $2, $3)`,
      ["LV_GET_ALL", "LevelGetAll_Target", "target desc"]
    );

    const byName = await getAll({ page: 1, limit: 10, search: "LevelGetAll_Target" }, client);
    const byCode = await getAll({ page: 1, limit: 10, search: "LV_GET_ALL" }, client);

    expect(byName.total).to.equal(1);
    expect(byCode.total).to.equal(1);
    expect(byName.items[0].level_name).to.equal("LevelGetAll_Target");
  });

  it("should paginate matching rows", async () => {
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO level (level_code, level_name) VALUES ($1, $2)`,
        [`LV_PAGE_${i}`, `LevelGetAll_Page_${i}`]
      );
    }

    const result = await getAll({ page: 1, limit: 2, search: "LevelGetAll_Page_" }, client);

    expect(result.total).to.equal(3);
    expect(result.items).to.have.lengthOf(2);
  });

  it("should return all matching rows when unlimited is true", async () => {
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO level (level_code, level_name) VALUES ($1, $2)`,
        [`LV_UNLIMITED_${i}`, `LevelGetAll_Unlimited_${i}`]
      );
    }

    const result = await getAll({ page: 1, limit: 1, unlimited: true, search: "LevelGetAll_Unlimited_" }, client);

    expect(result.total).to.equal(3);
    expect(result.items).to.have.lengthOf(3);
  });
});