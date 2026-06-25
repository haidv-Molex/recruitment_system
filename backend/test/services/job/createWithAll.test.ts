import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import createWithAll from "@services/job/createWithAll";

describe("createWithAll job service", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function(
      "specifier",
      "return import(specifier)"
    )("chai");
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

  // --- Happy path: không có _name, hoạt động như create gốc ---
  it("should create a job with only base fields (no _name fields)", async () => {
    const result = await createWithAll(
      {
        job_code: "JOB-BASE-001",
        project: "Project Alpha",
      },
      client
    );

    expect(result).to.have.property("job_id").that.is.a("number");
    expect(result.job_code).to.equal("JOB-BASE-001");
    expect(result.project).to.equal("Project Alpha");
    expect(result.partners).to.be.an("array").that.is.empty;
    expect(result.departments).to.be.an("array").that.is.empty;
  });

  // --- partners_name: tự động tạo user mới ---
  it("should create new users for partners_name and link them to the job", async () => {
    const result = await createWithAll(
      {
        job_code: "JOB-PARTNER-001",
        project: "Project Beta",
        departments_name: [
          { name: "Dept A", candidate_required: 1 },
          { name: "Dept B", candidate_required: 1 }
        ],
        partners_name: ["Alice Nguyen", "Bob Tran"],
      },
      client
    );

    expect(result.partners).to.be.an("array").with.lengthOf(2);
    const names = result.partners!.map((p: any) => p.user_name);
    expect(names).to.include("Alice Nguyen");
    expect(names).to.include("Bob Tran");
  });

  // --- managers_name: tự động tạo user mới ---
  it("should create new users for managers_name and link them to the job", async () => {
    const result = await createWithAll(
      {
        job_code: "JOB-MGR-001",
        project: "Project Gamma",
        managers_name: ["Manager One"],
      },
      client
    );

    expect(result.managers).to.be.an("array").with.lengthOf(1);
    expect(result.managers![0]).to.have.property("user_name", "Manager One");
  });

  // --- departments_name: tự động tạo department, code = name.toUpperCase() ---
  it("should create new departments for departments_name with code = name.toUpperCase()", async () => {
    const result = await createWithAll(
      {
        job_code: "JOB-DEPT-001",
        project: "Project Delta",
        departments_name: [{ name: "engineering", candidate_required: 1 }],
      },
      client
    );

    expect(result.departments).to.be.an("array").with.lengthOf(1);
    expect(result.departments![0]).to.have.property(
      "department_name",
      "engineering"
    );
    expect(result.departments![0]).to.have.property(
      "department_code",
      "ENGINEERING"
    );
  });

  // --- segments_name: tự động tạo segment mới ---
  it("should create new segments for segments_name", async () => {
    const result = await createWithAll(
      {
        job_code: "JOB-SEG-001",
        project: "Project Epsilon",
        segments_name: ["Enterprise"],
      },
      client
    );

    expect(result.segments).to.be.an("array").with.lengthOf(1);
    expect(result.segments![0]).to.have.property("segment_name", "Enterprise");
  });

  // --- sites_name: tự động tạo site mới ---
  it("should create new sites for sites_name", async () => {
    const result = await createWithAll(
      {
        job_code: "JOB-SITE-001",
        project: "Project Zeta",
        sites_name: ["Hanoi Office"],
      },
      client
    );

    expect(result.sites).to.be.an("array").with.lengthOf(1);
    expect(result.sites![0]).to.have.property("site_name", "Hanoi Office");
  });

  // --- titles_name + employee_levels_name: gộp, lowercase, deduplicate ---
  it("should deduplicate and lowercase titles_name and employee_levels_name, use same levels for both", async () => {
    const result = await createWithAll(
      {
        job_code: "JOB-LVL-001",
        project: "Project Eta",
        titles_name: ["Senior", "junior"],
        employee_levels_name: ["JUNIOR", "Lead"], // "junior" trùng với "junior" ở trên
      },
      client
    );

    // Unique lowercase: ["senior", "junior", "lead"] → 3 levels
    expect(result.titles).to.be.an("array").with.lengthOf(3);
    expect(result.employee_levels).to.be.an("array").with.lengthOf(3);

    const titleNames = result.titles!.map((t: any) => t.level_name);
    expect(titleNames).to.include("senior");
    expect(titleNames).to.include("junior");
    expect(titleNames).to.include("lead");
  });

  // --- Kết hợp ID gốc + _name: không duplicate ---
  it("should merge existing IDs with newly created ones", async () => {
    // Tạo sẵn một user partner trong transaction
    const existingPartner = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, 'user')
       RETURNING user_id`,
      ["Existing Partner"]
    );
    const existingPartnerId = existingPartner.rows[0].user_id;

    const result = await createWithAll(
      {
        job_code: "JOB-MERGE-001",
        project: "Project Theta",
        departments_name: [
          { name: "Dept X", candidate_required: 1 },
          { name: "Dept Y", candidate_required: 1 }
        ],
        partners: [existingPartnerId],
        partners_name: ["New Partner"],
      },
      client
    );

    expect(result.partners).to.be.an("array").with.lengthOf(2);
    const names = result.partners!.map((p: any) => p.user_name);
    expect(names).to.include("Existing Partner");
    expect(names).to.include("New Partner");
  });

  // --- _name mảng rỗng: không crash, tạo job bình thường ---
  it("should not crash when all _name fields are empty arrays", async () => {
    const result = await createWithAll(
      {
        job_code: "JOB-EMPTY-001",
        project: "Project Iota",
        partners_name: [],
        managers_name: [],
        departments_name: [],
        segments_name: [],
        sites_name: [],
        titles_name: [],
        employee_levels_name: [],
      },
      client
    );

    expect(result).to.have.property("job_id").that.is.a("number");
    expect(result.partners).to.be.an("array").that.is.empty;
  });

  it("should auto-generate job_code from job_id when job_code is blank", async () => {
    const result = await createWithAll(
      {
        job_code: "",
        project: "Project Kappa",
      },
      client
    );

    const expectedCode = `J${String(result.job_id).padStart(3, "0")}`;
    expect(result.job_code).to.equal(expectedCode);
  });

  it("should allow creating a job with null or missing project", async () => {
    const result = await createWithAll(
      {
        job_code: "JOB-NO-PROJECT",
        project: null,
      },
      client
    );

    expect(result).to.have.property("job_id").that.is.a("number");
    expect(result.project).to.be.null;
  });
});
