import { expect } from "chai";
import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import rollback from "@services/audit/rollback";

describe("rollback (Audit Log)", () => {
  let client: PoolClient;
  let testUserId: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Insert mock user for changed_by
    const userRes = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Audit Tester", "admin"]
    );
    testUserId = userRes.rows[0].user_id;

    // Thiết lập session context
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [String(testUserId)]);
    await client.query("SELECT set_config('app.current_user_role', $1, true)", ["admin"]);
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should rollback UPDATE action successfully", async () => {
    // 1. Insert a site
    const siteRes = await client.query(
      `INSERT INTO site (site_code, site_name, site_description) VALUES ($1, $2, $3) RETURNING site_id`,
      ["TEST_S", "Test Site", "Original Desc"]
    );
    const siteId = siteRes.rows[0].site_id;

    // Clear logs from insert to focus on update log
    await client.query("DELETE FROM audit_log");

    // 2. Update the site
    await client.query(
      `UPDATE site SET site_name = $1, site_description = $2 WHERE site_id = $3`,
      ["Test Site Updated", "New Desc", siteId]
    );

    // 3. Find the update log
    const logRes = await client.query("SELECT * FROM audit_log WHERE table_name = 'site' AND action = 'UPDATE'");
    expect(logRes.rows.length).to.equal(1);
    const updateLog = logRes.rows[0];

    // 4. Run rollback
    const result = await rollback({ auditLogId: updateLog.audit_log_id }, client);
    expect(result).to.be.true;

    // 5. Verify database state is reverted
    const verifyRes = await client.query("SELECT * FROM site WHERE site_id = $1", [siteId]);
    expect(verifyRes.rows[0].site_name).to.equal("Test Site");
    expect(verifyRes.rows[0].site_description).to.equal("Original Desc");
  });

  it("should rollback DELETE action successfully", async () => {
    // 1. Insert a site
    const siteRes = await client.query(
      `INSERT INTO site (site_code, site_name, site_description) VALUES ($1, $2, $3) RETURNING site_id`,
      ["TEST_DELETE_S", "Test Delete Site", "Site Desc"]
    );
    const siteId = siteRes.rows[0].site_id;

    // Clear logs from insert
    await client.query("DELETE FROM audit_log");

    // 2. Delete the site
    await client.query("DELETE FROM site WHERE site_id = $1", [siteId]);

    // 3. Find the delete log
    const logRes = await client.query("SELECT * FROM audit_log WHERE table_name = 'site' AND action = 'DELETE'");
    expect(logRes.rows.length).to.equal(1);
    const deleteLog = logRes.rows[0];

    // 4. Run rollback
    const result = await rollback({ auditLogId: deleteLog.audit_log_id }, client);
    expect(result).to.be.true;

    // 5. Verify database state is restored
    const verifyRes = await client.query("SELECT * FROM site WHERE site_id = $1", [siteId]);
    expect(verifyRes.rows.length).to.equal(1);
    expect(verifyRes.rows[0].site_name).to.equal("Test Delete Site");
  });

  it("should rollback INSERT action successfully", async () => {
    // Clear logs
    await client.query("DELETE FROM audit_log");

    // 1. Insert a level (triggers audit log INSERT)
    const levelRes = await client.query(
      `INSERT INTO level (level_code, level_name) VALUES ($1, $2) RETURNING level_id`,
      ["TEST_L", "Test Level"]
    );
    const levelId = levelRes.rows[0].level_id;

    // 2. Find insert log
    const logRes = await client.query("SELECT * FROM audit_log WHERE table_name = 'level' AND action = 'INSERT'");
    expect(logRes.rows.length).to.equal(1);
    const insertLog = logRes.rows[0];

    // 3. Run rollback
    const result = await rollback({ auditLogId: insertLog.audit_log_id }, client);
    expect(result).to.be.true;

    // 4. Verify record is deleted
    const verifyRes = await client.query("SELECT * FROM level WHERE level_id = $1", [levelId]);
    expect(verifyRes.rows.length).to.equal(0);
  });

  it("should rollback cascading changes (job delete and its job_department links) in correct order", async () => {
    // 1. Insert a department
    const deptRes = await client.query(
      `INSERT INTO department (department_code, department_name) VALUES ($1, $2) RETURNING department_id`,
      ["TEST_DEPT", "Test Department"]
    );
    const deptId = deptRes.rows[0].department_id;

    // 2. Insert a job
    const jobRes = await client.query(
      `INSERT INTO job (job_code, project) VALUES ($1, $2) RETURNING job_id`,
      ["TEST_JOB_RB", "Project RB"]
    );
    const jobId = jobRes.rows[0].job_id;

    // 3. Insert link
    await client.query(
      `INSERT INTO job_department (job_id, department_id, candidate_required) VALUES ($1, $2, $3)`,
      [jobId, deptId, 5]
    );

    // Clear logs from insert
    await client.query("DELETE FROM audit_log");

    // 4. Delete the job (triggers cascade delete on job_department)
    // Runs in a transaction context, so both delete events get the same transaction_id!
    await client.query("DELETE FROM job WHERE job_id = $1", [jobId]);

    // 5. Verify audit log contains both delete logs with same transaction_id
    const logsRes = await client.query("SELECT * FROM audit_log ORDER BY audit_log_id ASC");
    // Should have 2 logs: job_department delete and job delete
    expect(logsRes.rows.length).to.equal(2);
    expect(logsRes.rows[0].transaction_id).to.equal(logsRes.rows[1].transaction_id);

    // Get the log ID of the job delete
    const jobDeleteLog = logsRes.rows.find(r => r.table_name === 'job');
    expect(jobDeleteLog).to.not.be.undefined;

    // 6. Run rollback on the job delete log
    const result = await rollback({ auditLogId: jobDeleteLog.audit_log_id }, client);
    expect(result).to.be.true;

    // 7. Verify both job and job_department link records are restored!
    const jobVerify = await client.query("SELECT * FROM job WHERE job_id = $1", [jobId]);
    expect(jobVerify.rows.length).to.equal(1);

    const linkVerify = await client.query(
      "SELECT * FROM job_department WHERE job_id = $1 AND department_id = $2",
      [jobId, deptId]
    );
    expect(linkVerify.rows.length).to.equal(1);
    expect(linkVerify.rows[0].candidate_required).to.equal(5);
  });
});
