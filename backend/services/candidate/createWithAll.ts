import { PoolClient } from "pg";
import User from "@services/user/_User";
import Platform from "@services/platform/_Platform";
import Company from "@services/company/_Company";
import Level from "@services/level/_Level";
import Job from "@services/job/_Job";
import { create, CreateCandidateInput } from "@services/candidate/create";

/**
 * Input cho createCandidateWithAll.
 *
 * Hỗ trợ 2 cách truyền dữ liệu cho mỗi FK lookup:
 *   - ID (đã tồn tại trong DB): platform_id, job_id, targeted_company, reference
 *   - _name (chưa có, sẽ tự tạo):
 *       reference_name       → tạo user mới rồi lấy user_id
 *       platform_name        → tạo platform mới rồi lấy platform_id
 *       targeted_company_name → tạo company mới rồi lấy company_id
 *
 * Nếu cả ID và _name đều được truyền, ID sẽ được dùng (bỏ qua _name).
 */
export interface CreateCandidateWithAllInput {
  // Trường bắt buộc
  candidate_name: string;
  status: string;

  // Trường tùy chọn – scalar
  candidate_code?: string | null;
  candidate_email?: string | null;
  candidate_phone?: string | null;
  agency?: string | null;
  offer_date?: string | Date | null;
  onboard_date?: string | Date | null;
  expected_onboard_date?: string | Date | null;
  feedback_date?: string | Date | null;
  current_salary?: string | null;
  expected_salary?: string | null;
  note?: string | null;
  job_id?: number | null;
  file?: { originalname: string; buffer: Buffer } | null;

  // FK bằng ID gốc
  platform_id?: number | null;
  targeted_company?: number | null;
  reference?: number | null;
  candidate_levels?: number[];

  // FK bằng tên – sẽ tự tạo bản ghi mới nếu không truyền ID tương ứng
  platform_name?: string | null;
  targeted_company_name?: string | null;
  reference_name?: string | null;
  candidate_levels_name?: string[];
  job_code?: string | null;
  project?: string | null;
}

export async function createWithAll(
  data: CreateCandidateWithAllInput,
  pool: PoolClient
) {
  let platformId: number | null = data.platform_id ?? null;
  let targetedCompanyId: number | null = data.targeted_company ?? null;
  let referenceId: number | null = data.reference ?? null;

  // 2. Nếu không có reference ID → tạo user mới từ reference_name
  if (!referenceId && data.reference_name) {
    const user = await User.create({ username: data.reference_name }, pool);
    referenceId = user.user_id;
  }

  // 3. Nếu không có platform_id → tạo platform mới từ platform_name
  if (!platformId && data.platform_name) {
    const platform = await Platform.create({ platform_name: data.platform_name }, pool);
    platformId = platform.platform_id;
  }

  // 4. Nếu không có targeted_company → tạo company mới từ targeted_company_name
  if (!targetedCompanyId && data.targeted_company_name) {
    const company = await Company.create({ company_name: data.targeted_company_name }, pool);
    targetedCompanyId = company.company_id;
  }

  let jobId: number | null = data.job_id ?? null;
  // 4.5. Nếu không có job_id → tìm hoặc tạo job mới bằng job_code và project
  if (!jobId && data.job_code) {
    const jobCodeTrimmed = data.job_code.trim();
    const jobCheck = await pool.query(
      `SELECT job_id FROM job WHERE LOWER(TRIM(job_code)) = LOWER(TRIM($1)) LIMIT 1`,
      [jobCodeTrimmed]
    );
    if (jobCheck.rows.length > 0) {
      jobId = jobCheck.rows[0].job_id;
    } else {
      const projectVal = data.project && data.project.trim() ? data.project.trim() : jobCodeTrimmed;
      const newJob = await Job.create({
        job_code: jobCodeTrimmed,
        project: projectVal,
      }, pool);
      jobId = newJob.job_id;
    }
  }

  // 5. Giải quyết candidate_levels_name thành IDs và gộp với candidate_levels
  const newLevelIds: number[] = [];
  if (data.candidate_levels_name && data.candidate_levels_name.length > 0) {
    const uniqueNames = [...new Set(data.candidate_levels_name.filter(Boolean).map(n => n.trim().toLowerCase()))];
    for (const name of uniqueNames) {
      const level = await Level.create({ level_name: name }, pool);
      newLevelIds.push(level.level_id);
    }
  }
  const mergedCandidateLevels = [
    ...(data.candidate_levels || []),
    ...newLevelIds
  ];

  // 6. Gọi service create gốc với dữ liệu đã được resolve
  const input: CreateCandidateInput = {
    candidate_code: data.candidate_code ?? null,
    candidate_name: data.candidate_name,
    candidate_email: data.candidate_email ?? null,
    candidate_phone: data.candidate_phone ?? null,
    agency: data.agency ?? null,
    offer_date: data.offer_date ?? null,
    onboard_date: data.onboard_date ?? null,
    expected_onboard_date: data.expected_onboard_date ?? null,
    feedback_date: data.feedback_date ?? null,
    current_salary: data.current_salary ?? null,
    expected_salary: data.expected_salary ?? null,
    status: data.status,
    note: data.note ?? null,
    job_id: jobId,
    file: data.file ?? null,
    platform_id: platformId,
    targeted_company: targetedCompanyId,
    reference: referenceId,
    candidate_levels: mergedCandidateLevels.length > 0 ? mergedCandidateLevels : undefined,
  };

  return create(input, pool);
}
