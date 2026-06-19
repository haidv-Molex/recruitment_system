import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import getById from "@services/note/getById";
import { AppError } from "@middlewares/AppError";

describe("Note getById service", () => {
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

  it("should successfully retrieve an existing note", async () => {
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

    const result = await getById(noteId, client);

    expect(result).to.not.be.null;
    expect(result.note_id).to.equal(noteId);
    expect(result.text).to.equal("Some text");
    expect(result.candidate_id).to.equal(candidateId);
    expect(result.user.user_id).to.equal(adminId);
  });

  it("should throw AppError 404 if note does not exist", async () => {
    try {
      await getById(999999, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(404);
    }
  });
});
