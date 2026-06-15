import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { createWithAll } from "@services/candidate/createWithAll";

describe("candidate/createWithAll service", () => {
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

  // ─── Happy path: chỉ truyền các trường bắt buộc ────────────────────────────

  it("should create candidate with only required fields", async () => {
    const result = await createWithAll(
      { candidate_name: "Nguyễn Văn A", status: "CV Sent" },
      client
    );

    expect(result).to.have.property("candidate_id").that.is.a("number");
    expect(result.candidate_name).to.equal("Nguyễn Văn A");
    expect(result.status).to.equal("CV Sent");
    expect(result.recruiter).to.be.null;
    expect(result.platform).to.be.null;
    expect(result.targeted_company).to.be.null;
    expect(result.reference).to.be.null;
  });

  // ─── Auto-create recruiter từ recruiter_name ────────────────────────────────

  it("should auto-create a new user for recruiter_name and link it", async () => {
    const result = await createWithAll(
      {
        candidate_name: "Trần Thị B",
        status: "Interview",
        recruiter_name: "Annie Auto",
      },
      client
    );

    expect(result.candidate_name).to.equal("Trần Thị B");
    expect(result.recruiter).to.not.be.null;
    expect(result.recruiter.user_name).to.equal("Annie Auto");
    expect(result.recruiter.user_id).to.be.a("number");
  });

  // ─── Auto-create platform từ platform_name ──────────────────────────────────

  it("should auto-create a new platform for platform_name and link it", async () => {
    const result = await createWithAll(
      {
        candidate_name: "Lê Văn C",
        status: "Hold",
        platform_name: "TestPlatformXYZ",
      },
      client
    );

    expect(result.platform).to.not.be.null;
    expect(result.platform.platform_name).to.equal("TestPlatformXYZ");
    expect(result.platform.platform_id).to.be.a("number");
  });

  // ─── Auto-create company từ targeted_company_name ──────────────────────────

  it("should auto-create a new company for targeted_company_name and link it", async () => {
    const result = await createWithAll(
      {
        candidate_name: "Phạm Thị D",
        status: "Withdraw",
        targeted_company_name: "Foxconn Auto",
      },
      client
    );

    expect(result.targeted_company).to.not.be.null;
    expect(result.targeted_company.company_name).to.equal("Foxconn Auto");
    expect(result.targeted_company.company_id).to.be.a("number");
  });

  // ─── Auto-create reference user từ reference_name ──────────────────────────

  it("should auto-create a new user for reference_name and link it", async () => {
    const result = await createWithAll(
      {
        candidate_name: "Hoàng Văn E",
        status: "CV Fail",
        reference_name: "Bảo Giới Thiệu",
      },
      client
    );

    expect(result.reference).to.not.be.null;
    expect(result.reference.user_name).to.equal("Bảo Giới Thiệu");
    expect(result.reference.user_id).to.be.a("number");
  });

  // ─── ID có sẵn ưu tiên hơn _name ───────────────────────────────────────────

  it("should use existing recruiter ID when both recruiter and recruiter_name are provided", async () => {
    // Seed a user to get a real recruiter ID
    const userRes = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Seeded Recruiter", "user"]
    );
    const seededId = userRes.rows[0].user_id;

    const result = await createWithAll(
      {
        candidate_name: "Đoàn Văn F",
        status: "Hold",
        recruiter: seededId,
        recruiter_name: "Should Be Ignored",
      },
      client
    );

    // Should link to the seeded recruiter, not create a new one
    expect(result.recruiter).to.not.be.null;
    expect(result.recruiter.user_id).to.equal(seededId);
    expect(result.recruiter.user_name).to.equal("Seeded Recruiter");
  });

  // ─── Tất cả _name cùng lúc ─────────────────────────────────────────────────

  it("should create all new lookup records when all _name fields are provided", async () => {
    const result = await createWithAll(
      {
        candidate_name: "Nguyễn Thị G",
        status: "Onboarded",
        recruiter_name: "Recruiter Auto",
        platform_name: "Platform Auto",
        targeted_company_name: "Company Auto",
        reference_name: "Reference Auto",
        agency: "AgencyXYZ",
        current_salary: "15",
        expected_salary: "20",
      },
      client
    );

    expect(result.candidate_name).to.equal("Nguyễn Thị G");
    expect(result.recruiter).to.not.be.null;
    expect(result.recruiter.user_name).to.equal("Recruiter Auto");
    expect(result.platform).to.not.be.null;
    expect(result.platform.platform_name).to.equal("Platform Auto");
    expect(result.targeted_company).to.not.be.null;
    expect(result.targeted_company.company_name).to.equal("Company Auto");
    expect(result.reference).to.not.be.null;
    expect(result.reference.user_name).to.equal("Reference Auto");
  });

  // ─── Không truyền _name lẫn ID → FK null ───────────────────────────────────

  it("should leave FK fields null when neither ID nor _name is provided", async () => {
    const result = await createWithAll(
      { candidate_name: "Lý Thị H", status: "CV Sent" },
      client
    );

    expect(result.recruiter).to.be.null;
    expect(result.platform).to.be.null;
    expect(result.targeted_company).to.be.null;
    expect(result.reference).to.be.null;
    expect(result.job).to.be.null;
  });

  // ─── Levels and Levels Name ────────────────────────────────────────────────

  it("should successfully resolve candidate_levels and candidate_levels_name", async () => {
    // Seed one level
    const levelRes = await client.query(
      `INSERT INTO level (level_name, level_code) VALUES ($1, $2) RETURNING level_id`,
      ["Middle", "MID"]
    );
    const seededLevelId = levelRes.rows[0].level_id;

    const result = await createWithAll(
      {
        candidate_name: "Nguyễn Văn Level",
        status: "CV Sent",
        candidate_levels: [seededLevelId],
        candidate_levels_name: ["Fresher", "Middle"], // Middle exists, Fresher is new
      },
      client
    );

    expect(result.candidate_levels).to.be.an("array").with.lengthOf(3);
    const levelIds = result.candidate_levels.map((cl: any) => cl.level_id);
    const levelNames = result.candidate_levels.map((cl: any) => cl.level_name);

    expect(levelIds).to.include(seededLevelId);
    expect(levelNames).to.include("middle");
    expect(levelNames).to.include("fresher");
  });

  // ─── Auto-create job từ job_code và project ──────────────────────────────────

  it("should auto-create a new job from job_code and project when job_id is missing", async () => {
    const result = await createWithAll(
      {
        candidate_name: "Nguyễn Văn Job",
        status: "CV Sent",
        job_code: "JOB-NEW-999",
        project: "Auto Job Project Name",
      },
      client
    );

    expect(result.job).to.not.be.null;
    expect(result.job.job_code).to.equal("JOB-NEW-999");
    expect(result.job.project).to.equal("Auto Job Project Name");
    expect(result.job.job_id).to.be.a("number");

    // Repeat creation to verify it uses the existing job instead of duplicating it
    const result2 = await createWithAll(
      {
        candidate_name: "Lê Thị Job",
        status: "CV Sent",
        job_code: "JOB-NEW-999",
        project: "Different Project Name But Same Code",
      },
      client
    );

    expect(result2.job).to.not.be.null;
    expect(result2.job.job_id).to.equal(result.job.job_id);
    expect(result2.job.job_code).to.equal("JOB-NEW-999");
  });
});
