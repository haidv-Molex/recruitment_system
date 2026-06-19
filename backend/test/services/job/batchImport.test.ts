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

  it("should preserve HRBP to department mapping order from batch payload", async () => {
    const result = await batchImport([
      {
        job_code: "JOB-BATCH-ORDER-001",
        project: "Batch Order Project",
        partners_name: ["Order HRBP A", "Order HRBP B"],
        departments_name: [
          { name: "Order Dept A", candidate_required: 1, partner_name: "Order HRBP A" },
          { name: "Order Dept B", candidate_required: 2, partner_name: "Order HRBP B" }
        ],
      }
    ], client);

    expect(result.success).to.be.true;
    expect(result.importedCount).to.equal(1);
    expect(result.errors).to.have.lengthOf(0);

    const rows = await client.query(
      `SELECT d.department_name, u.user_name, jd.candidate_required
       FROM job j
       JOIN job_department jd ON jd.job_id = j.job_id
       JOIN department d ON d.department_id = jd.department_id
       LEFT JOIN "user" u ON u.user_id = d.user_id
       WHERE j.job_code = $1
       ORDER BY d.department_name ASC`,
      ["JOB-BATCH-ORDER-001"]
    );

    expect(rows.rows).to.have.lengthOf(2);
    expect(rows.rows[0]).to.include({
      department_name: "Order Dept A",
      user_name: "Order HRBP A",
      candidate_required: 1,
    });
    expect(rows.rows[1]).to.include({
      department_name: "Order Dept B",
      user_name: "Order HRBP B",
      candidate_required: 2,
    });
  });

  it("should update an existing job when batch import receives the same job_code", async () => {
    const noteOwner = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Batch Import Note Owner", "hr"]
    );

    const firstImport = await batchImport([
      {
        job_code: "JOB-BATCH-UPSERT-001",
        project: "Original Project",
        note: "old note",
        note_user_id: noteOwner.rows[0].user_id,
        departments_name: [{ name: "Upsert Dept Old", candidate_required: 1 }],
        segments_name: ["Upsert Segment Old"],
      }
    ], client);

    expect(firstImport.success).to.be.true;

    const initialJob = await client.query(
      `SELECT job_id FROM job WHERE job_code = $1`,
      ["JOB-BATCH-UPSERT-001"]
    );
    const jobId = initialJob.rows[0].job_id;

    const secondImport = await batchImport([
      {
        job_code: " job-batch-upsert-001 ",
        project: "Updated Project",
        note: "new note",
        note_user_id: noteOwner.rows[0].user_id,
        departments_name: [{ name: "Upsert Dept New", candidate_required: 4 }],
        segments_name: ["Upsert Segment New"],
      }
    ], client);

    expect(secondImport.success).to.be.true;
    expect(secondImport.importedCount).to.equal(1);
    expect(secondImport.errors).to.have.lengthOf(0);

    const jobs = await client.query(
      `SELECT job_id, job_code, project FROM job WHERE LOWER(TRIM(job_code)) = $1`,
      ["job-batch-upsert-001"]
    );
    expect(jobs.rows).to.have.lengthOf(1);
    expect(jobs.rows[0]).to.include({
      job_id: jobId,
      job_code: "job-batch-upsert-001",
      project: "Updated Project",
    });

    const notes = await client.query(
      `SELECT n.message
       FROM job_note jn
       JOIN note n ON n.note_id = jn.note_id
       WHERE jn.job_id = $1
       ORDER BY n.note_id ASC`,
      [jobId]
    );
    expect(notes.rows.map((row) => row.message)).to.deep.equal(["old note", "new note"]);

    const departments = await client.query(
      `SELECT d.department_name, jd.candidate_required
       FROM job_department jd
       JOIN department d ON d.department_id = jd.department_id
       WHERE jd.job_id = $1`,
      [jobId]
    );
    expect(departments.rows).to.deep.equal([
      { department_name: "Upsert Dept New", candidate_required: 4 }
    ]);

    const segments = await client.query(
      `SELECT s.segment_name
       FROM job_segment js
       JOIN segment s ON s.segment_id = js.segment_id
       WHERE js.job_id = $1`,
      [jobId]
    );
    expect(segments.rows).to.deep.equal([
      { segment_name: "Upsert Segment New" }
    ]);
  });

  it("should auto-generate job_code for imported jobs without a job_code", async () => {
    const result = await batchImport([
      {
        job_code: "",
        project: "Batch Auto Code Project",
      }
    ], client);

    expect(result.success).to.be.true;
    expect(result.importedCount).to.equal(1);
    expect(result.errors).to.have.lengthOf(0);

    const jobRes = await client.query(
      `SELECT job_id, job_code FROM job WHERE project = $1`,
      ["Batch Auto Code Project"]
    );
    expect(jobRes.rows).to.have.lengthOf(1);

    const expectedCode = `J${String(jobRes.rows[0].job_id).padStart(3, "0")}`;
    expect(jobRes.rows[0].job_code).to.equal(expectedCode);
  });
});