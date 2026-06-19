import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import getAll from "@services/site/getAll";

describe("getAll (Site)", () => {
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

  it("should filter by site name or code", async () => {
    await client.query(
      `INSERT INTO site (site_code, site_name, site_description) VALUES ($1, $2, $3)`,
      ["SITE_GET_ALL", "SiteGetAll_Target", "target desc"]
    );

    const byName = await getAll({ page: 1, limit: 10, search: "SiteGetAll_Target" }, client);
    const byCode = await getAll({ page: 1, limit: 10, search: "SITE_GET_ALL" }, client);

    expect(byName.total).to.equal(1);
    expect(byCode.total).to.equal(1);
    expect(byName.items[0].site_name).to.equal("SiteGetAll_Target");
  });

  it("should paginate matching rows", async () => {
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO site (site_code, site_name) VALUES ($1, $2)`,
        [`SITE_PAGE_${i}`, `SiteGetAll_Page_${i}`]
      );
    }

    const result = await getAll({ page: 1, limit: 2, search: "SiteGetAll_Page_" }, client);

    expect(result.total).to.equal(3);
    expect(result.items).to.have.lengthOf(2);
  });

  it("should return all matching rows when unlimited is true", async () => {
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO site (site_code, site_name) VALUES ($1, $2)`,
        [`SITE_UNLIMITED_${i}`, `SiteGetAll_Unlimited_${i}`]
      );
    }

    const result = await getAll({ page: 1, limit: 1, unlimited: true, search: "SiteGetAll_Unlimited_" }, client);

    expect(result.total).to.equal(3);
    expect(result.items).to.have.lengthOf(3);
  });
});