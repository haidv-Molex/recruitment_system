import { expect } from "chai";
import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import create from "@services/access/create";

describe("create (Access)", () => {
  let client: PoolClient;
  let adminId: number;
  let hrId1: number;
  let jobId: number;
  let candidateId: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Insert mock user (admin)
    const adminRes = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Test Admin", "admin"]
    );
    adminId = adminRes.rows[0].user_id;

    // Insert mock user (hr)
    const hrRes = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Test HR 1", "hr"]
    );
    hrId1 = hrRes.rows[0].user_id;

    // Insert mock job
    const jobRes = await client.query(
      `INSERT INTO job (job_code, project) VALUES ($1, $2) RETURNING job_id`,
      ["JOB_TEST", "Test Project"]
    );
    jobId = jobRes.rows[0].job_id;

    // Insert mock candidate
    const candidateRes = await client.query(
      `INSERT INTO candidate (candidate_name, status, job_id) VALUES ($1, $2, $3) RETURNING candidate_id`,
      ["Test Candidate", "Searching", jobId]
    );
    candidateId = candidateRes.rows[0].candidate_id;
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should create access permission for a job successfully", async () => {
    const result = await create({ user_id: hrId1, job_id: jobId }, client);
    expect(result).to.have.property("access_id").that.is.a("number");
    expect(result.user_id).to.equal(hrId1);
    expect(result.job_id).to.equal(jobId);
    expect(result.candidate_id).to.be.null;
  });

  it("should create access permission for a candidate successfully", async () => {
    const result = await create({ user_id: hrId1, candidate_id: candidateId }, client);
    expect(result).to.have.property("access_id").that.is.a("number");
    expect(result.user_id).to.equal(hrId1);
    expect(result.candidate_id).to.equal(candidateId);
    expect(result.job_id).to.be.null;
  });

  it("should throw AppError 400 when both candidate_id and job_id are provided", async () => {
    try {
      await create({ user_id: hrId1, candidate_id: candidateId, job_id: jobId }, client);
      expect.fail("Should have thrown error");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(400);
      expect((err as AppError).message).to.contain("Phải cung cấp chính xác candidate_id hoặc job_id");
    }
  });

  it("should throw AppError 400 when neither candidate_id nor job_id is provided", async () => {
    try {
      await create({ user_id: hrId1 }, client);
      expect.fail("Should have thrown error");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(400);
    }
  });

  it("should throw AppError 404 when user_id does not exist", async () => {
    try {
      await create({ user_id: 99999, job_id: jobId }, client);
      expect.fail("Should have thrown error");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(404);
      expect((err as AppError).message).to.contain("Người dùng không tồn tại");
    }
  });

  it("should throw AppError 400 when access permission already exists (duplicate check)", async () => {
    // Create first time
    await create({ user_id: hrId1, job_id: jobId }, client);

    // Create duplicate
    try {
      await create({ user_id: hrId1, job_id: jobId }, client);
      expect.fail("Should have thrown error");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(400);
      expect((err as AppError).message).to.contain("Thông tin phân quyền đã tồn tại");
    }
  });
});
