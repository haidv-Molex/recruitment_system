import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import jobHCTracking from "@services/dashboard/jobHCTracking";

describe("jobHCTracking", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function(
      "specifier",
      "return import(specifier)"
    )("chai");
    expect = localExpect;
  });

  let jobAId: number;
  let jobBId: number;
  let deptAId: number;
  let deptBId: number;
  let levelAId: number;
  let levelBId: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Seed levels (titles)
    const levelA = await client.query(
      `INSERT INTO level (level_name) VALUES ($1) RETURNING level_id`,
      ["Test Engineer"]
    );
    levelAId = levelA.rows[0].level_id;

    const levelB = await client.query(
      `INSERT INTO level (level_name) VALUES ($1) RETURNING level_id`,
      ["Technician"]
    );
    levelBId = levelB.rows[0].level_id;

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

    // Seed jobs
    const jobA = await client.query(
      `INSERT INTO job (job_code, project) VALUES ($1, $2) RETURNING job_id`,
      ["JOB-A", "Project A"]
    );
    jobAId = jobA.rows[0].job_id;

    const jobB = await client.query(
      `INSERT INTO job (job_code, project) VALUES ($1, $2) RETURNING job_id`,
      ["JOB-B", "Project B"]
    );
    jobBId = jobB.rows[0].job_id;

    // Link job titles
    await client.query(
      `INSERT INTO job_title (job_id, level_id) VALUES ($1, $2)`,
      [jobAId, levelAId]
    );
    await client.query(
      `INSERT INTO job_title (job_id, level_id) VALUES ($1, $2)`,
      [jobBId, levelBId]
    );

    // Link job to department
    // Job A: Dept A (10 HC) -> Total req = 10
    // Job B: Dept A (3 HC), Dept B (5 HC) -> Total req = 8
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

    // Seed candidates
    // Job A: 1 onboarded -> closed = 1, open = 9
    // Job B: 2 onboarded, 1 interviewing -> closed = 2, open = 6
    await client.query(
      `INSERT INTO candidate (candidate_name, status, job_id)
       VALUES 
       ($1, 'Onboarded', $2),
       ($3, 'Onboarded', $4),
       ($5, 'Onboarded', $6),
       ($7, 'Interviewing', $8)`,
      [
        "Cand A1", jobAId,
        "Cand B1", jobBId,
        "Cand B2", jobBId,
        "Cand B3", jobBId,
      ]
    );
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should return HC tracking per job when no filters are applied", async () => {
    const result = await jobHCTracking({}, client);

    const jobA = result.find((d: any) => d.job_id === jobAId);
    const jobB = result.find((d: any) => d.job_id === jobBId);

    expect(jobA).to.exist;
    expect(jobB).to.exist;

    expect(jobA.job_title).to.equal("Test Engineer");
    expect(jobA.candidate_required).to.equal(10);
    expect(jobA.closed_count).to.equal(1);
    expect(jobA.open_count).to.equal(9);

    expect(jobB.job_title).to.equal("Technician");
    expect(jobB.candidate_required).to.equal(8);
    expect(jobB.closed_count).to.equal(2);
    expect(jobB.open_count).to.equal(6);
  });

  it("should filter by department_id", async () => {
    const result = await jobHCTracking({ department_id: deptAId }, client);

    const jobA = result.find((d: any) => d.job_id === jobAId);
    const jobB = result.find((d: any) => d.job_id === jobBId);

    expect(jobA).to.exist;
    expect(jobB).to.exist;

    expect(jobA.candidate_required).to.equal(10);
    expect(jobA.closed_count).to.equal(1);
    expect(jobA.open_count).to.equal(9);

    // Job B in Dept A only has req = 3, but closed = 2, so open = 1
    expect(jobB.candidate_required).to.equal(3);
    expect(jobB.closed_count).to.equal(2);
    expect(jobB.open_count).to.equal(1);
  });
});
