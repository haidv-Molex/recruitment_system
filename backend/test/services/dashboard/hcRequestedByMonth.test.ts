import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import hcRequestedByMonth from "@services/dashboard/hcRequestedByMonth";

describe("hcRequestedByMonth", () => {
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

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

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

    // Seed jobs with request_dates
    // Job A is in June 2025
    const jobA = await client.query(
      `INSERT INTO job (job_code, project, request_date) VALUES ($1, $2, $3) RETURNING job_id`,
      ["JOB-A", "Project A", "2025-06-15"]
    );
    jobAId = jobA.rows[0].job_id;

    // Job B is in July 2025
    const jobB = await client.query(
      `INSERT INTO job (job_code, project, request_date) VALUES ($1, $2, $3) RETURNING job_id`,
      ["JOB-B", "Project B", "2025-07-10"]
    );
    jobBId = jobB.rows[0].job_id;

    // Link job to department
    // Job A (June 2025): Dept A (10 HC) -> Total for June: 10 HC
    // Job B (July 2025): Dept A (3 HC), Dept B (5 HC) -> Total for July: 8 HC
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
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should return HC requested grouped by request month when no filters are applied", async () => {
    const result = await hcRequestedByMonth({}, client);

    expect(result).to.be.an("array");

    const june = result.find((d: any) => d.label === "6/2025");
    const july = result.find((d: any) => d.label === "7/2025");

    expect(june).to.exist;
    expect(july).to.exist;
    expect(june.value).to.be.at.least(10);
    expect(july.value).to.be.at.least(8);

    // Sorted chronologically
    expect(result.indexOf(june)).to.be.lessThan(result.indexOf(july));
  });

  it("should filter by department_id", async () => {
    const result = await hcRequestedByMonth({ department_id: deptAId }, client);

    const june = result.find((d: any) => d.label === "6/2025");
    const july = result.find((d: any) => d.label === "7/2025");

    expect(june).to.exist;
    expect(june.value).to.equal(10);
    expect(july).to.exist;
    expect(july.value).to.equal(3);
  });

  it("should filter by date range", async () => {
    const result = await hcRequestedByMonth(
      {
        from: new Date("2025-06-01"),
        to: new Date("2025-06-30"),
      },
      client
    );

    const june = result.find((d: any) => d.label === "6/2025");
    const july = result.find((d: any) => d.label === "7/2025");

    expect(june).to.exist;
    expect(june.value).to.be.at.least(10);
    expect(july).to.not.exist;
  });

  it("should fill missing months with 0 value when date range spans multiple months with no data", async () => {
    const result = await hcRequestedByMonth(
      {
        from: new Date("2035-05-01"),
        to: new Date("2035-08-31"),
      },
      client
    );

    expect(result).to.be.an("array");
    expect(result).to.have.lengthOf(4); // May, June, July, August

    const labels = result.map((d: any) => d.label);
    expect(labels).to.deep.equal(["5/2035", "6/2035", "7/2035", "8/2035"]);

    const may = result.find((d: any) => d.label === "5/2035");
    const june = result.find((d: any) => d.label === "6/2035");
    const july = result.find((d: any) => d.label === "7/2035");
    const august = result.find((d: any) => d.label === "8/2035");

    expect(may?.value).to.equal(0);
    expect(june?.value).to.equal(0);
    expect(july?.value).to.equal(0);
    expect(august?.value).to.equal(0);
  });
});
