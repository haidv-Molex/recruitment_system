import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import hcByStatusAndExpectedOnboardMonth from "@services/dashboard/hcByStatusAndExpectedOnboardMonth";

describe("hcByStatusAndExpectedOnboardMonth", () => {
  let client: PoolClient;
  let expect: any;

  // Chai v6 dynamic import matching existing pattern
  before(async () => {
    const { expect: localExpect } = await new Function(
      "specifier",
      "return import(specifier)"
    )("chai");
    expect = localExpect;
  });

  let jobId: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Seed a job
    const jobRes = await client.query(
      `INSERT INTO job (job_code, project) VALUES ($1, $2) RETURNING job_id`,
      ["JOB-TEST-CAND", "Test Candidate Project"]
    );
    jobId = jobRes.rows[0].job_id;

    // Seed candidates with different expected_onboard_dates and statuses
    // Active candidates with job_id
    await client.query(
      `INSERT INTO candidate (candidate_name, status, job_id, expected_onboard_date)
       VALUES 
       ($1, $2, $3, $4),
       ($5, $6, $7, $8),
       ($9, $10, $11, $12)`,
      [
        "Candidate One",
        "Onboarded",
        jobId,
        "2025-06-15",
        "Candidate Two",
        "Onboarded",
        jobId,
        "2025-06-20",
        "Candidate Three",
        "Onboarded",
        jobId,
        "2025-07-10",
      ]
    );

    // Seed candidate with different status (should not be counted)
    await client.query(
      `INSERT INTO candidate (candidate_name, status, job_id, expected_onboard_date)
       VALUES ($1, $2, $3, $4)`,
      ["Candidate Four", "In progress", jobId, "2025-06-15"]
    );

    // Seed candidate without job_id (should not be counted)
    await client.query(
      `INSERT INTO candidate (candidate_name, status, job_id, expected_onboard_date)
       VALUES ($1, $2, NULL, $3)`,
      ["Candidate Five", "Onboarded", "2025-06-15"]
    );
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should return monthly count for a given status sorted by date", async () => {
    const result = await hcByStatusAndExpectedOnboardMonth(
      { status: "Onboarded" },
      client
    );

    // June 2025 should have 2 candidates, July 2025 should have 1 candidate
    expect(result).to.be.an("array");
    
    const june = result.find((d: any) => d.label === "2025 June");
    const july = result.find((d: any) => d.label === "2025 July");

    expect(june).to.exist;
    expect(july).to.exist;
    expect(june.value).to.equal(2);
    expect(july.value).to.equal(1);
  });

  it("should correctly apply date filters if provided", async () => {
    const result = await hcByStatusAndExpectedOnboardMonth(
      {
        status: "Onboarded",
        from: new Date("2025-07-01"),
        to: new Date("2025-07-31"),
      },
      client
    );

    const june = result.find((d: any) => d.label === "2025 June");
    const july = result.find((d: any) => d.label === "2025 July");

    expect(june).to.not.exist;
    expect(july).to.exist;
    expect(july.value).to.equal(1);
  });

  it("should return empty array if no candidates match the status", async () => {
    const result = await hcByStatusAndExpectedOnboardMonth(
      { status: "NonExistentStatus" },
      client
    );

    expect(result).to.be.an("array").that.is.empty;
  });
});
