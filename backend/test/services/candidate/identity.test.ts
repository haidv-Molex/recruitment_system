import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import { create } from "@services/candidate/create";
import { batchImport } from "@services/candidate/batchImport";

describe("Candidate identity behavior", () => {
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

  async function getNextCandidateCode() {
    const result = await client.query(`
      SELECT COALESCE(MAX(SUBSTRING(candidate_code FROM 2)::INT), 0) + 1 AS next_number
      FROM candidate
      WHERE candidate_code ~* '^V[0-9]+$'
    `);
    const nextNumber = Number(result.rows[0]?.next_number || 1);

    return `V${String(nextNumber).padStart(5, "0")}`;
  }

  it("should auto-generate candidate_code with V00001 format", async () => {
    const expectedCode = await getNextCandidateCode();

    const result = await create({
      candidate_name: "Auto Code Candidate",
      status: "Applied",
    }, client);

    expect(result.candidate_code).to.equal(expectedCode);
    expect(result.candidate_code).to.match(/^V\d{5,}$/);
  });

  it("should reject duplicate candidate_email case-insensitively", async () => {
    const seedCode = await getNextCandidateCode();
    await client.query(
      `INSERT INTO candidate (candidate_code, candidate_name, candidate_email, status)
       VALUES ($1, $2, $3, $4)`,
      [seedCode, "Existing Email Candidate", "Existing.Email@Example.com", "Applied"]
    );

    let error: any;
    try {
      await create({
        candidate_code: await getNextCandidateCode(),
        candidate_name: "Duplicate Email Candidate",
        candidate_email: " existing.email@example.com ",
        status: "Applied",
      }, client);
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(AppError);
    expect(error.message).to.equal("Email ứng viên đã tồn tại");
    expect(error.statusCode).to.equal(409);
  });

  it("should batch import update by email and prioritize imported candidate_code", async () => {
    const originalCode = await getNextCandidateCode();
    const seedResult = await client.query(
      `INSERT INTO candidate (candidate_code, candidate_name, candidate_email, status)
       VALUES ($1, $2, $3, $4)
       RETURNING candidate_id`,
      [originalCode, "Original Batch Candidate", "Batch.Upsert@Example.com", "Applied"]
    );
    const candidateId = seedResult.rows[0].candidate_id;

    const updateWithoutCode = await batchImport([
      {
        candidate_name: "Updated Batch Candidate",
        candidate_email: " batch.upsert@example.com ",
        status: "Interviewing",
      }
    ], client);

    expect(updateWithoutCode.success).to.be.true;
    expect(updateWithoutCode.importedCount).to.equal(1);

    const preservedCodeResult = await client.query(
      `SELECT candidate_id, candidate_code, candidate_name, status
       FROM candidate
       WHERE LOWER(TRIM(candidate_email)) = $1`,
      ["batch.upsert@example.com"]
    );

    expect(preservedCodeResult.rows).to.have.lengthOf(1);
    expect(preservedCodeResult.rows[0]).to.include({
      candidate_id: candidateId,
      candidate_code: originalCode,
      candidate_name: "Updated Batch Candidate",
      status: "Interviewing",
    });

    const importedCode = await getNextCandidateCode();
    const updateWithCode = await batchImport([
      {
        candidate_code: importedCode,
        candidate_name: "Updated Batch Candidate With Code",
        candidate_email: "batch.upsert@example.com",
        status: "CV Sent",
      }
    ], client);

    expect(updateWithCode.success).to.be.true;
    expect(updateWithCode.importedCount).to.equal(1);

    const prioritizedCodeResult = await client.query(
      `SELECT candidate_id, candidate_code, candidate_name, status
       FROM candidate
       WHERE LOWER(TRIM(candidate_email)) = $1`,
      ["batch.upsert@example.com"]
    );

    expect(prioritizedCodeResult.rows).to.have.lengthOf(1);
    expect(prioritizedCodeResult.rows[0]).to.include({
      candidate_id: candidateId,
      candidate_code: importedCode,
      candidate_name: "Updated Batch Candidate With Code",
      status: "CV Sent",
    });
  });
});