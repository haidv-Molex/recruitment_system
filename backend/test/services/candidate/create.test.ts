import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { create } from "@services/candidate/create";

describe("Candidate create service", () => {
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

  it("should successfully create candidate with all fields and relations populated", async () => {
    // 1. Seed platform
    const platformRes = await client.query(
      `INSERT INTO platform (platform_name, platform_description) VALUES ($1, $2) RETURNING platform_id`,
      ["LinkedIn", "Professional Network"]
    );
    const platformId = platformRes.rows[0].platform_id;

    // 2. Seed recruiter (user)
    const recruiterRes = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_role) VALUES ($1, $2, $3) RETURNING user_id`,
      ["Recruiter User", "recruiter@example.com", "hr"]
    );
    const recruiterId = recruiterRes.rows[0].user_id;

    // 3. Seed job
    const jobRes = await client.query(
      `INSERT INTO job (job_code, project) VALUES ($1, $2) RETURNING job_id`,
      ["J_CREATE_UNIQUE", "Project X"]
    );
    const jobId = jobRes.rows[0].job_id;

    // 4. Seed targeted company (company)
    const companyRes = await client.query(
      `INSERT INTO company (company_name, company_description) VALUES ($1, $2) RETURNING company_id`,
      ["Target Company", "A great company"]
    );
    const companyId = companyRes.rows[0].company_id;

    // 5. Seed reference (user)
    const referenceRes = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_role) VALUES ($1, $2, $3) RETURNING user_id`,
      ["Referrer User", "referrer@example.com", "user"]
    );
    const referenceId = referenceRes.rows[0].user_id;

    // 5.5 Seed levels
    const levelRes1 = await client.query(
      `INSERT INTO level (level_name, level_code) VALUES ($1, $2) RETURNING level_id`,
      ["Senior", "SEN"]
    );
    const levelId1 = levelRes1.rows[0].level_id;

    const levelRes2 = await client.query(
      `INSERT INTO level (level_name, level_code) VALUES ($1, $2) RETURNING level_id`,
      ["Engineer", "ENG"]
    );
    const levelId2 = levelRes2.rows[0].level_id;

    // 6. Call create service with all fields populated
    const offerDate = new Date("2026-06-01T00:00:00.000Z");
    const onboardDate = new Date("2026-06-10T00:00:00.000Z");
    const expectedOnboardDate = new Date("2026-06-15T00:00:00.000Z");
    const feedbackDate = new Date("2026-05-28T00:00:00.000Z");

    const candidateData = {
      candidate_code: "V14073",
      candidate_name: "Hải",
      candidate_email: "haidv28062004@gmail.com",
      candidate_phone: "0868177137",
      agency: "AsiaHr",
      offer_date: offerDate,
      onboard_date: onboardDate,
      expected_onboard_date: expectedOnboardDate,
      feedback_date: feedbackDate,
      current_salary: "1500 USD",
      expected_salary: "2000 USD",
      status: "OFFERED",
      note: "Strong backend developer, good communication",
      platform_id: platformId,
      creator_id: recruiterId,
      job_id: jobId,
      targeted_company: companyId,
      reference: referenceId,
      candidate_levels: [levelId1, levelId2]
    };

    const result = await create(candidateData, client);

    expect(result).to.not.be.null;
    expect(result.candidate_id).to.be.a("number");
    expect(result.candidate_code).to.equal("V14073");
    expect(result.candidate_name).to.equal("Hải");
    expect(result.candidate_email).to.equal("haidv28062004@gmail.com");
    expect(result.candidate_phone).to.equal("0868177137");
    expect(result.agency).to.equal("AsiaHr");
    
    const assertDateEquals = (d1: any, d2: any) => {
      const date1 = new Date(d1);
      const date2 = new Date(d2);
      expect(date1.getFullYear()).to.equal(date2.getFullYear());
      expect(date1.getMonth()).to.equal(date2.getMonth());
      expect(date1.getDate()).to.equal(date2.getDate());
    };

    assertDateEquals(result.offer_date, offerDate);
    assertDateEquals(result.onboard_date, onboardDate);
    assertDateEquals(result.expected_onboard_date, expectedOnboardDate);
    assertDateEquals(result.feedback_date, feedbackDate);

    expect(result.current_salary).to.equal("1500 USD");
    expect(result.expected_salary).to.equal("2000 USD");
    expect(result.status).to.equal("OFFERED");

    expect(result.note).to.be.an("array").with.lengthOf(1);
    expect(result.note[0].text).to.equal("Strong backend developer, good communication");
    expect(result.note[0].user.user_id).to.equal(recruiterId);

    // populated relations
    expect(result.platform).to.not.be.null;
    expect(result.platform.platform_id).to.equal(platformId);
    expect(result.platform.platform_name).to.equal("LinkedIn");

    expect(result.job).to.not.be.null;
    expect(result.job.job_id).to.equal(jobId);

    expect(result.targeted_company).to.not.be.null;
    expect(result.targeted_company.company_id).to.equal(companyId);

    expect(result.reference).to.not.be.null;
    expect(result.reference.user_id).to.equal(referenceId);

    expect(result.candidate_levels).to.be.an("array").with.lengthOf(2);
    const levelIds = result.candidate_levels.map((cl: any) => cl.level_id);
    expect(levelIds).to.include(levelId1);
    expect(levelIds).to.include(levelId2);
  });

  it("should successfully create candidate with onboard_date as null", async () => {
    const candidateData = {
      candidate_name: "Jane Doe",
      candidate_email: "jane.doe@example.com",
      status: "Applied",
      onboard_date: null
    };

    const result = await create(candidateData, client);

    expect(result).to.not.be.null;
    expect(result.candidate_name).to.equal("Jane Doe");
    expect(result.onboard_date).to.be.null;
  });

  it("should successfully create candidate with candidate_name as null", async () => {
    const candidateData = {
      candidate_email: "nullname@example.com",
      status: "Applied",
      candidate_name: null
    };

    const result = await create(candidateData, client);

    expect(result).to.not.be.null;
    expect(result.candidate_name).to.be.null;
    expect(result.candidate_email).to.equal("nullname@example.com");
  });
});
