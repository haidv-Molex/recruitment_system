import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import createIDLTrackingSheet from "@services/file/createIDLTrackingSheet";
import createFullWorkbook from "@services/file/createFullWorkbook";

describe("createIDLTrackingSheet and createFullWorkbook Services", () => {
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

  async function seedJob(jobCode: string, project: string): Promise<number> {
    const res = await client.query<{ job_id: number }>(
      `INSERT INTO job (job_code, project) VALUES ($1, $2) RETURNING job_id`,
      [jobCode, project]
    );
    return res.rows[0].job_id;
  }

  async function seedDept(code: string, name: string): Promise<number> {
    const res = await client.query<{ department_id: number }>(
      `INSERT INTO department (department_code, department_name) VALUES ($1, $2) RETURNING department_id`,
      [code, name]
    );
    return res.rows[0].department_id;
  }

  function getHeaders(sheet: any): string[] {
    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell: any) => {
      headers.push(typeof cell.value === 'string' ? cell.value : String(cell.value ?? ''));
    });
    return headers;
  }

  function getCellByHeader(sheet: any, headerName: string, rowIndex: number): any {
    const headers = getHeaders(sheet);
    const colIdx = headers.indexOf(headerName) + 1;
    if (colIdx === 0) return undefined;
    return sheet.getRow(rowIndex).getCell(colIdx).value;
  }

  it("should create a single row with comma-separated departments in the job tracking sheet", async () => {
    const ts = Date.now();
    const jobCode = "JOB-IDL-" + ts;
    const jobId = await seedJob(jobCode, "IDL Test Project");

    const deptId1 = await seedDept("IDL_D1_" + ts, "Dept D1 " + ts);
    const deptId2 = await seedDept("IDL_D2_" + ts, "Dept D2 " + ts);

    await client.query(
      `INSERT INTO job_department (job_id, department_id, candidate_required) VALUES ($1, $2, 10), ($1, $3, 20)`,
      [jobId, deptId1, deptId2]
    );

    const workbook = await createIDLTrackingSheet(client);
    const sheet = workbook.getWorksheet("IDL tracking")!;

    expect(sheet).to.not.be.undefined;

    // Filter rows for our job code
    const matchingRows: number[] = [];
    for (let r = 2; r <= sheet.rowCount; r++) {
      const codeVal = getCellByHeader(sheet, "Job Code", r);
      if (String(codeVal ?? "") === jobCode) {
        matchingRows.push(r);
      }
    }

    expect(matchingRows.length).to.equal(1);

    const deptVal = getCellByHeader(sheet, "Dept.", matchingRows[0]);
    const hcVal = getCellByHeader(sheet, "HC Requested", matchingRows[0]);

    expect(String(deptVal)).to.equal(`IDL_D1_${ts}, IDL_D2_${ts}`);
    expect(Number(hcVal)).to.equal(30);
  });

  it("should generate full workbook containing matching comma-separated dept rows", async () => {
    const ts = Date.now();
    const jobCode = "JOB-FULL-" + ts;
    const jobId = await seedJob(jobCode, "Full Workbook Project");

    const deptId1 = await seedDept("FULL_D1_" + ts, "Dept F1 " + ts);
    const deptId2 = await seedDept("FULL_D2_" + ts, "Dept F2 " + ts);

    await client.query(
      `INSERT INTO job_department (job_id, department_id, candidate_required) VALUES ($1, $2, 5), ($1, $3, 15)`,
      [jobId, deptId1, deptId2]
    );

    const workbook = await createFullWorkbook(client);
    const sheet = workbook.getWorksheet("IDL tracking")!;

    expect(sheet).to.not.be.undefined;

    const matchingRows: number[] = [];
    for (let r = 2; r <= sheet.rowCount; r++) {
      const codeVal = getCellByHeader(sheet, "Job Code", r);
      if (String(codeVal ?? "") === jobCode) {
        matchingRows.push(r);
      }
    }

    expect(matchingRows.length).to.equal(1);

    const deptVal = getCellByHeader(sheet, "Dept.", matchingRows[0]);
    const hcVal = getCellByHeader(sheet, "HC Requested", matchingRows[0]);

    expect(String(deptVal)).to.equal(`FULL_D1_${ts}, FULL_D2_${ts}`);
    expect(Number(hcVal)).to.equal(20);
  });
});
