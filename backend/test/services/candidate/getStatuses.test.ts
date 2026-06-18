import sinon from "sinon";
import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { getStatuses } from "@services/candidate/getStatuses";

describe("getStatuses", () => {
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

  it("should always include all DEFAULT_STATUSES even when DB is empty", async () => {
    const result = await getStatuses(client);

    const defaults = [
      'CV Fail', 'CV Sent', 'Hold', 'Interview', 'Interview Fail',
      'No-show', 'Offered', 'Offer Accepted', 'Offer Rejected',
      'Onboarded', 'Searching', 'Withdraw',
    ];
    for (const status of defaults) {
      expect(result).to.include(status);
    }
  });

  it("should include extra status values from DB that are not in defaults", async () => {
    await client.query(
      `INSERT INTO candidate (candidate_name, status) VALUES ($1, $2)`,
      ["Test Candidate", "CustomStatus"]
    );

    const result = await getStatuses(client);

    expect(result).to.include("CustomStatus");
  });

  it("should not have duplicate values", async () => {
    // Insert status trùng với default
    await client.query(
      `INSERT INTO candidate (candidate_name, status) VALUES ($1, $2)`,
      ["Test Candidate 2", "Searching"]
    );

    const result = await getStatuses(client);
    const uniqueCount = new Set(result).size;

    expect(result.length).to.equal(uniqueCount);
  });

  it("should return results sorted A-Z", async () => {
    const result = await getStatuses(client);
    const sorted = [...result].sort((a, b) => a.localeCompare(b));

    expect(result).to.deep.equal(sorted);
  });

  it("should return an array of strings", async () => {
    const result = await getStatuses(client);

    expect(result).to.be.an("array");
    result.forEach((item) => expect(item).to.be.a("string"));
  });
});
