import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { update } from "@services/candidate/update";

describe("Candidate update service", () => {
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

  it("should successfully update candidate fields and relations", async () => {
    // 1. Seed candidate
    const initialCand = await client.query(
      `INSERT INTO candidate (candidate_name, status) VALUES ($1, $2) RETURNING candidate_id`,
      ["Jane Doe", "Applied"]
    );
    const candidateId = initialCand.rows[0].candidate_id;

    // 2. Seed relations to update to
    const platformRes = await client.query(
      `INSERT INTO platform (platform_name, platform_description) VALUES ($1, $2) RETURNING platform_id`,
      ["Facebook", "Social Media"]
    );
    const platformId = platformRes.rows[0].platform_id;

    const recruiterRes = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_role) VALUES ($1, $2, $3) RETURNING user_id`,
      ["Recruiter User", "recruiter_update@example.com", "hr"]
    );
    const recruiterId = recruiterRes.rows[0].user_id;

    const jobRes = await client.query(
      `INSERT INTO job (job_code, project, candidate_required) VALUES ($1, $2, $3) RETURNING job_id`,
      ["J002", "Project Y", 2]
    );
    const jobId = jobRes.rows[0].job_id;

    const companyRes = await client.query(
      `INSERT INTO company (company_name, company_description) VALUES ($1, $2) RETURNING company_id`,
      ["Target Company Update", "Another great company"]
    );
    const companyId = companyRes.rows[0].company_id;

    const referenceRes = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_role) VALUES ($1, $2, $3) RETURNING user_id`,
      ["Referrer User", "referrer_update@example.com", "user"]
    );
    const referenceId = referenceRes.rows[0].user_id;

    // 3. Call update service
    const offerDate = new Date("2026-06-01T00:00:00.000Z");
    const onboardDate = new Date("2026-06-10T00:00:00.000Z");
    const expectedOnboardDate = new Date("2026-06-15T00:00:00.000Z");
    const feedbackDate = new Date("2026-05-28T00:00:00.000Z");

    const updateData = {
      candidate_code: "V14073",
      candidate_name: "Jane Doe Updated",
      candidate_email: "jane.updated@example.com",
      candidate_phone: "0868177137",
      agency: "AsiaHr",
      offer_date: offerDate,
      onboard_date: onboardDate,
      expected_onboard_date: expectedOnboardDate,
      feedback_date: feedbackDate,
      current_salary: "1500 USD",
      expected_salary: "2000 USD",
      status: "OFFERED",
      note: "Strong backend developer",
      platform_id: platformId,
      recruiter: recruiterId,
      job_id: jobId,
      targeted_company: companyId,
      reference: referenceId
    };

    const result = await update(candidateId, updateData, client);

    expect(result).to.not.be.null;
    expect(result.candidate_id).to.equal(candidateId);
    expect(result.candidate_name).to.equal("Jane Doe Updated");
    expect(result.candidate_email).to.equal("jane.updated@example.com");
    expect(result.onboard_date).to.not.be.null;

    const assertDateEquals = (d1: any, d2: any) => {
      const date1 = new Date(d1);
      const date2 = new Date(d2);
      expect(date1.getFullYear()).to.equal(date2.getFullYear());
      expect(date1.getMonth()).to.equal(date2.getMonth());
      expect(date1.getDate()).to.equal(date2.getDate());
    };

    assertDateEquals(result.onboard_date, onboardDate);
    expect(result.platform).to.not.be.null;
    expect(result.platform.platform_id).to.equal(platformId);
  });

  it("should successfully update candidate fields to null", async () => {
    // 1. Seed candidate with initial values
    const initialCand = await client.query(
      `INSERT INTO candidate (candidate_name, status, onboard_date) VALUES ($1, $2, $3) RETURNING candidate_id`,
      ["Jane Doe", "Applied", new Date()]
    );
    const candidateId = initialCand.rows[0].candidate_id;

    // 2. Call update service to set onboard_date to null
    const updateData = {
      onboard_date: null
    };

    const result = await update(candidateId, updateData, client);

    expect(result).to.not.be.null;
    expect(result.onboard_date).to.be.null;
  });
});
