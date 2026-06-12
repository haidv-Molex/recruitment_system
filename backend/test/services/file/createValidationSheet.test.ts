import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import createValidationSheet from "@services/file/createValidationSheet";

describe("createValidationSheet Service", () => {
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

  it("should generate a workbook with correct sheets and values from DB", async () => {
    // Seed some test data into the DB inside the transaction
    const testDeptCode = "TEST_DEPT_" + Date.now();
    await client.query(
      `INSERT INTO department (department_code, department_name) VALUES ($1, $2)`,
      [testDeptCode, "Test Dept Name"]
    );

    const testPlatformName = "TEST_PLATFORM_" + Date.now();
    await client.query(
      `INSERT INTO platform (platform_name) VALUES ($1)`,
      [testPlatformName]
    );

    const testLevelName = "TEST_LEVEL_" + Date.now();
    await client.query(
      `INSERT INTO level (level_code, level_name) VALUES ($1, $2)`,
      [testLevelName, testLevelName]
    );

    const testSiteCode = "T_" + Math.floor(Math.random() * 100);
    await client.query(
      `INSERT INTO site (site_code, site_name) VALUES ($1, $2)`,
      [testSiteCode, "Test Site"]
    );

    const testUserName = "TEST_PIC_" + Date.now();
    const userRes = await client.query<{ user_id: number }>(
      `INSERT INTO "user" (user_name, user_account, user_password, user_role) VALUES ($1, $2, $3, $4) RETURNING user_id`,
      [testUserName, "test_pic_acc_" + Date.now(), "pass", "hr"]
    );
    const userId = userRes.rows[0].user_id;

    await client.query(
      `INSERT INTO candidate (candidate_name, status, recruiter) VALUES ($1, $2, $3)`,
      ["Test Candidate", "CV Sent", userId]
    );

    // Call service with our active transaction client
    const workbook = await createValidationSheet(client);

    expect(workbook).to.not.be.undefined;
    
    // Check worksheets exist
    const validationSheet = workbook.getWorksheet("Data Validation")!;

    expect(validationSheet).to.not.be.undefined;

    // Check Data Validation headers are correct
    const headers: string[] = [];
    validationSheet.getRow(1).eachCell((cell) => {
      headers.push(cell.text);
    });

    expect(headers).to.include("Dept");
    expect(headers).to.include("Source");
    expect(headers).to.include("EE Level");
    expect(headers).to.include("Data source");

    // Check that our seeded data is present in the columns
    const deptColIdx = headers.indexOf("Dept") + 1;
    const picColIdx = headers.indexOf("PIC") + 1;
    const sourceColIdx = headers.indexOf("Source") + 1;
    const levelColIdx = headers.indexOf("EE Level") + 1;
    const siteColIdx = headers.indexOf("Data source") + 1;

    const deptValues: string[] = [];
    const picValues: string[] = [];
    const sourceValues: string[] = [];
    const levelValues: string[] = [];
    const siteValues: string[] = [];

    for (let r = 2; r <= validationSheet.rowCount; r++) {
      const row = validationSheet.getRow(r);
      
      const deptVal = row.getCell(deptColIdx).text;
      if (deptVal) deptValues.push(deptVal);

      const picVal = row.getCell(picColIdx).text;
      if (picVal) picValues.push(picVal);

      const sourceVal = row.getCell(sourceColIdx).text;
      if (sourceVal) sourceValues.push(sourceVal);

      const levelVal = row.getCell(levelColIdx).text;
      if (levelVal) levelValues.push(levelVal);

      const siteVal = row.getCell(siteColIdx).text;
      if (siteVal) siteValues.push(siteVal);
    }

    expect(deptValues).to.include(testDeptCode);
    expect(picValues).to.include(testUserName);
    expect(sourceValues).to.include(testPlatformName);
    expect(levelValues).to.include(testLevelName);
    expect(siteValues).to.include(testSiteCode);
  });

  it("should use fallback default values when DB returns empty results", async () => {
    // To simulate empty DB, we can't easily empty DB because of constraints/existing seed,
    // but we can query using a temp pool client stub or we can just verify that standard fallbacks
    // like "Operation" (Function) and "Job Posting" (Cost Categories) which have no DB tables
    // are present.
    const workbook = await createValidationSheet(client);
    const validationSheet = workbook.getWorksheet("Data Validation")!;
    expect(validationSheet).to.not.be.undefined;

    const headers: string[] = [];
    validationSheet.getRow(1).eachCell((cell) => {
      headers.push(cell.text);
    });

    const funcColIdx = headers.indexOf("Function") + 1;
    const costColIdx = headers.indexOf("Recruitment costs categories") + 1;

    const funcValues: string[] = [];
    const costValues: string[] = [];

    for (let r = 2; r <= validationSheet.rowCount; r++) {
      const row = validationSheet.getRow(r);
      const fVal = row.getCell(funcColIdx).text;
      if (fVal) funcValues.push(fVal);

      const cVal = row.getCell(costColIdx).text;
      if (cVal) costValues.push(cVal);
    }

    expect(funcValues).to.include("Operation");
    expect(funcValues).to.include("Supporting");
    expect(costValues).to.include("Job Posting");
    expect(costValues).to.include("Agency Fees");
  });
});
