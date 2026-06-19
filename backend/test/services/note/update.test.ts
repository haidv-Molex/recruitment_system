import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import update from "@services/note/update";

describe("Note update service", () => {
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

  it("should update note message for the owner", async () => {
    const userResult = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Update Note Owner", "hr"]
    );
    const noteResult = await client.query(
      `INSERT INTO note (user_id, message) VALUES ($1, $2) RETURNING note_id`,
      [userResult.rows[0].user_id, "Old message"]
    );

    const result = await update(noteResult.rows[0].note_id, {
      user_id: userResult.rows[0].user_id,
      message: "New message"
    }, client);

    expect(result.message).to.equal("New message");
  });

  it("should throw AppError 403 when another user updates the note", async () => {
    const ownerResult = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Original Owner", "hr"]
    );
    const otherResult = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Other Owner", "hr"]
    );
    const noteResult = await client.query(
      `INSERT INTO note (user_id, message) VALUES ($1, $2) RETURNING note_id`,
      [ownerResult.rows[0].user_id, "Protected message"]
    );

    try {
      await update(noteResult.rows[0].note_id, {
        user_id: otherResult.rows[0].user_id,
        message: "Attempted update"
      }, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(403);
    }
  });
});