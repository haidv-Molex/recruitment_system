import sinon from "sinon";
import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { getAgencies } from "@services/candidate/getAgencies";

describe("getAgencies", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expect = localExpect;
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
    sinon.restore();
  });

  it("should always include all DEFAULT_AGENCIES even when DB is empty", async () => {
    // candidate table sạch trong transaction này — không có row nào
    const result = await getAgencies(client);

    const defaults = [
      '40Hrs', 'Adecco', 'AsiaHr', 'Career Viet', 'EV search',
      'Job C', 'Manpower', 'Navigos', 'Persol', 'Prosworks', 'Talentrader',
    ];
    for (const agency of defaults) {
      expect(result).to.include(agency);
    }
  });

  it("should include extra agency values from DB that are not in defaults", async () => {
    // Insert candidate với agency ngoài HeadhuntAgency type
    await client.query(
      `INSERT INTO candidate (candidate_name, candidate_email, status, agency) VALUES ($1, $2, $3, $4)`,
      ["Test Candidate", "test1@example.com", "Searching", "SomeNewAgency"]
    );

    const result = await getAgencies(client);

    expect(result).to.include("SomeNewAgency");
  });

  it("should not have duplicate values", async () => {
    // Insert agency trùng với default
    await client.query(
      `INSERT INTO candidate (candidate_name, candidate_email, status, agency) VALUES ($1, $2, $3, $4)`,
      ["Test Candidate 2", "test2@example.com", "Searching", "Navigos"]
    );

    const result = await getAgencies(client);
    const uniqueCount = new Set(result).size;

    expect(result.length).to.equal(uniqueCount);
  });

  it("should return results sorted A-Z", async () => {
    const result = await getAgencies(client);
    const sorted = [...result].sort((a, b) => a.localeCompare(b));

    expect(result).to.deep.equal(sorted);
  });

  it("should return an array of strings", async () => {
    const result = await getAgencies(client);

    expect(result).to.be.an("array");
    result.forEach((item) => expect(item).to.be.a("string"));
  });
});
