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
      `INSERT INTO job (job_code, project, candidate_required) VALUES ($1, $2, $3)`,
      ["J100", "Project Import", 2]
    );

    // Let's import two candidates
    const importItems = [
      {
        candidate_name: "Candidate Test Import A",
        status: "Applied",
        recruiter_name: "Tracy", // will be created
        platform_name: "LinkedIn", // will be created
        targeted_company_name: "Molex", // will be created
        job_code: "J100",
      },
      {
        candidate_name: "Candidate Test Import B",
        status: "Interviewing",
        recruiter_name: "tracy", // should resolve to existing Tracy
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

    // Verify they reference the same recruiter, platform, targeted_company
    expect(candA.recruiter).to.not.be.null;
    expect(candA.recruiter).to.equal(candB.recruiter);

    expect(candA.platform_id).to.not.be.null;
    expect(candA.platform_id).to.equal(candB.platform_id);

    expect(candA.targeted_company).to.not.be.null;
    expect(candA.targeted_company).to.equal(candB.targeted_company);

    // Verify job mapping
    expect(candA.job_id).to.not.be.null;
    expect(candA.job_id).to.equal(candB.job_id);

    // Verify created user "Tracy"
    const userRes = await client.query("SELECT * FROM \"user\" WHERE user_id = $1", [candA.recruiter]);
    expect(userRes.rows[0].user_name).to.equal("Tracy");

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
});
