import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import FileService from "@services/file/_File";
import CandidateDetailService from "@services/candidate_detail/_CandidateDetail";
import Company from "@services/company/_Company";
import Note from "@services/note/_Note";
import { populateCandidateRelations } from "./populate";
import { replaceLinkRows } from "@utilities/db/linking";
import type { CandidateDetailWriteData } from "@services/candidate_detail/types";
import { candidateDetailWriteFields } from "@services/candidate_detail/types";
import {
  assertCandidateCodeAvailable,
  assertCandidateEmailAvailable,
  normalizeCandidateEmail,
  resolveCandidateCode
} from "./identity";

export interface UpdateCandidateInput extends CandidateDetailWriteData {
  candidate_code?: string | null;
  candidate_name?: string;
  candidate_email?: string | null;
  candidate_phone?: string | null;
  agency?: string | null;
  status?: string;
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

export async function update(
  id: number,
  data: UpdateCandidateInput,
  pool: PoolClient
) {
  // Check if candidate exists
  const checkCand = await pool.query("SELECT candidate_id, candidate_detail_id FROM candidate WHERE candidate_id = $1", [id]);
  if (checkCand.rows.length === 0) {
    throw new AppError("Không tìm thấy thông tin ứng viên để cập nhật", 404);
  }
  let candidateDetailId: number | null = checkCand.rows[0].candidate_detail_id ?? null;

  const candidateEmail = data.candidate_email !== undefined
    ? normalizeCandidateEmail(data.candidate_email)
    : undefined;
  if (data.candidate_email !== undefined) {
    await assertCandidateEmailAvailable(candidateEmail, pool, id);
  }

  const candidateCode = data.candidate_code !== undefined
    ? await resolveCandidateCode(data.candidate_code, pool)
    : undefined;
  if (candidateCode !== undefined) {
    await assertCandidateCodeAvailable(candidateCode, pool, id);
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
    const detailData: CandidateDetailWriteData = {};

    // Helper to add parameter
    const addParam = (val: any, col: string) => {
      sets.push(`${col} = $${placeholderIndex}`);
      values.push(val);
      placeholderIndex++;
    };

    if (candidateCode !== undefined) addParam(candidateCode, "candidate_code");
    if (data.candidate_name !== undefined) addParam(data.candidate_name, "candidate_name");
    if (data.candidate_email !== undefined) addParam(candidateEmail, "candidate_email");
    if (data.candidate_phone !== undefined) addParam(data.candidate_phone, "candidate_phone");
    if (data.agency !== undefined) addParam(data.agency, "agency");
    if (data.status !== undefined) addParam(data.status, "status");
    if (data.platform_id !== undefined) addParam(data.platform_id, "platform_id");
    if (data.job_id !== undefined) addParam(data.job_id, "job_id");
    if ((data.targeted_company === undefined || data.targeted_company === null) && data.targeted_company_name?.trim()) {
      const company = await Company.create({ company_name: data.targeted_company_name.trim() }, pool);
      addParam(company.company_id, "targeted_company");
    } else if (data.targeted_company !== undefined) {
      addParam(data.targeted_company, "targeted_company");
    }
    if (data.reference !== undefined) addParam(data.reference, "reference");
    if (fileId !== undefined) addParam(fileId, "file_id");

    candidateDetailWriteFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        (detailData as any)[field] = (data as any)[field];
      }
    });

    if (Object.keys(detailData).length > 0) {
      if (candidateDetailId) {
        await CandidateDetailService.update(candidateDetailId, detailData, pool);
      } else {
        const candidateDetail = await CandidateDetailService.create(detailData, pool);
        candidateDetailId = candidateDetail.candidate_detail_id;
        addParam(candidateDetailId, "candidate_detail_id");
      }
    }

    const noteMessage = typeof data.note === "string" ? data.note.trim() : "";
    if (noteMessage && data.note_user_id) {
      await Note.create({
        user_id: data.note_user_id,
        message: noteMessage,
        candidate_id: id
      }, pool);
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
