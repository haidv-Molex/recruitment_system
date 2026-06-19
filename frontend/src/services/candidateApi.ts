import axiosInstance from '@/config/axiosInstance';
import type { candidateModel } from '@/types/candidateModel';
import type { PaginationMetadata } from '@/types/pagination';

export async function createCandidateApi(formData: any): Promise<candidateModel> {
  const fd = new FormData();

  // Required fields
  fd.append('candidate_name', formData.candidateName);
  fd.append('candidate_code', formData.candidateCode);

  // Optional text fields
  if (formData.candidateEmail) fd.append('candidate_email', formData.candidateEmail);
  if (formData.candidatePhone) fd.append('candidate_phone', formData.candidatePhone);
  if (formData.agency) fd.append('agency', formData.agency);
  if (formData.offerDate) fd.append('offer_date', formData.offerDate);
  if (formData.onboardDate) fd.append('onboard_date', formData.onboardDate);
  if (formData.expectedOnboardDate) fd.append('expected_onboard_date', formData.expectedOnboardDate);
  if (formData.feedbackDate) fd.append('feedback_date', formData.feedbackDate);
  if (formData.currentSalary) fd.append('current_salary', formData.currentSalary);
  if (formData.expectedSalary) fd.append('expected_salary', formData.expectedSalary);
  if (formData.status) fd.append('status', formData.status);
  if (formData.note) fd.append('note', formData.note);

  // FK fields
  if (formData.platformId) fd.append('platform_id', String(formData.platformId));
  if (formData.jobId) fd.append('job_id', String(formData.jobId));
  if (formData.targetedCompanyId) fd.append('targeted_company', String(formData.targetedCompanyId));
  if (formData.referenceId) fd.append('reference', String(formData.referenceId));
  if (formData.jobCode) fd.append('job_code', formData.jobCode);
  if (formData.project) fd.append('project', formData.project);

  // File upload
  if (formData.file) fd.append('file', formData.file);

  const response = await axiosInstance.post('/candidate', fd);
  return response.data.data!;
}

