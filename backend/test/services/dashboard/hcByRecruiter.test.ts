import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import hcByRecruiter from "@services/dashboard/hcByRecruiter";

describe("hcByRecruiter", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function(
      "specifier",
      "return import(specifier)"
    )("chai");
    expect = localExpect;
  });

  let rec1Id: number;
  let rec2Id: number;
  let jobAId: number;
  let jobBId: number;
  let deptAId: number;
  let deptBId: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Seed recruiters (users)
    const rec1 = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_role) VALUES ($1, $2, 'hr') RETURNING user_id`,
      ["Recruiter Annie", "annie@example.com"]
    );
    rec1Id = rec1.rows[0].user_id;

    const rec2 = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_role) VALUES ($1, $2, 'hr') RETURNING user_id`,
      ["Recruiter Cindy", "cindy@example.com"]
    );
    rec2Id = rec2.rows[0].user_id;

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
      `INSERT INTO job_department (job_id, department_id, candidate_required) VALUES ($1, $2, 1)`,
      [jobAId, deptAId]
    );
    await client.query(
      `INSERT INTO job_department (job_id, department_id, candidate_required) VALUES ($1, $2, 1)`,
      [jobBId, deptBId]
    );

    // Seed candidates
    // Annie recruited 2 candidates: one for Job A (June), one for Job B (July)
    // Cindy recruited 1 candidate for Job A (June)
    await client.query(
      `INSERT INTO candidate (candidate_name, status, recruiter, job_id, create_at)
       VALUES 
       ($1, 'Onboarded', $2, $3, $4),
       ($5, 'Onboarded', $6, $7, $8),
       ($9, 'Onboarded', $10, $11, $12)`,
      [
        "Cand A1", rec1Id, jobAId, "2025-06-15 10:00:00",
        "Cand A2", rec1Id, jobBId, "2025-07-15 10:00:00",
        "Cand B1", rec2Id, jobAId, "2025-06-15 10:00:00",
      ]
    );
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should return candidates count per recruiter when no filters are applied", async () => {
    const result = await hcByRecruiter({}, client);

    const annie = result.find((d: any) => d.label === "Recruiter Annie");
    const cindy = result.find((d: any) => d.label === "Recruiter Cindy");

    expect(annie).to.exist;
    expect(cindy).to.exist;
    expect(annie.value).to.equal(2);
    expect(cindy.value).to.equal(1);
    
    // Ordered descending by value
    expect(result.indexOf(annie)).to.be.lessThan(result.indexOf(cindy));
  });

  it("should filter by job_id", async () => {
    const result = await hcByRecruiter({ job_id: jobBId }, client);

    const annie = result.find((d: any) => d.label === "Recruiter Annie");
    const cindy = result.find((d: any) => d.label === "Recruiter Cindy");

    expect(annie).to.exist;
    expect(annie.value).to.equal(1);
    expect(cindy).to.not.exist;
  });

  it("should filter by department_id", async () => {
    const result = await hcByRecruiter({ department_id: deptAId }, client);

    const annie = result.find((d: any) => d.label === "Recruiter Annie");
    const cindy = result.find((d: any) => d.label === "Recruiter Cindy");

    expect(annie).to.exist;
    expect(annie.value).to.equal(1);
    expect(cindy).to.exist;
    expect(cindy.value).to.equal(1);
  });

  it("should filter by date range on create_at", async () => {
    const result = await hcByRecruiter(
      {
        from: new Date("2025-07-01"),
        to: new Date("2025-07-31"),
      },
      client
    );

    const annie = result.find((d: any) => d.label === "Recruiter Annie");
    const cindy = result.find((d: any) => d.label === "Recruiter Cindy");

    expect(annie).to.exist;
    expect(annie.value).to.equal(1);
    expect(cindy).to.not.exist;
  });
});
