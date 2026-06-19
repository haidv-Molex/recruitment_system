import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import getAll from "@services/note/getAll";

describe("Note getAll service", () => {
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

  it("should filter notes by candidate_id and search text", async () => {
    const userResult = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Search Note Owner", "hr"]
    );
    const candidateResult = await client.query(
      `INSERT INTO candidate (candidate_name, status) VALUES ($1, $2) RETURNING candidate_id`,
      ["Search Candidate", "Searching"]
    );
    const noteResult = await client.query(
      `INSERT INTO note (user_id, message) VALUES ($1, $2) RETURNING note_id`,
      [userResult.rows[0].user_id, "Unique search phrase"]
    );
    await client.query(
      `INSERT INTO candidate_note (candidate_id, note_id) VALUES ($1, $2)`,
      [candidateResult.rows[0].candidate_id, noteResult.rows[0].note_id]
    );

    const result = await getAll({
      page: 1,
      limit: 10,
      candidate_id: candidateResult.rows[0].candidate_id,
      search: "unique search"
    }, client);

    expect(result.total).to.equal(1);
    expect(result.items).to.have.lengthOf(1);
    expect(result.items[0].message).to.equal("Unique search phrase");
  });
});