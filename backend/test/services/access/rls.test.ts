import { expect } from "chai";
import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import create from "@services/access/create";

describe("Row-Level Security (RLS) policies", () => {
  let client: PoolClient;
  let hrId1: number;
  let hrId2: number;
  let jobId1: number;
  let jobId2: number;
  let jobId3: number;
  let candId1: number;
  let candId2: number;
  let candId3: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Create two HR users
    const u1 = await client.query(`INSERT INTO "user" (user_name, user_role) VALUES ('HR 1', 'hr') RETURNING user_id`);
    hrId1 = u1.rows[0].user_id;

    const u2 = await client.query(`INSERT INTO "user" (user_name, user_role) VALUES ('HR 2', 'hr') RETURNING user_id`);
    hrId2 = u2.rows[0].user_id;

    // Create three jobs
    const j1 = await client.query(`INSERT INTO job (job_code, project) VALUES ('JOB1', 'Project 1') RETURNING job_id`);
    jobId1 = j1.rows[0].job_id;

    const j2 = await client.query(`INSERT INTO job (job_code, project) VALUES ('JOB2', 'Project 2') RETURNING job_id`);
    jobId2 = j2.rows[0].job_id;

    const j3 = await client.query(`INSERT INTO job (job_code, project) VALUES ('JOB3', 'Project 3') RETURNING job_id`);
    jobId3 = j3.rows[0].job_id;

    // Create candidates for each job
    const c1 = await client.query(`INSERT INTO candidate (candidate_name, status, job_id) VALUES ('Cand 1', 'Searching', $1) RETURNING candidate_id`, [jobId1]);
    candId1 = c1.rows[0].candidate_id;

    const c2 = await client.query(`INSERT INTO candidate (candidate_name, status, job_id) VALUES ('Cand 2', 'Searching', $1) RETURNING candidate_id`, [jobId2]);
    candId2 = c2.rows[0].candidate_id;

    const c3 = await client.query(`INSERT INTO candidate (candidate_name, status, job_id) VALUES ('Cand 3', 'Searching', $1) RETURNING candidate_id`, [jobId3]);
    candId3 = c3.rows[0].candidate_id;

    // Set access restrictions
    // JOB1 restricted to HR1
    await create({ user_id: hrId1, job_id: jobId1 }, client);
    // JOB2 restricted to HR2
    await create({ user_id: hrId2, job_id: jobId2 }, client);
    // JOB3 has no restriction (public)
  });

  afterEach(async () => {
    await client.query("RESET ROLE");
    await client.query("ROLLBACK");
    client.release();
  });

  it("HR 1 should only see JOB1 and JOB3 (public), not JOB2 (restricted to HR 2)", async () => {
    await client.query("SET ROLE app_user");
    // Set context to HR 1
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [String(hrId1)]);
    await client.query("SELECT set_config('app.current_user_role', 'hr', true)");

    const res = await client.query("SELECT job_id FROM job ORDER BY job_id ASC");
    const ids = res.rows.map(x => x.job_id);

    expect(ids).to.include(jobId1);
    expect(ids).to.include(jobId3);
    expect(ids).to.not.include(jobId2);
  });

  it("HR 2 should only see JOB2 and JOB3 (public), not JOB1 (restricted to HR 1)", async () => {
    await client.query("SET ROLE app_user");
    // Set context to HR 2
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [String(hrId2)]);
    await client.query("SELECT set_config('app.current_user_role', 'hr', true)");

    const res = await client.query("SELECT job_id FROM job ORDER BY job_id ASC");
    const ids = res.rows.map(x => x.job_id);

    expect(ids).to.include(jobId2);
    expect(ids).to.include(jobId3);
    expect(ids).to.not.include(jobId1);
  });

  it("Admin should see all jobs regardless of restrictions", async () => {
    await client.query("SET ROLE app_user");
    // Set context to Admin
    await client.query("SELECT set_config('app.current_user_id', '9999', true)");
    await client.query("SELECT set_config('app.current_user_role', 'admin', true)");

    const res = await client.query("SELECT job_id FROM job ORDER BY job_id ASC");
    const ids = res.rows.map(x => x.job_id);

    expect(ids).to.include(jobId1);
    expect(ids).to.include(jobId2);
    expect(ids).to.include(jobId3);
  });

  it("HR 1 should only see candidates for JOB1 and JOB3, not JOB2", async () => {
    await client.query("SET ROLE app_user");
    // Set context to HR 1
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [String(hrId1)]);
    await client.query("SELECT set_config('app.current_user_role', 'hr', true)");

    const res = await client.query("SELECT candidate_id FROM candidate ORDER BY candidate_id ASC");
    const ids = res.rows.map(x => x.candidate_id);

    expect(ids).to.include(candId1);
    expect(ids).to.include(candId3);
    expect(ids).to.not.include(candId2);
  });

  it("HR 2 should only see candidates for JOB2 and JOB3, not JOB1", async () => {
    await client.query("SET ROLE app_user");
    // Set context to HR 2
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [String(hrId2)]);
    await client.query("SELECT set_config('app.current_user_role', 'hr', true)");

    const res = await client.query("SELECT candidate_id FROM candidate ORDER BY candidate_id ASC");
    const ids = res.rows.map(x => x.candidate_id);

    expect(ids).to.include(candId2);
    expect(ids).to.include(candId3);
    expect(ids).to.not.include(candId1);
  });
});
