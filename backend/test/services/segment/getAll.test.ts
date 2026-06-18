import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import getAll from "@services/segment/getAll";

describe("getAll (Segment)", () => {
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

  it("should filter by segment name or code", async () => {
    await client.query(
      `INSERT INTO segment (segment_code, segment_name, segment_description) VALUES ($1, $2, $3)`,
      ["SEG_GET_ALL", "SegmentGetAll_Target", "target desc"]
    );

    const byName = await getAll({ page: 1, limit: 10, search: "SegmentGetAll_Target" }, client);
    const byCode = await getAll({ page: 1, limit: 10, search: "SEG_GET_ALL" }, client);

    expect(byName.total).to.equal(1);
    expect(byCode.total).to.equal(1);
    expect(byName.items[0].segment_name).to.equal("SegmentGetAll_Target");
  });

  it("should paginate matching rows", async () => {
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO segment (segment_code, segment_name) VALUES ($1, $2)`,
        [`SEG_PAGE_${i}`, `SegmentGetAll_Page_${i}`]
      );
    }

    const result = await getAll({ page: 1, limit: 2, search: "SegmentGetAll_Page_" }, client);

    expect(result.total).to.equal(3);
    expect(result.items).to.have.lengthOf(2);
  });

  it("should return all matching rows when unlimited is true", async () => {
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO segment (segment_code, segment_name) VALUES ($1, $2)`,
        [`SEG_UNLIMITED_${i}`, `SegmentGetAll_Unlimited_${i}`]
      );
    }

    const result = await getAll({ page: 1, limit: 1, unlimited: true, search: "SegmentGetAll_Unlimited_" }, client);

    expect(result.total).to.equal(3);
    expect(result.items).to.have.lengthOf(3);
  });
});