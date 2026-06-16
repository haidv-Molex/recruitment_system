import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import recruitmentFunnel from "@services/dashboard/recruitmentFunnel";

describe("recruitmentFunnel", () => {
  let client: PoolClient;
  let expect: any;

  // chai v6 là ESM-only → phải dynamic import
  before(async () => {
    const { expect: localExpect } = await new Function(
      "specifier",
      "return import(specifier)"
    )("chai");
    expect = localExpect;
  });

  let deptId: number;
  let jobId1: number;
  let jobId2: number;
  let siteId1: number;
  let siteId2: number;
  let recruiterId: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Seed recruiter
    const rec = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_password, user_role)
       VALUES ($1, $2, $3, $4) RETURNING user_id`,
      ["Funnel Recruiter", "funnelrec", "hashpass", "Recruiter"]
    );
    recruiterId = rec.rows[0].user_id;

    // Seed department
    const dept = await client.query(
      `INSERT INTO department (department_code, department_name)
       VALUES ($1, $2) RETURNING department_id`,
      ["FUNNEL_DEPT", "Funnel Dept"]
    );
    deptId = dept.rows[0].department_id;

    // Seed jobs
    const job1 = await client.query(
      `INSERT INTO job (job_code, project, request_date)
       VALUES ($1, $2, $3) RETURNING job_id`,
      ["JOB-F-001", "Funnel Project 1", "2025-01-15"]
    );
    jobId1 = job1.rows[0].job_id;

    const job2 = await client.query(
      `INSERT INTO job (job_code, project, request_date)
       VALUES ($1, $2, $3) RETURNING job_id`,
      ["JOB-F-002", "Funnel Project 2", "2025-01-20"]
    );
    jobId2 = job2.rows[0].job_id;

    // Seed sites
    const site1 = await client.query(
      `INSERT INTO site (site_name) VALUES ($1) RETURNING site_id`,
      ["FUNNEL_SITE_1"]
    );
    siteId1 = site1.rows[0].site_id;

    const site2 = await client.query(
      `INSERT INTO site (site_name) VALUES ($1) RETURNING site_id`,
      ["FUNNEL_SITE_2"]
    );
    siteId2 = site2.rows[0].site_id;

    // Link job1 to site1, job2 to site2
    await client.query(
      `INSERT INTO job_site (job_id, site_id) VALUES ($1, $2), ($3, $4)`,
      [jobId1, siteId1, jobId2, siteId2]
    );

    // Seed candidates
    // Candidate 1: status = 'Interview', job = job1, recruiter = recruiter
    await client.query(
      `INSERT INTO candidate (candidate_name, status, recruiter, job_id)
       VALUES ($1, $2, $3, $4)`,
      ["Cand Interview", "Interview", recruiterId, jobId1]
    );

    // Candidate 2: status = 'Onboarded', job = job1, recruiter = recruiter
    await client.query(
      `INSERT INTO candidate (candidate_name, status, recruiter, job_id)
       VALUES ($1, $2, $3, $4)`,
      ["Cand Onboarded", "Onboarded", recruiterId, jobId1]
    );

    // Candidate 3: status = 'Searching', job = job2, recruiter = recruiter
    await client.query(
      `INSERT INTO candidate (candidate_name, status, recruiter, job_id)
       VALUES ($1, $2, $3, $4)`,
      ["Cand Searching", "Searching", recruiterId, jobId2]
    );
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should return cumulative counts when no filters are applied", async () => {
    const data = await recruitmentFunnel({ recruiter_id: recruiterId }, client);

    expect(data).to.be.an("array").of.length(5);

    const cvSent = data.find((d: any) => d.label === "CV Sent")!;
    const interview = data.find((d: any) => d.label === "Interview")!;
    const offered = data.find((d: any) => d.label === "Offered")!;
    const offerAccepted = data.find((d: any) => d.label === "Offer Accepted")!;
    const onboarded = data.find((d: any) => d.label === "Onboarded")!;

    // 3 total candidates
    expect(cvSent.value).to.equal(3);
    // 2 reached interview (Interview, Onboarded)
    expect(interview.value).to.equal(2);
    // 1 reached offered (Onboarded)
    expect(offered.value).to.equal(1);
    // 1 reached offer accepted (Onboarded)
    expect(offerAccepted.value).to.equal(1);
    // 1 reached onboarded (Onboarded)
    expect(onboarded.value).to.equal(1);
  });

  it("should filter cumulative counts by job_id", async () => {
    const data = await recruitmentFunnel({ job_ids: [jobId1], recruiter_id: recruiterId }, client);

    const cvSent = data.find((d: any) => d.label === "CV Sent")!;
    const interview = data.find((d: any) => d.label === "Interview")!;
    const onboarded = data.find((d: any) => d.label === "Onboarded")!;

    // Only 2 candidates for job1
    expect(cvSent.value).to.equal(2);
    expect(interview.value).to.equal(2);
    expect(onboarded.value).to.equal(1);
  });

  it("should filter cumulative counts by site_id", async () => {
    const data = await recruitmentFunnel({ site_ids: [siteId2], recruiter_id: recruiterId }, client);

    const cvSent = data.find((d: any) => d.label === "CV Sent")!;
    const interview = data.find((d: any) => d.label === "Interview")!;

    // Only 1 candidate for job2 (which is linked to site2)
    expect(cvSent.value).to.equal(1);
    expect(interview.value).to.equal(0);
  });

  it("should filter cumulative counts by department_id", async () => {
    // Insert another job recruiting for otherDeptId
    const otherJob = await client.query(
      `INSERT INTO job (job_code, project, request_date)
       VALUES ($1, $2, $3) RETURNING job_id`,
      ["JOB-F-003", "Funnel Project 3", "2025-01-25"]
    );
    const otherJobId = otherJob.rows[0].job_id;

    // Seed department 2
    const otherDept = await client.query(
      `INSERT INTO department (department_code, department_name)
       VALUES ($1, $2) RETURNING department_id`,
      ["OTHER_FUNNEL_DEPT", "Other Funnel Dept"]
    );
    const otherDeptId = otherDept.rows[0].department_id;

    await client.query(
      `INSERT INTO job_department (job_id, department_id, candidate_required)
       VALUES ($1, $2, $3)`,
      [otherJobId, otherDeptId, 5]
    );

    // Candidate 4 linked to otherJob (which belongs to otherDeptId)
    await client.query(
      `INSERT INTO candidate (candidate_name, status, recruiter, job_id)
       VALUES ($1, $2, $3, $4)`,
      ["Cand Other Dept", "Onboarded", recruiterId, otherJobId]
    );

    const data = await recruitmentFunnel({ department_ids: [otherDeptId], recruiter_id: recruiterId }, client);

    const cvSent = data.find((d: any) => d.label === "CV Sent")!;
    const onboarded = data.find((d: any) => d.label === "Onboarded")!;

    expect(cvSent.value).to.equal(1);
    expect(onboarded.value).to.equal(1);
  });

  it("should filter cumulative counts by recruiter_id", async () => {
    // Other recruiter
    const otherRec = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_password, user_role)
       VALUES ($1, $2, $3, $4) RETURNING user_id`,
      ["Other Recruiter", "otherrec", "hashpass", "Recruiter"]
    );
    const otherRecId = otherRec.rows[0].user_id;

    const data = await recruitmentFunnel({ recruiter_id: otherRecId }, client);

    const cvSent = data.find((d: any) => d.label === "CV Sent")!;
    expect(cvSent.value).to.equal(0);
  });
});
