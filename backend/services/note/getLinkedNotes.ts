import { PoolClient } from "pg";
import type { noteOutputModel } from "@model/note/noteModel";
import { mapNoteRow } from "@services/note/mapper";

export async function getNotesByCandidateId(
  candidateId: number,
  pool: PoolClient
): Promise<noteOutputModel[]> {
  const query = `
    SELECT n.note_id, n.user_id, n.message, n.create_at, n.update_at
    FROM note n
    JOIN candidate_note cn ON cn.note_id = n.note_id
    WHERE cn.candidate_id = $1
    ORDER BY n.create_at DESC, n.note_id DESC
  `;
  const result = await pool.query(query, [candidateId]);

  return await Promise.all(result.rows.map((row) => mapNoteRow(row, pool)));
}

export async function getNotesByJobId(
  jobId: number,
  pool: PoolClient
): Promise<noteOutputModel[]> {
  const query = `
    SELECT n.note_id, n.user_id, n.message, n.create_at, n.update_at
    FROM note n
    JOIN job_note jn ON jn.note_id = n.note_id
    WHERE jn.job_id = $1
    ORDER BY n.create_at DESC, n.note_id DESC
  `;
  const result = await pool.query(query, [jobId]);

  return await Promise.all(result.rows.map((row) => mapNoteRow(row, pool)));
}