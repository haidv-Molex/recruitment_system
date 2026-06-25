import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { deleteCandidate } from "@services/candidate/delete";
import { AppError } from "@middlewares/AppError";

describe("deleteCandidate service", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
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

  async function seedCandidate(name: string): Promise<number> {
    const res = await client.query<{ candidate_id: number }>(
      `INSERT INTO candidate (candidate_name, candidate_email, status) VALUES ($1, $2, 'Applied') RETURNING candidate_id`,
      [name, `${name}@example.com`]
    );
    return res.rows[0].candidate_id;
  }

  it("should delete a single candidate by id", async () => {
    const id = await seedCandidate("Delete_Single_" + Date.now());

    await deleteCandidate(id, client);

    const check = await client.query("SELECT candidate_id FROM candidate WHERE candidate_id = $1", [id]);
    expect(check.rows.length).to.equal(0);
  });

  it("should delete multiple candidates by ids array", async () => {
    const ts = Date.now();
    const id1 = await seedCandidate("Delete_Bulk_1_" + ts);
    const id2 = await seedCandidate("Delete_Bulk_2_" + ts);

    await deleteCandidate([id1, id2], client);

    const check = await client.query(
      "SELECT candidate_id FROM candidate WHERE candidate_id = ANY($1)",
      [[id1, id2]]
    );
    expect(check.rows.length).to.equal(0);
  });

  it("should throw AppError 404 when no candidates found for the given ids", async () => {
    try {
      await deleteCandidate([999999999], client);
      expect.fail("Should have thrown AppError 404");
    } catch (err: any) {
      expect(err).to.be.instanceOf(AppError);
      expect(err.statusCode).to.equal(404);
      expect(err.message).to.include("Không tìm thấy");
    }
  });

  it("should return early without error when given an empty array", async () => {
    // Should not throw
    await deleteCandidate([], client);
  });
});
