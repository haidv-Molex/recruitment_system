import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import batchImport from "@services/job/batchImport";

describe("Job batchImport service", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
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

  it("should batch import jobs and auto-create related entities case-insensitively", async () => {
    const result = await batchImport([
      {
        job_code: "JOB-BATCH-PHASE3-A",
        project: "Batch Phase3 Project A",
        partners_name: ["Phase3 HRBP Unique"],
        managers_name: ["Phase3 Manager Unique"],
        departments_name: [{ name: "Phase3 Department Unique", candidate_required: 2, partner_name: "Phase3 HRBP Unique" }],
        segments_name: ["Phase3 Segment Unique"],
        sites_name: ["Phase3 Site Unique"],
        titles_name: ["Phase3 Title Unique"],
        employee_levels_name: ["Phase3 Employee Level Unique"]
      },
      {
        job_code: "JOB-BATCH-PHASE3-B",
        project: "Batch Phase3 Project B",
        partners_name: ["phase3 hrbp unique"],
        managers_name: ["phase3 manager unique"],
        departments_name: [{ name: "phase3 department unique", candidate_required: 3, partner_name: "phase3 hrbp unique" }],
        segments_name: ["phase3 segment unique"],
        sites_name: ["phase3 site unique"],
        titles_name: ["phase3 title unique"],
        employee_levels_name: ["phase3 employee level unique"]
      }
    ], client);

    expect(result.success).to.be.true;
    expect(result.importedCount).to.equal(2);
    expect(result.errors).to.have.lengthOf(0);

    const jobsRes = await client.query(
      `SELECT job_id FROM job WHERE job_code IN ($1, $2)`,
      ["JOB-BATCH-PHASE3-A", "JOB-BATCH-PHASE3-B"]
    );
    expect(jobsRes.rows).to.have.lengthOf(2);

    const userRes = await client.query(
      `SELECT COUNT(*)::int AS total FROM "user" WHERE LOWER(user_name) = $1`,
      ["phase3 hrbp unique"]
    );
    expect(userRes.rows[0].total).to.equal(1);

    const departmentRes = await client.query(
      `SELECT COUNT(*)::int AS total FROM department WHERE LOWER(department_name) = $1`,
      ["phase3 department unique"]
    );
    expect(departmentRes.rows[0].total).to.equal(1);
  });

  it("should handle error in one job but import the other", async () => {
    const result = await batchImport([
      {
        job_code: "JOB-BATCH-PHASE3-OK",
        project: "Batch Phase3 Valid Project"
      },
      {
        job_code: "JOB-BATCH-PHASE3-BAD",
        project: null as any
      }
    ], client);

    expect(result.success).to.be.false;
    expect(result.importedCount).to.equal(1);
    expect(result.errors).to.have.lengthOf(1);
    expect(result.errors[0].job_code).to.equal("JOB-BATCH-PHASE3-BAD");

    const jobRes = await client.query(
      `SELECT job_id FROM job WHERE job_code = $1`,
      ["JOB-BATCH-PHASE3-OK"]
    );
    expect(jobRes.rows).to.have.lengthOf(1);
  });
});