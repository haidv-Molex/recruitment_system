import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import getAll from "@services/platform/getAll";

describe("getAll (Platform)", () => {
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

  it("should filter by search keyword", async () => {
    await client.query(
      `INSERT INTO platform (platform_name, platform_description) VALUES ($1, $2)`,
      ["PlatformGetAll_Target", "target desc"]
    );

    const result = await getAll({ page: 1, limit: 10, search: "PlatformGetAll_Target" }, client);

    expect(result.total).to.equal(1);
    expect(result.items).to.have.lengthOf(1);
    expect(result.items[0].platform_name).to.equal("PlatformGetAll_Target");
  });

  it("should paginate matching rows", async () => {
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO platform (platform_name) VALUES ($1)`,
        [`PlatformGetAll_Page_${i}`]
      );
    }

    const result = await getAll({ page: 1, limit: 2, search: "PlatformGetAll_Page_" }, client);

    expect(result.total).to.equal(3);
    expect(result.items).to.have.lengthOf(2);
  });

  it("should return all matching rows when unlimited is true", async () => {
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO platform (platform_name) VALUES ($1)`,
        [`PlatformGetAll_Unlimited_${i}`]
      );
    }

    const result = await getAll({ page: 1, limit: 1, unlimited: true, search: "PlatformGetAll_Unlimited_" }, client);

    expect(result.total).to.equal(3);
    expect(result.items).to.have.lengthOf(3);
  });
});