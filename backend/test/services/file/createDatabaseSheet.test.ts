import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import createDatabaseSheet from "@services/file/createDatabaseSheet";

describe("createDatabaseSheet Service", () => {
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

  // ─── Helper: seed a minimal user ─────────────────────────────────────────
  async function seedUser(name: string): Promise<number> {
    const res = await client.query<{ user_id: number }>(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, 'hr') RETURNING user_id`,
      [name]
    );
    return res.rows[0].user_id;
  }

  // ─── Helper: seed a minimal job ──────────────────────────────────────────
  async function seedJob(jobCode: string, project: string, recruiterId?: number): Promise<number> {
    const res = await client.query<{ job_id: number }>(
      `INSERT INTO job (job_code, project, recruiter_id) VALUES ($1, $2, $3) RETURNING job_id`,
      [jobCode, project, recruiterId ?? null]
    );
    return res.rows[0].job_id;
  }

  // ─── Helper: seed a minimal department ─────────────────────────────────────
  async function seedDept(code: string, name: string): Promise<number> {
    const res = await client.query<{ department_id: number }>(
      `INSERT INTO department (department_code, department_name) VALUES ($1, $2) RETURNING department_id`,
      [code, name]
    );
    return res.rows[0].department_id;
  }

  // ─── Helper: seed a platform ─────────────────────────────────────────────
  async function seedPlatform(name: string): Promise<number> {
    const res = await client.query<{ platform_id: number }>(
      `INSERT INTO platform (platform_name) VALUES ($1) RETURNING platform_id`,
      [name]
    );
    return res.rows[0].platform_id;
  }

  // ─── Helper: seed a candidate ────────────────────────────────────────────
  async function seedCandidate(opts: {
    name: string;
    status: string;
    jobId?: number;
    platformId?: number;
  }): Promise<number> {
    const res = await client.query<{ candidate_id: number }>(
      `INSERT INTO candidate (candidate_name, status, job_id, platform_id)
       VALUES ($1, $2, $3, $4)
       RETURNING candidate_id`,
      [opts.name, opts.status, opts.jobId ?? null, opts.platformId ?? null]
    );
    return res.rows[0].candidate_id;
  }

  // ─── Helper: get header text from row 1 ─────────────────────────────────
  function getHeaders(sheet: any): string[] {
    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell: any) => {
      headers.push(typeof cell.value === 'string' ? cell.value : String(cell.value ?? ''));
    });
    return headers;
  }

  // ─── Helper: get cell text by column header name ─────────────────────────
  function getCellByHeader(sheet: any, headerName: string, rowIndex: number): any {
    const headers = getHeaders(sheet);
    const colIdx = headers.indexOf(headerName) + 1;
    if (colIdx === 0) return undefined;
    return sheet.getRow(rowIndex).getCell(colIdx).value;
  }

  // =========================================================================

  it("should return a workbook with a 'Database' sheet", async () => {
    const recruiterId = await seedUser("Test_Recruiter_" + Date.now());
    const platformId = await seedPlatform("LinkedIn_" + Date.now());
    const jobId = await seedJob("JOB-DB-001_" + Date.now(), "Project Alpha", recruiterId);
    await seedCandidate({
      name: "Test Candidate DB",
      status: "CV Sent",
      jobId,
      platformId,
    });

    const workbook = await createDatabaseSheet(client);

    expect(workbook).to.not.be.undefined;

    const sheet = workbook.getWorksheet("Database");
    expect(sheet).to.not.be.undefined;

    const headers = getHeaders(sheet!);
    expect(headers).to.include("Input date (dd/mm/yyyy)");
    expect(headers).to.include("Name");
    expect(headers).to.include("Job code");
    expect(headers).to.include("Status");
    expect(headers).to.include("Source");
    expect(headers).to.include("Recruiter");
  });

  it("should populate candidate data rows correctly", async () => {
    const ts = Date.now();
    const recruiterId = await seedUser("Recruiter_Pop_" + ts);
    const platformId = await seedPlatform("Platform_Pop_" + ts);
    const jobCode = "JOB-POP-" + ts;
    const jobId = await seedJob(jobCode, "Project Pop", recruiterId);
    const candidateName = "Candidate_Pop_" + ts;
    await seedCandidate({
      name: candidateName,
      status: "Interview",
      jobId,
      platformId,
    });

    const workbook = await createDatabaseSheet(client);
    const sheet = workbook.getWorksheet("Database")!;

    // Find the row that has our candidate
    let targetRow = -1;
    for (let r = 2; r <= sheet.rowCount; r++) {
      const val = getCellByHeader(sheet, "Name", r);
      if (String(val ?? "").includes(candidateName)) {
        targetRow = r;
        break;
      }
    }
    expect(targetRow).to.be.greaterThan(1);

    const nameVal = getCellByHeader(sheet, "Name", targetRow);
    const jobCodeVal = getCellByHeader(sheet, "Job code", targetRow);
    const sourceVal = getCellByHeader(sheet, "Source", targetRow);
    const statusVal = getCellByHeader(sheet, "Status", targetRow);

    expect(String(nameVal)).to.include(candidateName);
    expect(String(jobCodeVal)).to.include(jobCode);
    expect(String(sourceVal)).to.include("Platform_Pop_" + ts);
    expect(String(statusVal)).to.equal("Interview");
  });

  it("should auto-fill department, job_title from JD lookup, and ee_level from candidate levels", async () => {
    const ts = Date.now();

    // Seed dept
    const deptCode = "DEPT_" + ts;
    await client.query(
      `INSERT INTO department (department_code, department_name) VALUES ($1, $2)`,
      [deptCode, "Test Department " + ts]
    );
    const deptRes = await client.query<{ department_id: number }>(
      `SELECT department_id FROM department WHERE department_code = $1`, [deptCode]
    );
    const deptId = deptRes.rows[0].department_id;

    // Seed level (used for title)
    const levelName = "level_" + ts;
    await client.query(
      `INSERT INTO level (level_code, level_name) VALUES ($1, $2)`,
      [levelName, levelName]
    );
    const levelRes = await client.query<{ level_id: number }>(
      `SELECT level_id FROM level WHERE level_code = $1`, [levelName]
    );
    const levelId = levelRes.rows[0].level_id;

    // Seed candidate level (different from job title level)
    const candLevelName = "cand_level_" + ts;
    await client.query(
      `INSERT INTO level (level_code, level_name) VALUES ($1, $2)`,
      [candLevelName, candLevelName]
    );
    const candLevelRes = await client.query<{ level_id: number }>(
      `SELECT level_id FROM level WHERE level_code = $1`, [candLevelName]
    );
    const candLevelId = candLevelRes.rows[0].level_id;

    // Seed job and link relations
    const jobCode = "JOB-JD-" + ts;
    const jobId = await seedJob(jobCode, "Project JD " + ts);
    await client.query(`INSERT INTO job_department (job_id, department_id, candidate_required) VALUES ($1, $2, $3)`, [jobId, deptId, 1]);
    await client.query(`INSERT INTO job_title (job_id, level_id) VALUES ($1, $2)`, [jobId, levelId]);
    await client.query(`INSERT INTO employee_level (job_id, level_id) VALUES ($1, $2)`, [jobId, levelId]); // Job level

    // Seed one candidate for this job
    const candidateId = await seedCandidate({ name: "Candidate_JD_" + ts, status: "CV Sent", jobId });
    // Link candidate level
    await client.query(`INSERT INTO candidate_level (candidate_id, level_id) VALUES ($1, $2)`, [candidateId, candLevelId]);

    const workbook = await createDatabaseSheet(client);
    const sheet = workbook.getWorksheet("Database")!;

    // Find the row that has our job_code
    let targetRow = -1;
    for (let r = 2; r <= sheet.rowCount; r++) {
      const val = getCellByHeader(sheet, "Job code", r);
      if (String(val ?? "").includes(jobCode)) {
        targetRow = r;
        break;
      }
    }
    expect(targetRow).to.be.greaterThan(1);

    const deptVal = getCellByHeader(sheet, "Department", targetRow);
    const titleVal = getCellByHeader(sheet, "Job title", targetRow);
    const eeLevelVal = getCellByHeader(sheet, "EE Level", targetRow);

    expect(String(deptVal ?? "")).to.include(deptCode);
    expect(String(titleVal ?? "")).to.include(levelName);
    expect(String(eeLevelVal ?? "")).to.include(candLevelName); // candidate level, not job level
  });

  it("should auto-fill all department codes joined by commas when job has multiple departments", async () => {
    const ts = Date.now();
    const deptCode1 = "D1_" + ts;
    const deptCode2 = "D2_" + ts;
    const deptId1 = await seedDept(deptCode1, "D1 Name");
    const deptId2 = await seedDept(deptCode2, "D2 Name");

    const jobCode = "JOB-JD-MULTI-" + ts;
    const jobId = await seedJob(jobCode, "Multi Dept Project");
    await client.query(`INSERT INTO job_department (job_id, department_id, candidate_required) VALUES ($1, $2, 1), ($1, $3, 2)`, [jobId, deptId1, deptId2]);

    await seedCandidate({ name: "Cand_Multi_" + ts, status: "CV Sent", jobId });

    const workbook = await createDatabaseSheet(client);
    const sheet = workbook.getWorksheet("Database")!;

    let targetRow = -1;
    for (let r = 2; r <= sheet.rowCount; r++) {
      const val = getCellByHeader(sheet, "Job code", r);
      if (String(val ?? "").includes(jobCode)) {
        targetRow = r;
        break;
      }
    }
    expect(targetRow).to.be.greaterThan(1);

    const deptVal = getCellByHeader(sheet, "Department", targetRow);
    expect(String(deptVal ?? "")).to.equal(`${deptCode1}, ${deptCode2}`);
  });

  it("should populate Recruiter column from candidate's recruiter user", async () => {
    const ts = Date.now();
    const recruiterName = "Recruiter_Col_" + ts;
    const recruiterId = await seedUser(recruiterName);
    const jobCode = "JOB-REC-" + ts;
    const jobId = await seedJob(jobCode, "Project Rec " + ts, recruiterId);
    await seedCandidate({ name: "Cand_Rec_" + ts, status: "CV Sent", jobId });

    const workbook = await createDatabaseSheet(client);
    const sheet = workbook.getWorksheet("Database")!;

    // Find the row for our job_code
    let targetRow = -1;
    for (let r = 2; r <= sheet.rowCount; r++) {
      const val = getCellByHeader(sheet, "Job code", r);
      if (String(val ?? "").includes(jobCode)) {
        targetRow = r;
        break;
      }
    }
    expect(targetRow).to.be.greaterThan(1);

    const recruiterVal = getCellByHeader(sheet, "Recruiter", targetRow);
    expect(String(recruiterVal ?? "")).to.include(recruiterName);
  });

  it("should return a header-only 'Database' sheet when no candidates exist", async () => {
    // Delete all existing candidates in this transaction to ensure 0 candidates
    await client.query("DELETE FROM candidate_level");
    await client.query("DELETE FROM candidate");

    // Seed a job but NO candidates
    await seedJob("JOB-EMPTY-" + Date.now(), "Empty Project");

    const workbook = await createDatabaseSheet(client);
    const sheet = workbook.getWorksheet("Database")!;

    expect(sheet).to.not.be.undefined;
    // Row 1 = header; no data rows beyond that
    expect(sheet.rowCount).to.equal(1);
  });
});
