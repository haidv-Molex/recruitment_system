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
        status: "Applied",
        platform_name: "LinkedIn", // will be created
        targeted_company_name: "Molex", // will be created
        job_code: "J100",
      },
      {
        candidate_name: "Candidate Test Import B",
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
        status: "Applied",
      },
      {
        candidate_name: null as any, // Will fail database NOT NULL validation
        status: "Applied",
      }
    ];

    const result = await batchImport(importItems, client);

    expect(result.success).to.be.false;
    expect(result.importedCount).to.equal(1);
    expect(result.errors).to.have.lengthOf(1);
    expect(result.errors[0].candidate_name).to.equal("Unknown Candidate");

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
        status: "Applied",
        job_code: "BATCH-JOB-999",
        project: "Batch Job Project Name",
      },
      {
        candidate_name: "Candidate Job Create B",
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

  it("should store blank candidate_email as null", async () => {
    const importItems = [
      {
        candidate_name: "Candidate Blank Email",
        status: "CV Sent",
        candidate_email: "",
      }
    ];

    const result = await batchImport(importItems, client);

    expect(result.success).to.be.true;
    expect(result.importedCount).to.equal(1);
    expect(result.errors).to.have.lengthOf(0);

    const candidateRes = await client.query(
      `SELECT candidate_email FROM candidate WHERE candidate_name = $1`,
      ["Candidate Blank Email"]
    );
    expect(candidateRes.rows).to.have.lengthOf(1);
    expect(candidateRes.rows[0].candidate_email).to.be.null;
  });

  it("should auto-generate candidate_code in V00001 format when candidate_code is not provided", async () => {
    const importItems = [
      {
        candidate_name: "Candidate Without Code",
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
    const expectedCode = "V" + String(candidate.candidate_id).padStart(5, "0");
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

  it("should prioritize candidate_code match and fallback to candidate_email match", async () => {
    // Insert Candidate 1: code='V99999', email='first@example.com', name='Original One'
    await client.query(
      `INSERT INTO candidate (candidate_code, candidate_name, candidate_email, status)
       VALUES ($1, $2, $3, $4)`,
      ["V99999", "Original One", "first@example.com", "CV Sent"]
    );

    // Insert Candidate 2: code='V88888', email='second@example.com', name='Original Two'
    await client.query(
      `INSERT INTO candidate (candidate_code, candidate_name, candidate_email, status)
       VALUES ($1, $2, $3, $4)`,
      ["V88888", "Original Two", "second@example.com", "CV Sent"]
    );

    // Import Item 1: candidate_code='V99999', email='third@example.com'
    // This should match Candidate 1 by code, and update email/name.
    const importItems1 = [
      {
        candidate_code: "V99999",
        candidate_name: "Updated One",
        candidate_email: "third@example.com",
        status: "Interview",
      }
    ];
    const result1 = await batchImport(importItems1, client);
    expect(result1.success).to.be.true;

    const cand1 = await client.query(`SELECT * FROM candidate WHERE candidate_code = $1`, ["V99999"]);
    expect(cand1.rows[0].candidate_name).to.equal("Updated One");
    expect(cand1.rows[0].candidate_email).to.equal("third@example.com");

    // Import Item 2: candidate_code='V77777', email='second@example.com'
    // Code doesn't match, but email matches Candidate 2. Should update Candidate 2.
    const importItems2 = [
      {
        candidate_code: "V77777",
        candidate_name: "Updated Two",
        candidate_email: "second@example.com",
        status: "Interview",
      }
    ];
    const result2 = await batchImport(importItems2, client);
    expect(result2.success).to.be.true;

    const cand2 = await client.query(`SELECT * FROM candidate WHERE candidate_email = $1`, ["second@example.com"]);
    expect(cand2.rows[0].candidate_code).to.equal("V77777");
    expect(cand2.rows[0].candidate_name).to.equal("Updated Two");
  });
});
