import { PoolClient } from "pg";
import User from "@services/user/_User";
import Platform from "@services/platform/_Platform";
import Company from "@services/company/_Company";
import { create, CreateCandidateInput } from "@services/candidate/create";

/**
 * Input cho createCandidateWithAll.
 *
 * Hỗ trợ 2 cách truyền dữ liệu cho mỗi FK lookup:
 *   - ID (đã tồn tại trong DB): recruiter, platform_id, job_id, targeted_company, reference
 *   - _name (chưa có, sẽ tự tạo):
 *       recruiter_name       → tạo user mới rồi lấy user_id
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
  recruiter?: number | null;
  platform_id?: number | null;
  targeted_company?: number | null;
  reference?: number | null;

  // FK bằng tên – sẽ tự tạo bản ghi mới nếu không truyền ID tương ứng
  recruiter_name?: string | null;
  platform_name?: string | null;
  targeted_company_name?: string | null;
  reference_name?: string | null;
}

export async function createWithAll(
  data: CreateCandidateWithAllInput,
  pool: PoolClient
) {
  let recruiterId: number | null = data.recruiter ?? null;
  let platformId: number | null = data.platform_id ?? null;
  let targetedCompanyId: number | null = data.targeted_company ?? null;
  let referenceId: number | null = data.reference ?? null;

  // 1. Nếu không có recruiter ID → tạo user mới từ recruiter_name
  if (!recruiterId && data.recruiter_name) {
    const user = await User.create({ username: data.recruiter_name }, pool);
    recruiterId = user.user_id;
  }

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

  // 5. Gọi service create gốc với dữ liệu đã được resolve
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
    job_id: data.job_id ?? null,
    file: data.file ?? null,
    recruiter: recruiterId,
    platform_id: platformId,
    targeted_company: targetedCompanyId,
    reference: referenceId,
  };

  return create(input, pool);
}
