import { expect } from "chai";
import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import getAll from "@services/access/getAll";
import create from "@services/access/create";

describe("getAll (Access)", () => {
  let client: PoolClient;
  let hrId1: number;
  let hrId2: number;
  let jobId1: number;
  let jobId2: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Mock users
    const userRes1 = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["HR User 1", "hr"]
    );
    hrId1 = userRes1.rows[0].user_id;

    const userRes2 = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["HR User 2", "hr"]
    );
    hrId2 = userRes2.rows[0].user_id;

    // Mock jobs
    const jobRes1 = await client.query(
      `INSERT INTO job (job_code, project) VALUES ($1, $2) RETURNING job_id`,
      ["JOB1", "Project 1"]
    );
    jobId1 = jobRes1.rows[0].job_id;

    const jobRes2 = await client.query(
      `INSERT INTO job (job_code, project) VALUES ($1, $2) RETURNING job_id`,
      ["JOB2", "Project 2"]
    );
    jobId2 = jobRes2.rows[0].job_id;
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should get all access records with filters and pagination", async () => {
    // Create access records
    await create({ user_id: hrId1, job_id: jobId1 }, client);
    await create({ user_id: hrId1, job_id: jobId2 }, client);
    await create({ user_id: hrId2, job_id: jobId1 }, client);

    // Get all (unfiltered)
    const all = await getAll({ page: 1, limit: 10 }, client);
    expect(all.total).to.equal(3);
    expect(all.items).to.have.lengthOf(3);

    // Get filtered by user_id
    const filteredUser = await getAll({ page: 1, limit: 10, user_id: hrId1 }, client);
    expect(filteredUser.total).to.equal(2);
    expect(filteredUser.items.every(x => x.user_id === hrId1)).to.be.true;

    // Get filtered by job_id
    const filteredJob = await getAll({ page: 1, limit: 10, job_id: jobId1 }, client);
    expect(filteredJob.total).to.equal(2);
    expect(filteredJob.items.every(x => x.job_id === jobId1)).to.be.true;

    // Get filtered by user_id and job_id
    const filteredBoth = await getAll({ page: 1, limit: 10, user_id: hrId2, job_id: jobId1 }, client);
    expect(filteredBoth.total).to.equal(1);
    expect(filteredBoth.items[0].user_id).to.equal(hrId2);
    expect(filteredBoth.items[0].job_id).to.equal(jobId1);
  });
});
