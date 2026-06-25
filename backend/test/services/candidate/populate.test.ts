import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { populateCandidateRelations } from "@services/candidate/populate";

describe("Candidate populate service", () => {
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

  it("should successfully populate candidate relations including platform", async () => {
    // 1. Seed a platform
    const platformRes = await client.query(
      `INSERT INTO platform (platform_name, platform_description) VALUES ($1, $2) RETURNING platform_id`,
      ["Test Platform", "Description of test platform"]
    );
    const platformId = platformRes.rows[0].platform_id;

    // 2. Seed a candidate with that platform_id
    const candidateRes = await client.query(
      `INSERT INTO candidate (candidate_name, candidate_email, status, platform_id) VALUES ($1, 'john.doe@example.com', $2, $3) RETURNING *`,
      ["John Doe", "Applied", platformId]
    );
    const candidateRow = candidateRes.rows[0];

    // 3. Call populateCandidateRelations
    const result = await populateCandidateRelations(candidateRow, client);

    expect(result).to.not.be.null;
    expect(result.candidate_name).to.equal("John Doe");
    expect(result.platform).to.not.be.null;
    expect(result.platform.platform_id).to.equal(platformId);
    expect(result.platform.platform_name).to.equal("Test Platform");
    expect(result.platform.platform_description).to.equal("Description of test platform");
    // Verify platform_id is not exposed directly in root properties since populate destructures it out
    expect(result.platform_id).to.be.undefined;
  });

  it("should return null platform if platform_id is null", async () => {
    const candidateRes = await client.query(
      `INSERT INTO candidate (candidate_name, candidate_email, status, platform_id) VALUES ($1, 'john.null@example.com', $2, NULL) RETURNING *`,
      ["John Doe Null Platform", "Applied"]
    );
    const candidateRow = candidateRes.rows[0];

    const result = await populateCandidateRelations(candidateRow, client);

    expect(result).to.not.be.null;
    expect(result.platform).to.be.null;
  });

  it("should successfully populate candidate company relation", async () => {
    // 1. Seed a company
    const companyRes = await client.query(
      `INSERT INTO company (company_name, company_description) VALUES ($1, $2) RETURNING company_id`,
      ["Google", "Search engine company"]
    );
    const companyId = companyRes.rows[0].company_id;

    // 2. Seed a candidate with that targeted_company id
    const candidateRes = await client.query(
      `INSERT INTO candidate (candidate_name, candidate_email, status, targeted_company) VALUES ($1, 'cand.company@example.com', $2, $3) RETURNING *`,
      ["Candidate Company", "Applied", companyId]
    );
    const candidateRow = candidateRes.rows[0];

    // 3. Call populateCandidateRelations
    const result = await populateCandidateRelations(candidateRow, client);

    expect(result).to.not.be.null;
    expect(result.candidate_name).to.equal("Candidate Company");
    expect(result.targeted_company).to.not.be.null;
    expect(result.targeted_company.company_id).to.equal(companyId);
    expect(result.targeted_company.company_name).to.equal("Google");
    expect(result.targeted_company.company_description).to.equal("Search engine company");
  });

  it("should successfully populate candidate levels relation", async () => {
    // 1. Seed level
    const levelRes = await client.query(
      `INSERT INTO level (level_name, level_code) VALUES ($1, $2) RETURNING level_id`,
      ["Lead", "LD"]
    );
    const levelId = levelRes.rows[0].level_id;

    // 2. Seed a candidate
    const candidateRes = await client.query(
      `INSERT INTO candidate (candidate_name, candidate_email, status) VALUES ($1, 'cand.level@example.com', $2) RETURNING *`,
      ["Candidate Level Pop", "Applied"]
    );
    const candidateRow = candidateRes.rows[0];

    // 3. Link candidate to level
    await client.query(
      `INSERT INTO candidate_level (candidate_id, level_id) VALUES ($1, $2)`,
      [candidateRow.candidate_id, levelId]
    );

    // 4. Call populateCandidateRelations
    const result = await populateCandidateRelations(candidateRow, client);

    expect(result).to.not.be.null;
    expect(result.candidate_name).to.equal("Candidate Level Pop");
    expect(result.candidate_levels).to.be.an("array").with.lengthOf(1);
    expect(result.candidate_levels[0].level_id).to.equal(levelId);
    expect(result.candidate_levels[0].level_name).to.equal("Lead");
  });

  it("should successfully populate candidate notes in chronological order", async () => {
    // 1. Seed candidate
    const candidateRes = await client.query(
      `INSERT INTO candidate (candidate_name, candidate_email, status) VALUES ($1, 'cand.notes@example.com', $2) RETURNING *`,
      ["Candidate Notes Pop", "Applied"]
    );
    const candidateRow = candidateRes.rows[0];

    // 2. Seed a user
    const userRes = await client.query("SELECT user_id FROM \"user\" LIMIT 1");
    const adminId = userRes.rows[0].user_id;

    // 3. Seed notes
    await client.query(
      `INSERT INTO note (user_id, text, candidate_id, create_at) VALUES ($1, $2, $3, NOW() - INTERVAL '1 hour')`,
      [adminId, "First candidate note", candidateRow.candidate_id]
    );
    await client.query(
      `INSERT INTO note (user_id, text, candidate_id, create_at) VALUES ($1, $2, $3, NOW())`,
      [adminId, "Second candidate note", candidateRow.candidate_id]
    );

    // 4. Call populateCandidateRelations
    const result = await populateCandidateRelations(candidateRow, client);

    expect(result).to.not.be.null;
    expect(result.note).to.be.an("array").with.lengthOf(2);
    expect(result.note[0].text).to.equal("First candidate note");
    expect(result.note[1].text).to.equal("Second candidate note");
    expect(result.note[0].user.user_id).to.equal(adminId);
  });
});
