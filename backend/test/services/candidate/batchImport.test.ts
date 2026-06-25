import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { batchImport } from "@services/candidate/batchImport";

describe("Candidate batchImport service", () => {
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

  it("should successfully batch import candidates, auto-creating related entities case-insensitively", async () => {
    // Seed a job for job_code mapping
    await client.query(
      `INSERT INTO job (job_code, project) VALUES ($1, $2)`,
      ["J100", "Project Import"]
    );

    // Let's import two candidates
    const importItems = [
      {
        candidate_name: "Candidate Test Import A",
        candidate_email: "test.import.a@example.com",
        status: "Applied",
        platform_name: "LinkedIn", // will be created
        targeted_company_name: "Molex", // will be created
        job_code: "J100",
      },
      {
        candidate_name: "Candidate Test Import B",
        candidate_email: "test.import.b@example.com",
        status: "Interviewing",
        platform_name: "linkedin", // should resolve to existing LinkedIn
        targeted_company_name: "molex", // should resolve to existing Molex
        job_code: "j100",
      }
    ];

    const result = await batchImport(importItems, client);

    expect(result.success).to.be.true;
    expect(result.importedCount).to.equal(2);
    expect(result.errors).to.have.lengthOf(0);

    // Verify candidates were inserted by name filter
    const candidatesRes = await client.query(
      "SELECT * FROM candidate WHERE candidate_name IN ($1, $2) ORDER BY candidate_name ASC",
      ["Candidate Test Import A", "Candidate Test Import B"]
    );
    expect(candidatesRes.rows).to.have.lengthOf(2);

    const candA = candidatesRes.rows[0];
    const candB = candidatesRes.rows[1];

    expect(candA.candidate_name).to.equal("Candidate Test Import A");
    expect(candB.candidate_name).to.equal("Candidate Test Import B");

    // Verify they reference the same platform, targeted_company
    expect(candA.platform_id).to.not.be.null;
    expect(candA.platform_id).to.equal(candB.platform_id);

    expect(candA.targeted_company).to.not.be.null;
    expect(candA.targeted_company).to.equal(candB.targeted_company);

    // Verify job mapping
    expect(candA.job_id).to.not.be.null;
    expect(candA.job_id).to.equal(candB.job_id);

    // Verify created platform "LinkedIn"
    const platformRes = await client.query("SELECT * FROM platform WHERE platform_id = $1", [candA.platform_id]);
    expect(platformRes.rows[0].platform_name).to.equal("LinkedIn");

    // Verify created company "Molex"
    const companyRes = await client.query("SELECT * FROM company WHERE company_id = $1", [candA.targeted_company]);
    expect(companyRes.rows[0].company_name).to.equal("Molex");
  });

  it("should handle error in one candidate but import the other (partial success savepoints)", async () => {
    const importItems = [
      {
        candidate_name: "Candidate Test Import Ok",
        candidate_email: "test.ok@example.com",
        status: "Applied",
      },
      {
        candidate_name: "Failing Candidate",
        candidate_email: null as any, // Will fail database NOT NULL validation
        status: "Applied",
      }
    ];

    const result = await batchImport(importItems, client);

    expect(result.success).to.be.false;
    expect(result.importedCount).to.equal(1);
    expect(result.errors).to.have.lengthOf(1);
    expect(result.errors[0].candidate_name).to.equal("Failing Candidate");

    // Verify only the successful candidate is inserted
    const candidatesRes = await client.query(
      "SELECT * FROM candidate WHERE candidate_name = $1",
      ["Candidate Test Import Ok"]
    );
    expect(candidatesRes.rows).to.have.lengthOf(1);
  });

  it("should auto-create missing jobs during batch import based on job_code and project", async () => {
    const importItems = [
      {
        candidate_name: "Candidate Job Create A",
        candidate_email: "job.create.a@example.com",
        status: "Applied",
        job_code: "BATCH-JOB-999",
        project: "Batch Job Project Name",
      },
      {
        candidate_name: "Candidate Job Create B",
        candidate_email: "job.create.b@example.com",
        status: "Interviewing",
        job_code: "BATCH-JOB-999",
        project: "Another Project Name But Same Code", // should reuse
      }
    ];

    const result = await batchImport(importItems, client);

    expect(result.success).to.be.true;
    expect(result.importedCount).to.equal(2);
    expect(result.errors).to.have.lengthOf(0);

    // Verify candidates were inserted
    const candidatesRes = await client.query(
      "SELECT * FROM candidate WHERE candidate_name IN ($1, $2)",
      ["Candidate Job Create A", "Candidate Job Create B"]
    );
    expect(candidatesRes.rows).to.have.lengthOf(2);

    const candA = candidatesRes.rows.find(r => r.candidate_name === "Candidate Job Create A")!;
    const candB = candidatesRes.rows.find(r => r.candidate_name === "Candidate Job Create B")!;

    expect(candA.job_id).to.not.be.null;
    expect(candA.job_id).to.equal(candB.job_id);

    // Verify the auto-created job details
    const jobRes = await client.query("SELECT * FROM job WHERE job_id = $1", [candA.job_id]);
    expect(jobRes.rows[0].job_code).to.equal("BATCH-JOB-999");
    expect(jobRes.rows[0].project).to.equal("Batch Job Project Name");
  });

  it("should persist candidate_email and resolve platform_name and candidate_levels_name", async () => {
    const importItems = [
      {
        candidate_name: "Candidate Email Platform Level",
        status: "CV Sent",
        candidate_email: "candidate.email@example.com",
        platform_name: "Phase3 Source Platform",
        candidate_levels_name: ["Phase3 Engineer", "Phase3 Professional"],
      }
    ];

    const result = await batchImport(importItems, client);

    expect(result.success).to.be.true;
    expect(result.importedCount).to.equal(1);
    expect(result.errors).to.have.lengthOf(0);

    const candidateRes = await client.query(
      `SELECT candidate_id, candidate_email, platform_id FROM candidate WHERE candidate_name = $1`,
      ["Candidate Email Platform Level"]
    );
    expect(candidateRes.rows).to.have.lengthOf(1);
    expect(candidateRes.rows[0].candidate_email).to.equal("candidate.email@example.com");

    const platformRes = await client.query(
      `SELECT platform_name FROM platform WHERE platform_id = $1`,
      [candidateRes.rows[0].platform_id]
    );
    expect(platformRes.rows[0].platform_name).to.equal("Phase3 Source Platform");

    const levelsRes = await client.query(
      `SELECT l.level_name
       FROM candidate_level cl
       JOIN level l ON cl.level_id = l.level_id
       WHERE cl.candidate_id = $1
       ORDER BY l.level_name ASC`,
      [candidateRes.rows[0].candidate_id]
    );
    expect(levelsRes.rows.map((row) => row.level_name)).to.deep.equal([
      "Phase3 Engineer",
      "Phase3 Professional",
    ]);
  });

  it("should fail to import candidate with blank candidate_email", async () => {
    const importItems = [
      {
        candidate_name: "Candidate Blank Email",
        status: "CV Sent",
        candidate_email: "",
      }
    ];

    const result = await batchImport(importItems, client);

    expect(result.success).to.be.false;
    expect(result.importedCount).to.equal(0);
    expect(result.errors).to.have.lengthOf(1);
    expect(result.errors[0].candidate_name).to.equal("Candidate Blank Email");
  });

  it("should auto-generate candidate_code in C00001 format from candidate_id", async () => {
    const importItems = [
      {
        candidate_name: "Candidate Without Code",
        candidate_email: "no.code@example.com",
        status: "CV Sent",
      }
    ];

    const result = await batchImport(importItems, client);
    expect(result.success).to.be.true;

    const candidateRes = await client.query(
      `SELECT candidate_id, candidate_code FROM candidate WHERE candidate_name = $1`,
      ["Candidate Without Code"]
    );
    expect(candidateRes.rows).to.have.lengthOf(1);
    const candidate = candidateRes.rows[0];
    const expectedCode = "C" + String(candidate.candidate_id).padStart(5, "0");
    expect(candidate.candidate_code).to.equal(expectedCode);
  });

  it("should update candidate details instead of creating a new one if candidate_email already exists", async () => {
    // 1. Pre-insert a candidate with a specific email
    const preRes = await client.query(
      `INSERT INTO candidate (candidate_name, candidate_email, status, candidate_phone)
       VALUES ($1, $2, $3, $4) RETURNING candidate_id`,
      ["Original Candidate", "existing.email@example.com", "CV Sent", "111111"]
    );
    const preId = preRes.rows[0].candidate_id;

    // 2. Batch import candidate with the same email but different details
    const importItems = [
      {
        candidate_name: "Updated Candidate Name",
        status: "Interview",
        candidate_email: "existing.email@example.com",
        candidate_phone: "222222",
      }
    ];

    const result = await batchImport(importItems, client);
    expect(result.success).to.be.true;
    expect(result.importedCount).to.equal(1);

    // 3. Verify that no new candidate record was created, and existing record was updated
    const candCountRes = await client.query(
      `SELECT COUNT(*) AS count FROM candidate WHERE candidate_email = $1`,
      ["existing.email@example.com"]
    );
    expect(Number(candCountRes.rows[0].count)).to.equal(1);

    const candRes = await client.query(
      `SELECT * FROM candidate WHERE candidate_id = $1`,
      [preId]
    );
    expect(candRes.rows[0].candidate_name).to.equal("Updated Candidate Name");
    expect(candRes.rows[0].status).to.equal("Interview");
    expect(candRes.rows[0].candidate_phone).to.equal("222222");
  });

  it("should match existing candidates by email and ignore imported candidate_code", async () => {
    const emailOwnerRes = await client.query(
      `INSERT INTO candidate (candidate_name, candidate_email, status)
       VALUES ($1, $2, $3) RETURNING candidate_id, candidate_code`,
      ["Original Email Owner", "second@example.com", "CV Sent"]
    );
    const emailOwnerId = Number(emailOwnerRes.rows[0].candidate_id);
    const originalCode = emailOwnerRes.rows[0].candidate_code;

    const importItems = [
      {
        candidate_code: "V99999",
        candidate_name: "Updated Email Owner",
        candidate_email: "second@example.com",
        status: "Interview",
      }
    ];

    const result = await batchImport(importItems, client);
    expect(result.success).to.be.true;
    expect(result.importedCount).to.equal(1);

    const emailOwner = await client.query(`SELECT * FROM candidate WHERE candidate_id = $1`, [emailOwnerId]);
    expect(emailOwner.rows[0].candidate_code).to.equal(originalCode);
    expect(emailOwner.rows[0].candidate_name).to.equal("Updated Email Owner");
    expect(emailOwner.rows[0].status).to.equal("Interview");
  });

  it("should create a new candidate and ignore candidate_code when email does not match", async () => {
    const existingRes = await client.query(
      `INSERT INTO candidate (candidate_name, candidate_email, status)
       VALUES ($1, $2, $3) RETURNING candidate_id, candidate_code`,
      ["Existing Different Email", "different.email@example.com", "CV Sent"]
    );
    const existingId = Number(existingRes.rows[0].candidate_id);
    const existingCode = existingRes.rows[0].candidate_code;

    const importItems = [
      {
        candidate_code: "V77777",
        candidate_name: "Imported New Email",
        candidate_email: "new.email@example.com",
        status: "Interview",
      }
    ];

    const result = await batchImport(importItems, client);
    expect(result.success).to.be.true;
    expect(result.importedCount).to.equal(1);

    const existingCandidate = await client.query(`SELECT * FROM candidate WHERE candidate_id = $1`, [existingId]);
    expect(existingCandidate.rows[0].candidate_name).to.equal("Existing Different Email");
    expect(existingCandidate.rows[0].candidate_email).to.equal("different.email@example.com");
    expect(existingCandidate.rows[0].candidate_code).to.equal(existingCode);

    const importedCandidate = await client.query(`SELECT * FROM candidate WHERE candidate_email = $1`, ["new.email@example.com"]);
    expect(importedCandidate.rows).to.have.lengthOf(1);
    expect(importedCandidate.rows[0].candidate_code).to.equal("C" + String(importedCandidate.rows[0].candidate_id).padStart(5, "0"));
    expect(importedCandidate.rows[0].candidate_name).to.equal("Imported New Email");
  });
});
