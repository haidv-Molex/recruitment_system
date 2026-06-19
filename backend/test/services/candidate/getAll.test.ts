import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { getAll } from "@services/candidate/getAll";

describe("Candidate getAll service", () => {
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

  it("should successfully retrieve candidates list and search on all default fields", async () => {
    // 1. Seed dependency data
    const platformRes = await client.query(
      `INSERT INTO platform (platform_name, platform_description) VALUES ($1, $2) RETURNING platform_id`,
      ["UniquePlatformX", "Nền tảng TopCV"]
    );
    const platformId = platformRes.rows[0].platform_id;

    const companyRes = await client.query(
      `INSERT INTO company (company_name, company_description) VALUES ($1, $2) RETURNING company_id`,
      ["UniqueCompanyX", "Company 1"]
    );
    const companyId = companyRes.rows[0].company_id;

    const recruiterRes = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_role) VALUES ($1, $2, $3) RETURNING user_id`,
      ["UniqueRecruiterX", "hr001@example.com", "hr"]
    );
    const recruiterId = recruiterRes.rows[0].user_id;

    const jobRes = await client.query(
      `INSERT INTO job (job_code, project, recruiter_id) VALUES ($1, $2, $3) RETURNING job_id`,
      ["UniqueJobCodeX", "DSS Talent Connector Unique", recruiterId]
    );
    const jobId = jobRes.rows[0].job_id;

    const referenceRes = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_role) VALUES ($1, $2, $3) RETURNING user_id`,
      ["UniqueReferenceX", "doitac001@example.com", "user"]
    );
    const referenceId = referenceRes.rows[0].user_id;

    // 2. Seed candidate
    await client.query(
      `INSERT INTO candidate (
        candidate_code, candidate_name, candidate_email, candidate_phone, agency, status,
        platform_id, job_id, targeted_company, reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        "VUniqueCodeX", "UniqueNameX", "unique.email@example.com", "9999999999", "UniqueAgencyX", "OFFERED",
        platformId, jobId, companyId, referenceId
      ]
    );

    // Test default global search by candidate name
    const searchByName = await getAll({ search: "UniqueNameX" }, client);
    expect(searchByName.items).to.have.lengthOf(1);
    expect(searchByName.items[0].candidate_name).to.equal("UniqueNameX");

    // Test default global search by phone number
    const searchByPhone = await getAll({ search: "9999999999" }, client);
    expect(searchByPhone.items).to.have.lengthOf(1);
    expect(searchByPhone.items[0].candidate_name).to.equal("UniqueNameX");

    // Test default global search by job code
    const searchByJobCode = await getAll({ search: "UniqueJobCodeX" }, client);
    expect(searchByJobCode.items).to.have.lengthOf(1);
    expect(searchByJobCode.items[0].candidate_name).to.equal("UniqueNameX");

    // Test default global search by platform name
    const searchByPlatform = await getAll({ search: "UniquePlatformX" }, client);
    expect(searchByPlatform.items).to.have.lengthOf(1);
    expect(searchByPlatform.items[0].candidate_name).to.equal("UniqueNameX");
  });

  it("should filter search precisely using search_at parameter", async () => {
    // 1. Seed platform
    const platformRes = await client.query(
      `INSERT INTO platform (platform_name, platform_description) VALUES ($1, $2) RETURNING platform_id`,
      ["UniquePlatformY", "Nền tảng TopCV"]
    );
    const platformId = platformRes.rows[0].platform_id;

    // 2. Seed candidates
    await client.query(
      `INSERT INTO candidate (candidate_name, candidate_phone, status, platform_id) VALUES ($1, $2, $3, $4)`,
      ["UniqueNameY1", "8888888888", "OFFERED", platformId]
    );
    await client.query(
      `INSERT INTO candidate (candidate_name, candidate_phone, status, platform_id) VALUES ($1, $2, $3, $4)`,
      ["UniqueNameY2", "7777777777", "OFFERED", platformId]
    );

    // Search for "UniqueNameY1" restricted to only "phone" - should return 0 items
    const searchPhoneOnly = await getAll({ search: "UniqueNameY1", search_at: ["phone"] }, client);
    expect(searchPhoneOnly.items).to.have.lengthOf(0);

    // Search for "UniqueNameY1" restricted to "name" - should return 1 item
    const searchNameOnly = await getAll({ search: "UniqueNameY1", search_at: ["name"] }, client);
    expect(searchNameOnly.items).to.have.lengthOf(1);
    expect(searchNameOnly.items[0].candidate_name).to.equal("UniqueNameY1");

    // Search for "UniquePlatformY" restricted to "platform" - should return 2 items
    const searchPlatformOnly = await getAll({ search: "UniquePlatformY", search_at: ["platform"] }, client);
    expect(searchPlatformOnly.items).to.have.lengthOf(2);
  });

  it("should successfully search by date ranges and salaries", async () => {
    // 1. Seed platform
    const platformRes = await client.query(
      `INSERT INTO platform (platform_name, platform_description) VALUES ($1, $2) RETURNING platform_id`,
      ["UniquePlatformZ", "Nền tảng TopCV"]
    );
    const platformId = platformRes.rows[0].platform_id;

    // 2. Seed candidates with different dates and salaries
    const date1 = new Date("2026-06-01T00:00:00.000Z");
    const date2 = new Date("2026-06-10T00:00:00.000Z");
    const date3 = new Date("2026-06-20T00:00:00.000Z");

    await client.query(
      `INSERT INTO candidate (candidate_name, offer_date, onboard_date, current_salary, expected_salary, status, platform_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ["CandidateZ1", date1, date2, "1000 USD", "1500 USD", "OFFERED", platformId]
    );
    await client.query(
      `INSERT INTO candidate (candidate_name, offer_date, onboard_date, current_salary, expected_salary, status, platform_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ["CandidateZ2", date2, date3, "2000 USD", "2500 USD", "OFFERED", platformId]
    );

    // Filter by offer_date range (2026-06-01 to 2026-06-05) - should only return CandidateZ1
    const searchDateRange = await getAll({
      offer_date_from: date1,
      offer_date_to: new Date("2026-06-05T00:00:00.000Z")
    }, client);
    const names = searchDateRange.items.map(item => item.candidate_name);
    expect(names).to.include("CandidateZ1");
    expect(names).to.not.include("CandidateZ2");

    // Filter by exact offer_date (only offer_date_from set to 2026-06-10) - should only return CandidateZ2
    const searchExactDate = await getAll({
      offer_date_from: date2
    }, client);
    const namesExact = searchExactDate.items.map(item => item.candidate_name);
    expect(namesExact).to.include("CandidateZ2");
    expect(namesExact).to.not.include("CandidateZ1");

    // Search by current_salary via global search
    const searchSalaryGlobal = await getAll({ search: "2000 USD" }, client);
    expect(searchSalaryGlobal.items.map(item => item.candidate_name)).to.include("CandidateZ2");

    // Search by expected_salary via search_at
    const searchSalaryPrecise = await getAll({ search: "1500 USD", search_at: ["expected_salary"] }, client);
    expect(searchSalaryPrecise.items.map(item => item.candidate_name)).to.include("CandidateZ1");
  });

  it("should paginate matching candidates", async () => {
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO candidate (candidate_name, status) VALUES ($1, $2)`,
        [`CandidateGetAll_Page_${i}`, "Searching"]
      );
    }

    const result = await getAll({ page: 1, limit: 2, search: "CandidateGetAll_Page_" }, client);

    expect(result.total).to.equal(3);
    expect(result.items).to.have.lengthOf(2);
  });
});
