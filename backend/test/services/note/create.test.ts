import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import create from "@services/note/create";

describe("Note create service", () => {
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

  async function seedUser() {
    const result = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Note Owner", "hr"]
    );
    return result.rows[0].user_id as number;
  }

  async function seedCandidate() {
    const result = await client.query(
      `INSERT INTO candidate (candidate_name, status) VALUES ($1, $2) RETURNING candidate_id`,
      ["Note Candidate", "Searching"]
    );
    return result.rows[0].candidate_id as number;
  }

  it("should create a note and link it to a candidate", async () => {
    const userId = await seedUser();
    const candidateId = await seedCandidate();

    const result = await create({
      user_id: userId,
      message: "Candidate is strong for backend role",
      candidate_id: candidateId
    }, client);

    expect(result.note_id).to.be.a("number");
    expect(result.user_id).to.equal(userId);
    expect(result.message).to.equal("Candidate is strong for backend role");
    expect(result.user!.user_id).to.equal(userId);

    const linkResult = await client.query(
      `SELECT candidate_id, note_id FROM candidate_note WHERE candidate_id = $1 AND note_id = $2`,
      [candidateId, result.note_id]
    );
    expect(linkResult.rows).to.have.lengthOf(1);
  });

  it("should throw AppError 400 when note has no target", async () => {
    const userId = await seedUser();

    try {
      await create({ user_id: userId, message: "No target" }, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(400);
    }
  });
});