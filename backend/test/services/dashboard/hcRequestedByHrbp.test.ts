import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import hcRequestedByHrbp from "@services/dashboard/hcRequestedByHrbp";

describe("hcRequestedByHrbp", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function(
      "specifier",
      "return import(specifier)"
    )("chai");
    expect = localExpect;
  });

  let hrbp1Id: number;
  let hrbp2Id: number;
  let jobAId: number;
  let jobBId: number;
  let deptAId: number;
  let deptBId: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Seed hrbps (users)
    const hrbp1 = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_role) VALUES ($1, $2, 'hr') RETURNING user_id`,
      ["HRBP Amber", "amber@example.com"]
    );
    hrbp1Id = hrbp1.rows[0].user_id;

    const hrbp2 = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_role) VALUES ($1, $2, 'hr') RETURNING user_id`,
      ["HRBP Jim", "jim@example.com"]
    );
    hrbp2Id = hrbp2.rows[0].user_id;

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

    // Link job to department with HRBP user
    // Amber has: Job A Dept A (10 HC), Job B Dept A (3 HC) -> Total 13 HC
    // Jim has: Job B Dept B (5 HC) -> Total 5 HC
    await client.query(
      `INSERT INTO job_department (job_id, department_id, candidate_required, user_id) VALUES ($1, $2, $3, $4)`,
      [jobAId, deptAId, 10, hrbp1Id]
    );
    await client.query(
      `INSERT INTO job_department (job_id, department_id, candidate_required, user_id) VALUES ($1, $2, $3, $4)`,
      [jobBId, deptAId, 3, hrbp1Id]
    );
    await client.query(
      `INSERT INTO job_department (job_id, department_id, candidate_required, user_id) VALUES ($1, $2, $3, $4)`,
      [jobBId, deptBId, 5, hrbp2Id]
    );
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should return correct HC requested per HRBP when no filters are applied", async () => {
    const result = await hcRequestedByHrbp({}, client);

    const amber = result.find((d: any) => d.label === "HRBP Amber");
    const jim = result.find((d: any) => d.label === "HRBP Jim");

    expect(amber).to.exist;
    expect(jim).to.exist;
    expect(amber.value).to.equal(13);
    expect(jim.value).to.equal(5);

    // Sorted descending by value
    expect(result.indexOf(amber)).to.be.lessThan(result.indexOf(jim));
  });

  it("should filter by job_id", async () => {
    const result = await hcRequestedByHrbp({ job_id: jobAId }, client);

    const amber = result.find((d: any) => d.label === "HRBP Amber");
    const jim = result.find((d: any) => d.label === "HRBP Jim");

    expect(amber).to.exist;
    expect(amber.value).to.equal(10);
    expect(jim).to.not.exist;
  });

  it("should filter by department_id", async () => {
    const result = await hcRequestedByHrbp({ department_id: deptBId }, client);

    const amber = result.find((d: any) => d.label === "HRBP Amber");
    const jim = result.find((d: any) => d.label === "HRBP Jim");

    expect(amber).to.not.exist;
    expect(jim).to.exist;
    expect(jim.value).to.equal(5);
  });

  it("should filter by date range based on request_date", async () => {
    const result = await hcRequestedByHrbp(
      {
        from: new Date("2025-07-01"),
        to: new Date("2025-07-31"),
      },
      client
    );

    const amber = result.find((d: any) => d.label === "HRBP Amber");
    const jim = result.find((d: any) => d.label === "HRBP Jim");

    expect(amber).to.exist;
    expect(amber.value).to.equal(3);
    expect(jim).to.exist;
    expect(jim.value).to.equal(5);
  });
});
