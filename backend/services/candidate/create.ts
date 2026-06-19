import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import FileService from "@services/file/_File";
import CandidateDetailService from "@services/candidate_detail/_CandidateDetail";
import { populateCandidateRelations } from "./populate";
import { insertLinkRows } from "@utilities/db/linking";
import type { CandidateDetailWriteData } from "@services/candidate_detail/types";
import { candidateDetailWriteFields } from "@services/candidate_detail/types";

export interface CreateCandidateInput extends CandidateDetailWriteData {
  candidate_code?: string | null;
  candidate_name: string;
  candidate_email?: string | null;
  candidate_phone?: string | null;
  agency?: string | null;
  status: string;
  note?: string | null;
  platform_id?: number | null;
  job_id?: number | null;
  targeted_company?: number | null;
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

  if (data.file) {
    fileUploadResult = await FileService.upload({
      type: "cv",
      originalname: data.file.originalname,
      buffer: data.file.buffer
    }, pool);
    fileId = fileUploadResult.file_id;
  }

  try {
    const candidateDetail = await CandidateDetailService.create(pickCandidateDetailData(data), pool);

    const query = `
      INSERT INTO candidate (
        candidate_code,
        candidate_name,
        candidate_email,
        candidate_phone,
        agency,
        status,
        note,
        candidate_detail_id,
        platform_id,
        job_id,
        targeted_company,
        reference,
        file_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      data.candidate_code || null,
      data.candidate_name,
      data.candidate_email || null,
      data.candidate_phone || null,
      data.agency || null,
      data.status,
      data.note || null,
      candidateDetail.candidate_detail_id,
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
