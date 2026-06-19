import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { getNotesByCandidateId, getNotesByJobId } from "@services/note/getLinkedNotes";

describe("Note linked lookup service", () => {
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

  it("should return candidate and job notes independently", async () => {
    const userResult = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Linked Note Owner", "hr"]
    );
    const candidateResult = await client.query(
      `INSERT INTO candidate (candidate_name, status) VALUES ($1, $2) RETURNING candidate_id`,
      ["Linked Candidate", "Searching"]
    );
    const jobResult = await client.query(
      `INSERT INTO job (job_code, project) VALUES ($1, $2) RETURNING job_id`,
      ["JOB-LINKED-NOTE", "Linked Job"]
    );
    const candidateNoteResult = await client.query(
      `INSERT INTO note (user_id, message) VALUES ($1, $2) RETURNING note_id`,
      [userResult.rows[0].user_id, "Candidate linked note"]
    );
    const jobNoteResult = await client.query(
      `INSERT INTO note (user_id, message) VALUES ($1, $2) RETURNING note_id`,
      [userResult.rows[0].user_id, "Job linked note"]
    );
    await client.query(
      `INSERT INTO candidate_note (candidate_id, note_id) VALUES ($1, $2)`,
      [candidateResult.rows[0].candidate_id, candidateNoteResult.rows[0].note_id]
    );
    await client.query(
      `INSERT INTO job_note (job_id, note_id) VALUES ($1, $2)`,
      [jobResult.rows[0].job_id, jobNoteResult.rows[0].note_id]
    );

    const candidateNotes = await getNotesByCandidateId(candidateResult.rows[0].candidate_id, client);
    const jobNotes = await getNotesByJobId(jobResult.rows[0].job_id, client);

    expect(candidateNotes).to.have.lengthOf(1);
    expect(candidateNotes[0].message).to.equal("Candidate linked note");
    expect(jobNotes).to.have.lengthOf(1);
    expect(jobNotes[0].message).to.equal("Job linked note");
  });
});