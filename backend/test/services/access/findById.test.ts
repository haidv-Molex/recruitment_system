import { expect } from "chai";
import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import findById from "@services/access/findById";
import create from "@services/access/create";

describe("findById (Access)", () => {
  let client: PoolClient;
  let hrId: number;
  let jobId: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Mock user
    const userRes = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Test User", "hr"]
    );
    hrId = userRes.rows[0].user_id;

    // Mock job
    const jobRes = await client.query(
      `INSERT INTO job (job_code, project) VALUES ($1, $2) RETURNING job_id`,
      ["JOB_TEST_FINDBYID", "Test FindById Project"]
    );
    jobId = jobRes.rows[0].job_id;
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should return accessModel when found", async () => {
    const access = await create({ user_id: hrId, job_id: jobId }, client);
    const result = await findById(access.access_id, client);
    expect(result.access_id).to.equal(access.access_id);
    expect(result.user_id).to.equal(hrId);
    expect(result.job_id).to.equal(jobId);
  });

  it("should throw AppError 404 when access_id is not found", async () => {
    try {
      await findById(99999, client);
      expect.fail("Should have thrown error");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(404);
      expect((err as AppError).message).to.contain("Không tìm thấy thông tin phân quyền");
    }
  });
});
