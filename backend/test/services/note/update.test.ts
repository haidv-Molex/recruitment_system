import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import update from "@services/note/update";
import { AppError } from "@middlewares/AppError";

describe("Note update service", () => {
  let client: PoolClient;
  let expect: any;
  let adminId: number;

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expect = localExpect;
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    const userRes = await client.query("SELECT user_id FROM \"user\" LIMIT 1");
    adminId = userRes.rows[0].user_id;
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should successfully update a note if owner", async () => {
    const candidateRes = await client.query(
      `INSERT INTO candidate (candidate_name, status) VALUES ($1, $2) RETURNING candidate_id`,
      ["Test Candidate", "Applied"]
    );
    const candidateId = candidateRes.rows[0].candidate_id;

    const noteRes = await client.query(
      `INSERT INTO note (user_id, text, candidate_id) VALUES ($1, $2, $3) RETURNING note_id`,
      [adminId, "Old text", candidateId]
    );
    const noteId = noteRes.rows[0].note_id;

    const result = await update({
      id: noteId,
      text: "New text",
      userId: adminId,
      userRole: "hr"
    }, client);

    expect(result.note_id).to.equal(noteId);
    expect(result.text).to.equal("New text");
    expect(result.user.user_id).to.equal(adminId);
  });

  it("should successfully update a note if admin but not owner", async () => {
    const candidateRes = await client.query(
      `INSERT INTO candidate (candidate_name, status) VALUES ($1, $2) RETURNING candidate_id`,
      ["Test Candidate", "Applied"]
    );
    const candidateId = candidateRes.rows[0].candidate_id;

    const noteRes = await client.query(
      `INSERT INTO note (user_id, text, candidate_id) VALUES ($1, $2, $3) RETURNING note_id`,
      [adminId, "Old text", candidateId]
    );
    const noteId = noteRes.rows[0].note_id;

    const result = await update({
      id: noteId,
      text: "Admin updated text",
      userId: adminId + 1, // different user ID
      userRole: "admin"
    }, client);

    expect(result.note_id).to.equal(noteId);
    expect(result.text).to.equal("Admin updated text");
    expect(result.user.user_id).to.equal(adminId);
  });

  it("should throw AppError 403 if not owner and not admin", async () => {
    const candidateRes = await client.query(
      `INSERT INTO candidate (candidate_name, status) VALUES ($1, $2) RETURNING candidate_id`,
      ["Test Candidate", "Applied"]
    );
    const candidateId = candidateRes.rows[0].candidate_id;

    const noteRes = await client.query(
      `INSERT INTO note (user_id, text, candidate_id) VALUES ($1, $2, $3) RETURNING note_id`,
      [adminId, "Old text", candidateId]
    );
    const noteId = noteRes.rows[0].note_id;

    try {
      await update({
        id: noteId,
        text: "New text",
        userId: adminId + 1, // different user ID
        userRole: "hr"
      }, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(403);
    }
  });

  it("should throw AppError 404 if note does not exist", async () => {
    try {
      await update({
        id: 999999,
        text: "New text",
        userId: adminId,
        userRole: "hr"
      }, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(404);
    }
  });
});
