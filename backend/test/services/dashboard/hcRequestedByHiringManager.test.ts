import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import hcRequestedByHiringManager from "@services/dashboard/hcRequestedByHiringManager";

describe("hcRequestedByHiringManager", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function(
      "specifier",
      "return import(specifier)"
    )("chai");
    expect = localExpect;
  });

  let hm1Id: number;
  let hm2Id: number;
  let jobAId: number;
  let jobBId: number;
  let deptAId: number;
  let deptBId: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Seed hiring managers (users)
    const hm1 = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_role) VALUES ($1, $2, 'hr') RETURNING user_id`,
      ["HM Amber", "amber_hm@example.com"]
    );
    hm1Id = hm1.rows[0].user_id;

    const hm2 = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_role) VALUES ($1, $2, 'hr') RETURNING user_id`,
      ["HM Jim", "jim_hm@example.com"]
    );
    hm2Id = hm2.rows[0].user_id;

    // Seed jobs with request_dates
    const jobA = await client.query(
      `INSERT INTO job (job_code, project, request_date) VALUES ($1, $2, $3) RETURNING job_id`,
      ["JOB-A", "Project A", "2025-06-15"]
    );
    jobAId = jobA.rows[0].job_id;

    const jobB = await client.query(
      `INSERT INTO job (job_code, project, request_date) VALUES ($1, $2, $3) RETURNING job_id`,
      ["JOB-B", "Project B", "2025-07-15"]
    );
    jobBId = jobB.rows[0].job_id;

    // Seed departments
    const deptA = await client.query(
      `INSERT INTO department (department_code, department_name) VALUES ($1, $2) RETURNING department_id`,
      ["DEPT-A", "Department A"]
    );
    deptAId = deptA.rows[0].department_id;

    const deptB = await client.query(
      `INSERT INTO department (department_code, department_name) VALUES ($1, $2) RETURNING department_id`,
      ["DEPT-B", "Department B"]
    );
    deptBId = deptB.rows[0].department_id;

    // Link job to department
    await client.query(
      `INSERT INTO job_department (job_id, department_id, candidate_required) VALUES ($1, $2, 10)`,
      [jobAId, deptAId]
    );
    await client.query(
      `INSERT INTO job_department (job_id, department_id, candidate_required) VALUES ($1, $2, 3)`,
      [jobBId, deptAId]
    );
    await client.query(
      `INSERT INTO job_department (job_id, department_id, candidate_required) VALUES ($1, $2, 5)`,
      [jobBId, deptBId]
    );

    // Link hiring managers to jobs
    // HM Amber manages Job A -> candidate_required for Job A = 10 HC
    // HM Jim manages Job B -> candidate_required for Job B = 3 HC + 5 HC = 8 HC
    await client.query(
      `INSERT INTO hiring_manager (job_id, user_id) VALUES ($1, $2)`,
      [jobAId, hm1Id]
    );
    await client.query(
      `INSERT INTO hiring_manager (job_id, user_id) VALUES ($1, $2)`,
      [jobBId, hm2Id]
    );
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should return correct HC requested per Hiring Manager when no filters are applied", async () => {
    const result = await hcRequestedByHiringManager({}, client);

    const amber = result.find((d: any) => d.label === "HM Amber");
    const jim = result.find((d: any) => d.label === "HM Jim");

    expect(amber).to.exist;
    expect(jim).to.exist;
    expect(amber.value).to.equal(10);
    expect(jim.value).to.equal(8);

    // Sorted descending by value
    expect(result.indexOf(amber)).to.be.lessThan(result.indexOf(jim));
  });

  it("should filter by job_id", async () => {
    const result = await hcRequestedByHiringManager({ job_id: jobAId }, client);

    const amber = result.find((d: any) => d.label === "HM Amber");
    const jim = result.find((d: any) => d.label === "HM Jim");

    expect(amber).to.exist;
    expect(amber.value).to.equal(10);
    expect(jim).to.not.exist;
  });

  it("should filter by department_id", async () => {
    const result = await hcRequestedByHiringManager({ department_id: deptBId }, client);

    const amber = result.find((d: any) => d.label === "HM Amber");
    const jim = result.find((d: any) => d.label === "HM Jim");

    expect(amber).to.not.exist;
    expect(jim).to.exist;
    expect(jim.value).to.equal(5);
  });

  it("should filter by date range based on request_date", async () => {
    const result = await hcRequestedByHiringManager(
      {
        from: new Date("2025-07-01"),
        to: new Date("2025-07-31"),
      },
      client
    );

    const amber = result.find((d: any) => d.label === "HM Amber");
    const jim = result.find((d: any) => d.label === "HM Jim");

    expect(amber).to.not.exist;
    expect(jim).to.exist;
    expect(jim.value).to.equal(8);
  });
});
