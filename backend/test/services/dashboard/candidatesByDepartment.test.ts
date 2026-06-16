import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import candidatesByDepartment from "@services/dashboard/candidatesByDepartment";

describe("candidatesByDepartment", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function(
      "specifier",
      "return import(specifier)"
    )("chai");
    expect = localExpect;
  });

  let deptId1: number;
  let deptId2: number;
  let jobId1: number;
  let jobId2: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Seed departments
    const dept1 = await client.query(
      `INSERT INTO department (department_code, department_name)
       VALUES ($1, $2) RETURNING department_id`,
      ["DEPT-A", "Department A"]
    );
    deptId1 = dept1.rows[0].department_id;

    const dept2 = await client.query(
      `INSERT INTO department (department_code, department_name)
       VALUES ($1, $2) RETURNING department_id`,
      ["", "Department B"] // Testing fallback to name
    );
    deptId2 = dept2.rows[0].department_id;

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

    // Link job1 to dept1, job2 to dept2
    await client.query(
      `INSERT INTO job_department (job_id, department_id, candidate_required)
       VALUES ($1, $2, $3), ($4, $5, $6)`,
      [jobId1, deptId1, 2, jobId2, deptId2, 3]
    );

    // Seed candidates
    // Candidate 1: status = 'Offer Accepted', job = job1 (dept1)
    await client.query(
      `INSERT INTO candidate (candidate_name, status, job_id)
       VALUES ($1, $2, $3)`,
      ["Cand A", "Offer Accepted", jobId1]
    );

    // Candidate 2: status = 'Offer Accepted', job = job2 (dept2)
    await client.query(
      `INSERT INTO candidate (candidate_name, status, job_id)
       VALUES ($1, $2, $3)`,
      ["Cand B", "Offer Accepted", jobId2]
    );

    // Candidate 3: status = 'Interview', job = job1 (dept1)
    await client.query(
      `INSERT INTO candidate (candidate_name, status, job_id)
       VALUES ($1, $2, $3)`,
      ["Cand C", "Interview", jobId1]
    );
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should return correct counts grouped by department", async () => {
    const data = await candidatesByDepartment({}, client);

    const deptA = data.find((d: any) => d.label === "DEPT-A")!;
    const deptB = data.find((d: any) => d.label === "Department B")!;

    expect(deptA.value).to.equal(2); // 1 Offer Accepted + 1 Interview
    expect(deptB.value).to.equal(1); // 1 Offer Accepted
  });

  it("should filter by status string", async () => {
    const data = await candidatesByDepartment({ status: "Offer Accepted" }, client);

    const deptA = data.find((d: any) => d.label === "DEPT-A")!;
    const deptB = data.find((d: any) => d.label === "Department B")!;

    expect(deptA.value).to.equal(1);
    expect(deptB.value).to.equal(1);
  });

  it("should filter by status array", async () => {
    const data = await candidatesByDepartment({ status: ["Offer Accepted", "Interview"] }, client);

    const deptA = data.find((d: any) => d.label === "DEPT-A")!;
    const deptB = data.find((d: any) => d.label === "Department B")!;

    expect(deptA.value).to.equal(2);
    expect(deptB.value).to.equal(1);
  });

  it("should filter by department_ids", async () => {
    const data = await candidatesByDepartment({ department_ids: [deptId2] }, client);

    const deptA = data.find((d: any) => d.label === "DEPT-A");
    const deptB = data.find((d: any) => d.label === "Department B")!;

    expect(deptA).to.be.undefined;
    expect(deptB.value).to.equal(1);
  });

  it("should filter by job_ids", async () => {
    const data = await candidatesByDepartment({ job_ids: [jobId1] }, client);

    const deptA = data.find((d: any) => d.label === "DEPT-A")!;
    const deptB = data.find((d: any) => d.label === "Department B");

    expect(deptA.value).to.equal(2);
    expect(deptB).to.be.undefined;
  });
});
