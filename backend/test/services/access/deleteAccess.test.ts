import { expect } from "chai";
import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import deleteAccess from "@services/access/deleteAccess";
import create from "@services/access/create";
import findById from "@services/access/findById";

describe("deleteAccess (Access)", () => {
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
      ["JOB_TEST_DELETE", "Test Delete Project"]
    );
    jobId = jobRes.rows[0].job_id;
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should delete access record successfully", async () => {
    const access = await create({ user_id: hrId, job_id: jobId }, client);
    await deleteAccess(access.access_id, client);

    // Verify it is gone
    try {
      await findById(access.access_id, client);
      expect.fail("Should have thrown 404");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(404);
    }
  });

  it("should throw AppError 404 when access record to delete does not exist", async () => {
    try {
      await deleteAccess(99999, client);
      expect.fail("Should have thrown error");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(404);
    }
  });
});
