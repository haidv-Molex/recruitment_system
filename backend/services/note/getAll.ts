import { PoolClient } from "pg";
import type { noteOutputModel } from "@model/note/noteModel";
import User from "@services/user/_User";

type GetAllNotesFilters = {
  candidate_id?: number;
  job_id?: number;
};

async function getAll(
  filters: GetAllNotesFilters,
  pool: PoolClient
): Promise<noteOutputModel[]> {
  const conditions: string[] = [];
  const values: any[] = [];

  if (filters.candidate_id !== undefined) {
    values.push(filters.candidate_id);
    conditions.push(`candidate_id = $${values.length}`);
  }

  if (filters.job_id !== undefined) {
    values.push(filters.job_id);
    conditions.push(`job_id = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT note_id, user_id, text, create_at, update_at, job_id, candidate_id
    FROM note
    ${whereClause}
    ORDER BY create_at ASC
  `;

  const result = await pool.query(query, values);

  const populated = await Promise.all(
    result.rows.map(async (row) => {
      const user = await User.findById(row.user_id, pool);
      return {
        note_id: row.note_id,
        text: row.text,
        create_at: row.create_at,
        update_at: row.update_at,
        job_id: row.job_id,
        candidate_id: row.candidate_id,
        user
      } satisfies noteOutputModel;
    })
  );

  return populated;
}

export default getAll;
