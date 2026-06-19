import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import FileService from "@services/file/_File";
import CandidateDetailService from "@services/candidate_detail/_CandidateDetail";
import Company from "@services/company/_Company";
import Note from "@services/note/_Note";
import { populateCandidateRelations } from "./populate";
import { insertLinkRows } from "@utilities/db/linking";
import type { CandidateDetailWriteData } from "@services/candidate_detail/types";
import { candidateDetailWriteFields } from "@services/candidate_detail/types";
import {
  assertCandidateCodeAvailable,
  assertCandidateEmailAvailable,
  normalizeCandidateEmail,
  resolveCandidateCode
} from "./identity";

export interface CreateCandidateInput extends CandidateDetailWriteData {
  candidate_code?: string | null;
  candidate_name: string;
  candidate_email?: string | null;
  candidate_phone?: string | null;
  agency?: string | null;
  status: string;
  note?: string | null;
  note_user_id?: number | null;
  platform_id?: number | null;
  job_id?: number | null;
  targeted_company?: number | null;
  targeted_company_name?: string | null;
  reference?: number | null;
  file?: { originalname: string; buffer: Buffer } | null;
  candidate_levels?: number[];
}

const pickCandidateDetailData = (data: CreateCandidateInput): CandidateDetailWriteData => {
  const detailData: CandidateDetailWriteData = {};

  candidateDetailWriteFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      (detailData as any)[field] = (data as any)[field];
    }
  });

  return detailData;
};

export async function create(
  data: CreateCandidateInput,
  pool: PoolClient
) {
  let fileId: number | null = null;
  let fileUploadResult: any = null;
  const candidateEmail = normalizeCandidateEmail(data.candidate_email);

  await assertCandidateEmailAvailable(candidateEmail, pool);

  if (data.file) {
    fileUploadResult = await FileService.upload({
      type: "cv",
      originalname: data.file.originalname,
      buffer: data.file.buffer
    }, pool);
    fileId = fileUploadResult.file_id;
  }

  try {
    const candidateCode = await resolveCandidateCode(data.candidate_code, pool);
    await assertCandidateCodeAvailable(candidateCode, pool);

    let targetedCompanyId = data.targeted_company || null;
    if (!targetedCompanyId && data.targeted_company_name?.trim()) {
      const company = await Company.create({ company_name: data.targeted_company_name.trim() }, pool);
      targetedCompanyId = company.company_id;
    }

    const candidateDetail = await CandidateDetailService.create(pickCandidateDetailData(data), pool);

    const query = `
      INSERT INTO candidate (
        candidate_code,
        candidate_name,
        candidate_email,
        candidate_phone,
        agency,
        status,
        candidate_detail_id,
        platform_id,
        job_id,
        targeted_company,
        reference,
        file_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      candidateCode,
      data.candidate_name,
      candidateEmail,
      data.candidate_phone || null,
      data.agency || null,
      data.status,
      candidateDetail.candidate_detail_id,
      data.platform_id || null,
      data.job_id || null,
      targetedCompanyId,
      data.reference || null,
      fileId
    ];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new AppError("Lỗi khi thêm thông tin ứng viên", 500);
    }

    const candidateRow = result.rows[0];
    const candidateId = candidateRow.candidate_id;

    if (data.candidate_levels && data.candidate_levels.length > 0) {
      await insertLinkRows(
        pool,
        "candidate_level",
        data.candidate_levels.map((levelId) => ({ candidate_id: candidateId, level_id: levelId }))
      );
    }

    const noteMessage = typeof data.note === "string" ? data.note.trim() : "";
    if (noteMessage && data.note_user_id) {
      await Note.create({
        user_id: data.note_user_id,
        message: noteMessage,
        candidate_id: candidateId
      }, pool);
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
