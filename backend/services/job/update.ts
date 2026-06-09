import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { jobOutputModel } from "@model/job/jobModel";

type UpdateJobData = {
  job_code?: string;
  project?: string;
  candidate_required?: number;
  note?: string | null;
  file_id?: number | null;
};

async function update(
  id: number,
  data: UpdateJobData,
  pool: PoolClient
): Promise<jobOutputModel> {
  // Check file_id exists if provided
  if (data.file_id) {
    const fileCheck = await pool.query("SELECT file_id FROM file WHERE file_id = $1", [data.file_id]);
    if (fileCheck.rows.length === 0) {
      throw new AppError("File không tồn tại", 400);
    }
  }

  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (data.job_code !== undefined) {
    fields.push(`job_code = $${index++}`);
    values.push(data.job_code);
  }
  if (data.project !== undefined) {
    fields.push(`project = $${index++}`);
    values.push(data.project);
  }
  if (data.candidate_required !== undefined) {
    fields.push(`candidate_required = $${index++}`);
    values.push(data.candidate_required);
  }
  if (data.note !== undefined) {
    fields.push(`note = $${index++}`);
    values.push(data.note);
  }
  if (data.file_id !== undefined) {
    fields.push(`file_id = $${index++}`);
    values.push(data.file_id);
  }

  if (fields.length === 0) {
    throw new AppError("Không có trường dữ liệu nào được cung cấp để cập nhật", 400);
  }

  values.push(id);
  const query = `
    UPDATE job
    SET ${fields.join(", ")}
    WHERE job_id = $${index}
    RETURNING job_id, job_code, project, candidate_required, note, create_at, update_at, file_id
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy thông tin công việc để cập nhật", 404);
  }

  const row = result.rows[0];
  const host = process.env.HOST || "http://localhost:3000";

  let fileInfo: any = null;
  if (row.file_id) {
    const fileRes = await pool.query("SELECT file_path FROM file WHERE file_id = $1", [row.file_id]);
    if (fileRes.rows.length > 0) {
      fileInfo = {
        file_id: row.file_id,
        file_path: fileRes.rows[0].file_path,
        file_url: `${host}/file/${fileRes.rows[0].file_path}`
      };
    }
  }

  return {
    job_id: row.job_id,
    job_code: row.job_code,
    project: row.project,
    candidate_required: row.candidate_required,
    note: row.note,
    create_at: row.create_at,
    update_at: row.update_at,
    file: fileInfo
  } satisfies jobOutputModel;
}

export default update;
