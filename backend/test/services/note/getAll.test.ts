import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import getAll from "@services/note/getAll";

describe("Note getAll service", () => {
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

  it("should successfully retrieve notes for candidate in chronological order", async () => {
    const candidateRes = await client.query(
      `INSERT INTO candidate (candidate_name, status) VALUES ($1, $2) RETURNING candidate_id`,
      ["Test Candidate", "Applied"]
    );
    const candidateId = candidateRes.rows[0].candidate_id;

    // First note (created earlier)
    await client.query(
      `INSERT INTO note (user_id, text, candidate_id, create_at) VALUES ($1, $2, $3, NOW() - INTERVAL '1 hour')`,
      [adminId, "First note", candidateId]
    );

    // Second note (created later)
    await client.query(
      `INSERT INTO note (user_id, text, candidate_id, create_at) VALUES ($1, $2, $3, NOW())`,
      [adminId, "Second note", candidateId]
    );

    const result = await getAll({ candidate_id: candidateId }, client);

    expect(result).to.be.an("array").with.lengthOf(2);
    expect(result[0].text).to.equal("First note");
    expect(result[1].text).to.equal("Second note");
  });
});
