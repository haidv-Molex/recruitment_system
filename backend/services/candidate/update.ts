import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import FileService from "@services/file/_File";
import Note from "@services/note/_Note";
import { populateCandidateRelations } from "./populate";
import { replaceLinkRows } from "@utilities/db/linking";

export interface UpdateCandidateInput {
  candidate_code?: string | null;
  candidate_name?: string | null;
  candidate_email?: string | null;
  candidate_phone?: string | null;
  agency?: string | null;
  offer_date?: string | Date | null;
  onboard_date?: string | Date | null;
  expected_onboard_date?: string | Date | null;
  feedback_date?: string | Date | null;
  current_salary?: string | null;
  expected_salary?: string | null;
  status?: string;
  note?: string | null;
  platform_id?: number | null;
  job_id?: number | null;
  targeted_company?: number | null;
  reference?: number | null;
  file?: { originalname: string; buffer: Buffer } | null;
  candidate_levels?: number[];
  notes?: { note_id?: number | null; text: string }[];
  updater_id?: number | null;
}

export async function update(
  id: number,
  data: UpdateCandidateInput,
  pool: PoolClient
) {
  // Check if candidate exists
  const checkCand = await pool.query("SELECT candidate_id, job_id FROM candidate WHERE candidate_id = $1", [id]);
  if (checkCand.rows.length === 0) {
    throw new AppError("Không tìm thấy thông tin ứng viên để cập nhật", 404);
  }

  let fileId: number | undefined = undefined;
  let fileUploadResult: any = null;

  if (data.file) {
    fileUploadResult = await FileService.upload({
      type: "cv",
      originalname: data.file.originalname,
      buffer: data.file.buffer
    }, pool);
    fileId = fileUploadResult.file_id;
  }

  try {
    if (data.candidate_levels !== undefined) {
      await replaceLinkRows(
        pool,
        "candidate_level",
        "candidate_id",
        id,
        data.candidate_levels.map((levelId) => ({ candidate_id: id, level_id: levelId }))
      );
    }

    const sets: string[] = [];
    const values: any[] = [];
    let placeholderIndex = 1;

    // Helper to add parameter
    const addParam = (val: any, col: string) => {
      sets.push(`${col} = $${placeholderIndex}`);
      values.push(val);
      placeholderIndex++;
    };

    if (data.candidate_code !== undefined) addParam(data.candidate_code, "candidate_code");
    if (data.candidate_name !== undefined) addParam(data.candidate_name, "candidate_name");
    if (data.candidate_email !== undefined) addParam(data.candidate_email, "candidate_email");
    if (data.candidate_phone !== undefined) addParam(data.candidate_phone, "candidate_phone");
    if (data.agency !== undefined) addParam(data.agency, "agency");
    if (data.offer_date !== undefined) addParam(data.offer_date, "offer_date");
    if (data.onboard_date !== undefined) addParam(data.onboard_date, "onboard_date");
    if (data.expected_onboard_date !== undefined) addParam(data.expected_onboard_date, "expected_onboard_date");
    if (data.feedback_date !== undefined) addParam(data.feedback_date, "feedback_date");
    if (data.current_salary !== undefined) addParam(data.current_salary, "current_salary");
    if (data.expected_salary !== undefined) addParam(data.expected_salary, "expected_salary");
    if (data.status !== undefined) addParam(data.status, "status");
    if (data.note !== undefined) addParam(data.note, "note");
    if (data.platform_id !== undefined) addParam(data.platform_id, "platform_id");
    if (data.job_id !== undefined) addParam(data.job_id, "job_id");
    if (data.targeted_company !== undefined) addParam(data.targeted_company, "targeted_company");
    if (data.reference !== undefined) addParam(data.reference, "reference");
    if (fileId !== undefined) addParam(fileId, "file_id");

    if (data.notes !== undefined && data.updater_id) {
      for (const item of data.notes) {
        if (item.note_id === undefined || item.note_id === null) {
          await Note.create({
            user_id: data.updater_id,
            text: item.text,
            candidate_id: id,
            job_id: data.job_id !== undefined ? data.job_id : checkCand.rows[0].job_id
          }, pool);
        } else {
          await Note.update({
            id: item.note_id,
            text: item.text,
            userId: data.updater_id
          }, pool);
        }
      }
    }

    if (sets.length === 0) {
      // No updates to candidate columns, just fetch candidate and populate candidate levels
      const result = await pool.query("SELECT * FROM candidate WHERE candidate_id = $1", [id]);
      return await populateCandidateRelations(result.rows[0], pool);
    }

    values.push(id);
    const query = `
      UPDATE candidate
      SET ${sets.join(", ")}, update_at = CURRENT_TIMESTAMP
      WHERE candidate_id = $${placeholderIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new AppError("Lỗi khi cập nhật thông tin ứng viên", 500);
    }

    return await populateCandidateRelations(result.rows[0], pool);
  } catch (error) {
    if (fileUploadResult) {
      const fs = require("fs");
      const path = require("path");
      const relativePath = fileUploadResult.file_path;
      const absolutePath = path.join(process.env.PATH_SAVE_FILE || "./uploads", relativePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }
    throw error;
  }
}
