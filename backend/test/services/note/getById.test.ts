import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import getById from "@services/note/getById";

describe("Note getById service", () => {
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

  it("should return note with safe user data", async () => {
    const userResult = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_password, user_role) VALUES ($1, $2, $3, $4) RETURNING user_id`,
      ["Note Reader", "reader@example.com", "secret", "hr"]
    );
    const noteResult = await client.query(
      `INSERT INTO note (user_id, message) VALUES ($1, $2) RETURNING note_id`,
      [userResult.rows[0].user_id, "Readable note"]
    );

    const result = await getById(noteResult.rows[0].note_id, client);

    expect(result.message).to.equal("Readable note");
    expect(result.user!).to.not.have.property("user_password");
    expect(result.user!).to.not.have.property("user_account");
  });

  it("should throw AppError 404 when note does not exist", async () => {
    try {
      await getById(999999, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(404);
    }
  });
});