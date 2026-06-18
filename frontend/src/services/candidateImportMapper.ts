const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailFormatMessage = 'Định dạng email chuẩn: name@example.com, ví dụ nguyen.van.a@gmail.com; không chứa khoảng trắng và phải có @ cùng tên miền.';

export interface CandidateImportError {
  candidate_name: string;
  message: string;
  rowIndex: number;
}

export interface CandidateBatchImportPayload {
  candidate_name: string;
  status: string;
  candidate_code: string | null;
  candidate_email: string | null;
  candidate_phone: string | null;
  agency: string | null;
  offer_date: string | null;
  onboard_date: string | null;
  expected_onboard_date: string | null;
  feedback_date: string | null;
  current_salary: string | null;
  expected_salary: string | null;
  note: string | null;
  recruiter: number | null;
  recruiter_name: string | null;
  targeted_company_name: string | null;
  reference_name: string | null;
  platform_name: string | null;
  candidate_levels_name: string[];
  job_code: string | null;
  project: string | null;
}

export interface CandidateExtendedFormPayload {
  candidateCode: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  agency: string;
  offerDate: string;
  onboardDate: string;
  expectedOnboardDate: string;
  feedbackDate: string;
  currentSalary: string;
  expectedSalary: string;
  status: string;
  note: string;
  file: null;
  platformId: string;
  recruiterId: number | string;
  jobId: string;
  targetedCompanyId: string;
  referenceId: string;
  platformName: string;
  recruiterName: string;
  targetedCompanyName: string;
  referenceName: string;
  candidateLevelsName: string[];
  jobCode: string;
  project: string;
}

function toStringValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function toNullableString(value: unknown): string | null {
  const normalized = toStringValue(value);
  return normalized || null;
}

function formatApiDate(value: unknown): string | null {
  if (!value) return null;

  const date = new Date(value as any);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function normalizeEmail(value: unknown, candidateName: string, rowIndex: number): {
  email: string | null;
  error: CandidateImportError | null;
} {
  const email = toStringValue(value);
  if (!email) {
    return { email: null, error: null };
  }

  if (!emailRegex.test(email)) {
    return {
      email: null,
      error: {
        candidate_name: candidateName,
        message: `Email không hợp lệ ở dòng ${rowIndex + 1}: ${email}. ${emailFormatMessage}`,
        rowIndex,
      },
    };
  }

  return { email, error: null };
}

function splitList(value: unknown): string[] {
  const normalized = toStringValue(value);
  if (!normalized) return [];

  return normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isPlaceholderUser(user: any): boolean {
  return user && Object.prototype.hasOwnProperty.call(user, 'user_id') && user.user_id === null;
}

function getRecruiterId(user: any): number | null {
  if (!user || isPlaceholderUser(user)) return null;
  const userId = Number(user.user_id);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

function getRecruiterName(user: any): string | null {
  if (!isPlaceholderUser(user)) return null;
  return toNullableString(user.user_name);
}

export function mapParsedCandidateToBatchPayload(
  candidate: any,
  rowIndex = 0
): { payload: CandidateBatchImportPayload | null; error: CandidateImportError | null } {
  const candidateName = toStringValue(candidate.candidate_name) || `Row ${rowIndex + 1}`;
  const { email, error } = normalizeEmail(candidate.candidate_email, candidateName, rowIndex);
  if (error) {
    return { payload: null, error };
  }

  const targetedCompanyName = toStringValue(candidate.targeted_company) === 'Yes'
    ? toNullableString(candidate.targeted_company_name)
    : null;

  return {
    payload: {
      candidate_name: toStringValue(candidate.candidate_name),
      status: toStringValue(candidate.status),
      candidate_code: toNullableString(candidate.employee_code),
      candidate_email: email,
      candidate_phone: toNullableString(candidate.candidate_phone),
      agency: toNullableString(candidate.agency),
      offer_date: formatApiDate(candidate.offer_date),
      onboard_date: formatApiDate(candidate.onboard_date),
      expected_onboard_date: null,
      feedback_date: formatApiDate(candidate.feedback_date),
      current_salary: toNullableString(candidate.current_salary),
      expected_salary: toNullableString(candidate.expected_salary),
      note: toNullableString(candidate.note),
      recruiter: getRecruiterId(candidate.recruiter),
      recruiter_name: getRecruiterName(candidate.recruiter),
      targeted_company_name: targetedCompanyName,
      reference_name: toNullableString(candidate.reference_name),
      platform_name: toNullableString(candidate.source),
      candidate_levels_name: splitList(candidate.ee_level),
      job_code: toNullableString(candidate.job_code),
      project: toNullableString(candidate.project),
    },
    error: null,
  };
}

export function mapParsedCandidatesToBatchPayload(candidates: any[]): {
  candidatesPayload: CandidateBatchImportPayload[];
  errors: CandidateImportError[];
} {
  const candidatesPayload: CandidateBatchImportPayload[] = [];
  const errors: CandidateImportError[] = [];

  candidates.forEach((candidate, index) => {
    const mapped = mapParsedCandidateToBatchPayload(candidate, index);
    if (mapped.error) {
      errors.push(mapped.error);
      return;
    }
    if (mapped.payload) {
      candidatesPayload.push(mapped.payload);
    }
  });

  return { candidatesPayload, errors };
}

export function mapParsedCandidateToExtendedFormPayload(
  candidate: any,
  rowIndex = 0
): { payload: CandidateExtendedFormPayload | null; error: CandidateImportError | null } {
  const mapped = mapParsedCandidateToBatchPayload(candidate, rowIndex);
  if (mapped.error || !mapped.payload) {
    return { payload: null, error: mapped.error };
  }

  const payload = mapped.payload;
  return {
    payload: {
      candidateCode: payload.candidate_code || '',
      candidateName: payload.candidate_name,
      candidateEmail: payload.candidate_email || '',
      candidatePhone: payload.candidate_phone || '',
      agency: payload.agency || '',
      offerDate: payload.offer_date || '',
      onboardDate: payload.onboard_date || '',
      expectedOnboardDate: payload.expected_onboard_date || '',
      feedbackDate: payload.feedback_date || '',
      currentSalary: payload.current_salary || '',
      expectedSalary: payload.expected_salary || '',
      status: payload.status,
      note: payload.note || '',
      file: null,
      platformId: '',
      recruiterId: payload.recruiter || '',
      jobId: '',
      targetedCompanyId: '',
      referenceId: '',
      platformName: payload.platform_name || '',
      recruiterName: payload.recruiter_name || '',
      targetedCompanyName: payload.targeted_company_name || '',
      referenceName: payload.reference_name || '',
      candidateLevelsName: payload.candidate_levels_name,
      jobCode: payload.job_code || '',
      project: payload.project || '',
    },
    error: null,
  };
}
