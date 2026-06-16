import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import candidatesByPlatform from "@services/dashboard/candidatesByPlatform";

describe("candidatesByPlatform", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function(
      "specifier",
      "return import(specifier)"
    )("chai");
    expect = localExpect;
  });

  let platformId1: number;
  let platformId2: number;
  let deptId1: number;
  let jobId1: number;
  let jobId2: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Seed platforms
    const p1 = await client.query(
      `INSERT INTO platform (platform_name, platform_description)
       VALUES ($1, $2) RETURNING platform_id`,
      ["Linkedin", "Professional network"]
    );
    platformId1 = p1.rows[0].platform_id;

    const p2 = await client.query(
      `INSERT INTO platform (platform_name, platform_description)
       VALUES ($1, $2) RETURNING platform_id`,
      ["Indeed", "Job board"]
    );
    platformId2 = p2.rows[0].platform_id;

    // Seed department
    const dept1 = await client.query(
      `INSERT INTO department (department_code, department_name)
       VALUES ($1, $2) RETURNING department_id`,
      ["DEPT-A", "Department A"]
    );
    deptId1 = dept1.rows[0].department_id;

    // Seed jobs
    const job1 = await client.query(
      `INSERT INTO job (job_code, project, request_date)
       VALUES ($1, $2, $3) RETURNING job_id`,
      ["JOB-CD-001", "Project 1", "2025-01-15"]
    );
    jobId1 = job1.rows[0].job_id;

    const job2 = await client.query(
      `INSERT INTO job (job_code, project, request_date)
       VALUES ($1, $2, $3) RETURNING job_id`,
      ["JOB-CD-002", "Project 2", "2025-01-20"]
    );
    jobId2 = job2.rows[0].job_id;

    // Link job1 to dept1
    await client.query(
      `INSERT INTO job_department (job_id, department_id, candidate_required)
       VALUES ($1, $2, $3)`,
      [jobId1, deptId1, 2]
    );

    // Seed candidates
    // Candidate 1: platform = Linkedin, status = 'Offer Accepted', job = job1 (dept1)
    await client.query(
      `INSERT INTO candidate (candidate_name, status, job_id, platform_id)
       VALUES ($1, $2, $3, $4)`,
      ["Cand A", "Offer Accepted", jobId1, platformId1]
    );

    // Candidate 2: platform = Indeed, status = 'Offer Accepted', job = job2 (no dept)
    await client.query(
      `INSERT INTO candidate (candidate_name, status, job_id, platform_id)
       VALUES ($1, $2, $3, $4)`,
      ["Cand B", "Offer Accepted", jobId2, platformId2]
    );

    // Candidate 3: platform = Linkedin, status = 'Interview', job = job1 (dept1)
    await client.query(
      `INSERT INTO candidate (candidate_name, status, job_id, platform_id)
       VALUES ($1, $2, $3, $4)`,
      ["Cand C", "Interview", jobId1, platformId1]
    );
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should return correct counts grouped by platform", async () => {
    const data = await candidatesByPlatform({}, client);

    const linkedin = data.find((d: any) => d.label === "Linkedin")!;
    const indeed = data.find((d: any) => d.label === "Indeed")!;

    expect(linkedin.value).to.equal(2); // Cand A and Cand C
    expect(indeed.value).to.equal(1); // Cand B
  });

  it("should filter by status string", async () => {
    const data = await candidatesByPlatform({ status: "Offer Accepted" }, client);

    const linkedin = data.find((d: any) => d.label === "Linkedin")!;
    const indeed = data.find((d: any) => d.label === "Indeed")!;

    expect(linkedin.value).to.equal(1); // Cand A
    expect(indeed.value).to.equal(1); // Cand B
  });

  it("should filter by status array", async () => {
    const data = await candidatesByPlatform({ status: ["Offer Accepted", "Interview"] }, client);

    const linkedin = data.find((d: any) => d.label === "Linkedin")!;
    const indeed = data.find((d: any) => d.label === "Indeed")!;

    expect(linkedin.value).to.equal(2); // Cand A and Cand C
    expect(indeed.value).to.equal(1); // Cand B
  });

  it("should filter by job_ids", async () => {
    const data = await candidatesByPlatform({ job_ids: [jobId1] }, client);

    const linkedin = data.find((d: any) => d.label === "Linkedin")!;
    const indeed = data.find((d: any) => d.label === "Indeed");

    expect(linkedin.value).to.equal(2); // Cand A and Cand C
    expect(indeed).to.be.undefined; // Indeed is empty for jobId1
  });

  it("should filter by department_ids", async () => {
    const data = await candidatesByPlatform({ department_ids: [deptId1] }, client);

    const linkedin = data.find((d: any) => d.label === "Linkedin")!;
    const indeed = data.find((d: any) => d.label === "Indeed");

    expect(linkedin.value).to.equal(2); // Cand A and Cand C
    expect(indeed).to.be.undefined; // Indeed is empty for deptId1
  });
});