export async function searchCandidatesApi({
  page = 1,
  limit = 10,
  search = '',
  searchAt = '',
  status = '',
  offerDateFrom = '',
  offerDateTo = '',
  onboardDateFrom = '',
  onboardDateTo = '',
  expectedOnboardDateFrom = '',
  expectedOnboardDateTo = '',
  feedbackDateFrom = '',
  feedbackDateTo = '',
  candidateCode = '',
  candidateName = '',
  candidateEmail = '',
  candidatePhone = '',
  agency = '',
  note = '',
  summary = '',
  nationality = '',
  location = '',
  skills = '',
  languages = '',
  education = '',
  experienceYears = '',
  currentPosition = '',
  currentLevel = '',
  jobCode = '',
  currentSalary = '',
  lastCompany = '',
  workExperience = '',
  certifications = '',
  expectedPosition = '',
  expectedLevel = '',
  expectedSalary = '',
  expectedWorkLocation = '',
  salaryCurrency = '',
  project = '',
  platform = '',
  reference = '',
  company = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
  searchAt?: string;
  status?: string;
  offerDateFrom?: string;
  offerDateTo?: string;
  onboardDateFrom?: string;
  onboardDateTo?: string;
  expectedOnboardDateFrom?: string;
  expectedOnboardDateTo?: string;
  feedbackDateFrom?: string;
  feedbackDateTo?: string;
  candidateCode?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  agency?: string;
  note?: string;
  summary?: string;
  nationality?: string;
  location?: string;
  skills?: string;
  languages?: string;
  education?: string;
  experienceYears?: string;
  currentPosition?: string;
  currentLevel?: string;
  currentSalary?: string;
  lastCompany?: string;
  workExperience?: string;
  certifications?: string;
  expectedPosition?: string;
  expectedLevel?: string;
  expectedSalary?: string;
  expectedWorkLocation?: string;
  salaryCurrency?: string;
  jobCode?: string;
  project?: string;
  platform?: string;
  reference?: string;
  company?: string;
} = {}): Promise<{ data: candidateModel[]; pagination?: PaginationMetadata }> {
  const params: Record<string, any> = { page, limit };

  if (search.trim()) params.search = search.trim();
  if (searchAt) params.search_at = searchAt;
  if (status) params.status = status;

  if (offerDateFrom) params.offer_date_from = offerDateFrom;
  if (offerDateTo) params.offer_date_to = offerDateTo;
  if (onboardDateFrom) params.onboard_date_from = onboardDateFrom;
  if (onboardDateTo) params.onboard_date_to = onboardDateTo;
  if (expectedOnboardDateFrom) params.expected_onboard_date_from = expectedOnboardDateFrom;
  if (expectedOnboardDateTo) params.expected_onboard_date_to = expectedOnboardDateTo;
  if (feedbackDateFrom) params.feedback_date_from = feedbackDateFrom;
  if (feedbackDateTo) params.feedback_date_to = feedbackDateTo;

  if (candidateCode) params.candidate_code = candidateCode;
  if (candidateName) params.candidate_name = candidateName;
  if (candidateEmail) params.candidate_email = candidateEmail;
  if (candidatePhone) params.candidate_phone = candidatePhone;
  if (agency) params.agency = agency;
  if (note) params.note = note;
  if (summary) params.summary = summary;
  if (nationality) params.nationality = nationality;
  if (location) params.location = location;
  if (skills) params.skills = skills;
  if (languages) params.languages = languages;
  if (education) params.education = education;
  if (experienceYears) params.experience_years = experienceYears;
  if (currentPosition) params.current_position = currentPosition;
  if (currentLevel) params.current_level = currentLevel;
  if (currentSalary) params.current_salary = currentSalary;
  if (lastCompany) params.last_company = lastCompany;
  if (workExperience) params.work_experience = workExperience;
  if (certifications) params.certifications = certifications;
  if (expectedPosition) params.expected_position = expectedPosition;
  if (expectedLevel) params.expected_level = expectedLevel;
  if (expectedSalary) params.expected_salary = expectedSalary;
  if (expectedWorkLocation) params.expected_work_location = expectedWorkLocation;
  if (salaryCurrency) params.salary_currency = salaryCurrency;
  if (jobCode) params.job_code = jobCode;
  if (project) params.project = project;
  if (platform) params.platform = platform;
  if (reference) params.reference = reference;
  if (company) params.company = company;

  const response = await axiosInstance.get('/candidate/search', { params });
  return {
    data: response.data.data || [],
    pagination: response.data.pagination as PaginationMetadata | undefined,
  };
}

export async function getCandidateApi(id: number): Promise<candidateModel> {
  const response = await axiosInstance.get('/candidate', { params: { id } });
  return response.data.data!;
}

export async function deleteCandidateApi(id: number | number[]): Promise<void> {
  if (Array.isArray(id)) {
    await axiosInstance.delete('/candidate', { params: { ids: id.join(',') } });
  } else {
    await axiosInstance.delete('/candidate', { params: { id } });
  }
}

