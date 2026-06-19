import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import deleteNote from "@services/note/delete";
import { AppError } from "@middlewares/AppError";

describe("Note delete service", () => {
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

  it("should successfully delete a note", async () => {
    const candidateRes = await client.query(
      `INSERT INTO candidate (candidate_name, status) VALUES ($1, $2) RETURNING candidate_id`,
      ["Test Candidate", "Applied"]
    );
    const candidateId = candidateRes.rows[0].candidate_id;

    const noteRes = await client.query(
      `INSERT INTO note (user_id, text, candidate_id) VALUES ($1, $2, $3) RETURNING note_id`,
      [adminId, "Some text", candidateId]
    );
    const noteId = noteRes.rows[0].note_id;

    await deleteNote(noteId, adminId, client);

    const check = await client.query("SELECT note_id FROM note WHERE note_id = $1", [noteId]);
    expect(check.rows.length).to.equal(0);
  });

  it("should throw AppError 403 if user is not owner", async () => {
    const candidateRes = await client.query(
      `INSERT INTO candidate (candidate_name, status) VALUES ($1, $2) RETURNING candidate_id`,
      ["Test Candidate", "Applied"]
    );
    const candidateId = candidateRes.rows[0].candidate_id;

    const noteRes = await client.query(
      `INSERT INTO note (user_id, text, candidate_id) VALUES ($1, $2, $3) RETURNING note_id`,
      [adminId, "Some text", candidateId]
    );
    const noteId = noteRes.rows[0].note_id;

    // Try deleting with another user id (e.g. adminId + 1)
    try {
      await deleteNote(noteId, adminId + 1, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(403);
    }
  });

  it("should throw AppError 404 if deleting non-existent note", async () => {
    try {
      await deleteNote(999999, adminId, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(404);
    }
  });
});
