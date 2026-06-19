import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import create from "@services/note/create";

describe("Note create service", () => {
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

  it("should successfully create a note for candidate", async () => {
    const candidateRes = await client.query(
      `INSERT INTO candidate (candidate_name, status) VALUES ($1, $2) RETURNING candidate_id`,
      ["Test Candidate", "Applied"]
    );
    const candidateId = candidateRes.rows[0].candidate_id;

    const result = await create({
      user_id: adminId,
      text: "Suitable for role",
      candidate_id: candidateId
    }, client);

    expect(result).to.not.be.null;
    expect(result.note_id).to.be.a("number");
    expect(result.text).to.equal("Suitable for role");
    expect(result.candidate_id).to.equal(candidateId);
    expect(result.user).to.not.be.null;
    expect(result.user.user_id).to.equal(adminId);
  });
});