export async function createCandidateExtendedApi(formData: any): Promise<candidateModel> {
  const fd = new FormData();

  // Required fields
  fd.append('candidate_name', formData.candidateName);
  fd.append('candidate_code', formData.candidateCode);

  // Optional text fields
  if (formData.candidateEmail) fd.append('candidate_email', formData.candidateEmail);
  if (formData.candidatePhone) fd.append('candidate_phone', formData.candidatePhone);
  if (formData.agency) fd.append('agency', formData.agency);
  if (formData.offerDate) fd.append('offer_date', formData.offerDate);
  if (formData.onboardDate) fd.append('onboard_date', formData.onboardDate);
  if (formData.expectedOnboardDate) fd.append('expected_onboard_date', formData.expectedOnboardDate);
  if (formData.feedbackDate) fd.append('feedback_date', formData.feedbackDate);
  if (formData.currentSalary) fd.append('current_salary', formData.currentSalary);
  if (formData.expectedSalary) fd.append('expected_salary', formData.expectedSalary);
  if (formData.status) fd.append('status', formData.status);
  if (formData.note) fd.append('note', formData.note);

  // FK by ID
  if (formData.platformId) fd.append('platform_id', String(formData.platformId));
  if (formData.jobId) fd.append('job_id', String(formData.jobId));
  if (formData.targetedCompanyId) fd.append('targeted_company', String(formData.targetedCompanyId));
  if (formData.referenceId) fd.append('reference', String(formData.referenceId));

  // FK by Name
  if (formData.platformName) fd.append('platform_name', formData.platformName);
  if (formData.targetedCompanyName) fd.append('targeted_company_name', formData.targetedCompanyName);
  if (formData.referenceName) fd.append('reference_name', formData.referenceName);
  if (formData.candidateLevelsName?.length) fd.append('candidate_levels_name', JSON.stringify(formData.candidateLevelsName));
  if (formData.jobCode) fd.append('job_code', formData.jobCode);
  if (formData.project) fd.append('project', formData.project);

  // File upload
  if (formData.file) fd.append('file', formData.file);

  const response = await axiosInstance.post('/candidate/extended', fd);
  return response.data.data!;
}

export async function updateCandidateApi(id: number, formData: any): Promise<candidateModel> {
  const fd = new FormData();
  const appendIfPresent = (field: string, value: any) => {
    if (Object.prototype.hasOwnProperty.call(formData, value)) {
      fd.append(field, formData[value] === null || formData[value] === undefined ? 'null' : String(formData[value]));
    }
  };

  // Text fields
  fd.append('candidate_name', formData.candidateName);
  fd.append('candidate_code', formData.candidateCode);
  appendIfPresent('candidate_email', 'candidateEmail');
  appendIfPresent('candidate_phone', 'candidatePhone');
  appendIfPresent('agency', 'agency');
  appendIfPresent('offer_date', 'offerDate');
  appendIfPresent('onboard_date', 'onboardDate');
  appendIfPresent('expected_onboard_date', 'expectedOnboardDate');
  appendIfPresent('feedback_date', 'feedbackDate');
  appendIfPresent('current_salary', 'currentSalary');
  appendIfPresent('expected_salary', 'expectedSalary');
  appendIfPresent('status', 'status');
  appendIfPresent('note', 'note');

  // FK fields
  appendIfPresent('platform_id', 'platformId');
  appendIfPresent('job_id', 'jobId');
  appendIfPresent('targeted_company', 'targetedCompanyId');

  if (formData.referenceId) {
    fd.append('reference', String(formData.referenceId));
  } else {
    fd.append('reference', 'null');
  }

  // File upload
  if (formData.file) fd.append('file', formData.file);

  const response = await axiosInstance.put('/candidate', fd, { params: { id } });
  return response.data.data!;
}

export async function fetchAgenciesApi(): Promise<string[]> {
  const response = await axiosInstance.get('/candidate/agencies');
  return response.data.data || [];
}

export async function fetchStatusesApi(): Promise<string[]> {
  const response = await axiosInstance.get('/candidate/statuses');
  return response.data.data || [];
}

export async function parseCandidateSheetApi(file: File): Promise<any[]> {
  const fd = new FormData();
  fd.append('file', file);

  const response = await axiosInstance.post('/file/parse-candidate-sheet', fd);
  return response.data.data || [];
}

export async function downloadValidationSheetApi(): Promise<void> {
  const response = await axiosInstance.get('/file/validation-sheet', {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'validation-sheet.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadDatabaseSheetApi(): Promise<void> {
  const response = await axiosInstance.get('/file/database-sheet', {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'database-sheet.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function batchImportCandidatesApi(candidates: any[]): Promise<any> {
  const response = await axiosInstance.post('/candidate/batch', { candidates });
  return response.data.data;
}

export async function parseCVApi(file: File): Promise<any> {
  const fd = new FormData();
  fd.append('file', file);
  const response = await axiosInstance.post('/file/parse-cv', fd);
  return response.data.data;
}

