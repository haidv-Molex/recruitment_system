import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import FileService from "@services/file/_File";
import Note from "@services/note/_Note";
import { populateCandidateRelations } from "./populate";
import { insertLinkRows } from "@utilities/db/linking";

export interface CreateCandidateInput {
  candidate_code?: string | null;
  candidate_name?: string | null;
  candidate_email: string;
  candidate_phone?: string | null;
  agency?: string | null;
  offer_date?: string | Date | null;
  onboard_date?: string | Date | null;
  expected_onboard_date?: string | Date | null;
  feedback_date?: string | Date | null;
  current_salary?: string | null;
  expected_salary?: string | null;
  status: string;
  note?: string | null;
  platform_id?: number | null;
  job_id?: number | null;
  targeted_company?: number | null;
  reference?: number | null;
  file?: { originalname: string; buffer: Buffer } | null;
  candidate_levels?: number[];
  creator_id?: number | null;
}

export async function create(
  data: CreateCandidateInput,
  pool: PoolClient
) {
  let fileId: number | null = null;
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
    const query = `
      INSERT INTO candidate (
        candidate_code,
        candidate_name,
        candidate_email,
        candidate_phone,
        agency,
        offer_date,
        onboard_date,
        expected_onboard_date,
        feedback_date,
        current_salary,
        expected_salary,
        status,
        note,
        platform_id,
        job_id,
        targeted_company,
        reference,
        file_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const values = [
      data.candidate_code || null,
      data.candidate_name || null,
      data.candidate_email,
      data.candidate_phone || null,
      data.agency || null,
      data.offer_date || null,
      data.onboard_date || null,
      data.expected_onboard_date || null,
      data.feedback_date || null,
      data.current_salary || null,
      data.expected_salary || null,
      data.status,
      data.note || null,
      data.platform_id || null,
      data.job_id || null,
      data.targeted_company || null,
      data.reference || null,
      fileId
    ];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new AppError("Lỗi khi thêm thông tin ứng viên", 500);
    }

    const candidateRow = result.rows[0];
    const candidateId = candidateRow.candidate_id;

    if (data.note && data.creator_id) {
      await Note.create({
        user_id: data.creator_id,
        text: data.note,
        candidate_id: candidateId,
        job_id: data.job_id
      }, pool);
    }

    if (data.candidate_levels && data.candidate_levels.length > 0) {
      await insertLinkRows(
        pool,
        "candidate_level",
        data.candidate_levels.map((levelId) => ({ candidate_id: candidateId, level_id: levelId }))
      );
    }

    return await populateCandidateRelations(candidateRow, pool);
  } catch (error) {
    // Rollback file on disk if db insertion fails
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
