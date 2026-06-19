import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import deleteNote from "@services/note/delete";

describe("Note delete service", () => {
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

  it("should delete notes owned by the current user", async () => {
    const userResult = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Delete Note Owner", "hr"]
    );
    const noteResult = await client.query(
      `INSERT INTO note (user_id, message) VALUES ($1, $2) RETURNING note_id`,
      [userResult.rows[0].user_id, "Delete me"]
    );

    await deleteNote(noteResult.rows[0].note_id, userResult.rows[0].user_id, client);

    const deletedResult = await client.query(
      `SELECT note_id FROM note WHERE note_id = $1`,
      [noteResult.rows[0].note_id]
    );
    expect(deletedResult.rows).to.have.lengthOf(0);
  });

  it("should throw AppError 403 when another user deletes the note", async () => {
    const ownerResult = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Delete Original Owner", "hr"]
    );
    const otherResult = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Delete Other Owner", "hr"]
    );
    const noteResult = await client.query(
      `INSERT INTO note (user_id, message) VALUES ($1, $2) RETURNING note_id`,
      [ownerResult.rows[0].user_id, "Protected delete"]
    );

    try {
      await deleteNote(noteResult.rows[0].note_id, otherResult.rows[0].user_id, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(403);
    }
  });
});