import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import getAll from "@services/job/getAll";

describe("getAll (Job)", () => {
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
      `INSERT INTO job (job_code, project, note) VALUES ($1, $2, $3)`,
      ["JOB_GET_ALL_TARGET", "JobGetAll_Target", "target note"]
    );

    const result = await getAll({ page: 1, limit: 10, search: "JobGetAll_Target" }, client);

    expect(result.total).to.equal(1);
    expect(result.items).to.have.lengthOf(1);
    expect(result.items[0].project).to.equal("JobGetAll_Target");
  });

  it("should paginate matching rows", async () => {
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO job (job_code, project) VALUES ($1, $2)`,
        [`JOB_PAGE_${i}`, `JobGetAll_Page_${i}`]
      );
    }

    const result = await getAll({ page: 1, limit: 2, search: "JobGetAll_Page_" }, client);

    expect(result.total).to.equal(3);
    expect(result.items).to.have.lengthOf(2);
  });

  it("should return all matching rows when unlimited is true", async () => {
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO job (job_code, project) VALUES ($1, $2)`,
        [`JOB_UNLIMITED_${i}`, `JobGetAll_Unlimited_${i}`]
      );
    }

    const result = await getAll({ page: 1, limit: 1, unlimited: true, search: "JobGetAll_Unlimited_" }, client);

    expect(result.total).to.equal(3);
    expect(result.items).to.have.lengthOf(3);
  });
});