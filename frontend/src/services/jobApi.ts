import axiosInstance from '@/config/axiosInstance';
import type { jobOutputModel } from '@/types/jobModel';
import type { PaginationMetadata } from '@/types/pagination';

export async function createJobApi(formData: any): Promise<jobOutputModel> {
  const fd = new FormData();
  if (formData.job_code?.trim()) {
    fd.append('job_code', formData.job_code.trim());
  }
  if (Object.prototype.hasOwnProperty.call(formData, 'project')) {
    fd.append('project', formData.project == null || formData.project.trim() === '' ? 'null' : formData.project.trim());
  }

  if (formData.note) {
    fd.append('note', formData.note);
  }
  if (formData.request_date) {
    fd.append('request_date', formData.request_date);
  }
  if (formData.recruiter_id) {
    fd.append('recruiter_id', String(formData.recruiter_id));
  }
  if (formData.file) {
    fd.append('file', formData.file);
  }
  if (formData.departments?.length) fd.append('departments', JSON.stringify(formData.departments));
  if (formData.sites?.length) fd.append('sites', JSON.stringify(formData.sites));
  if (formData.titles?.length) fd.append('titles', JSON.stringify(formData.titles));
  if (formData.managers?.length) fd.append('managers', JSON.stringify(formData.managers));
  if (formData.employee_levels?.length) fd.append('employee_levels', JSON.stringify(formData.employee_levels));

  const response = await axiosInstance.post('/job', fd);
  return response.data.data!;
}

export interface JobSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  job_code?: string;
  project?: string;
  department?: string;
  site?: string;
  job_title?: string;
  ee_level?: string;
  manager?: string;
  partner?: string;
  recruiter?: string;
  note?: string;
  request_date_from?: string;
  request_date_to?: string;
}

export async function searchJobsApi({
  page = 1,
  limit = 10,
  search = '',
  ...filters
}: JobSearchParams = {}): Promise<{ data: jobOutputModel[]; pagination?: PaginationMetadata }> {
  const params: Record<string, any> = { page, limit };
  if (search.trim()) params.search = search.trim();
  // Append per-field filters
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== '') params[key] = val;
  });

  const response = await axiosInstance.get('/job/search', { params });
  return {
    data: response.data.data || [],
    pagination: response.data.pagination as PaginationMetadata | undefined,
  };
}

export async function getJobApi(id: number): Promise<jobOutputModel> {
  const response = await axiosInstance.get('/job', { params: { id } });
  return response.data.data!;
}

export async function deleteJobApi(idOrIds: number | number[]): Promise<void> {
  if (Array.isArray(idOrIds)) {
    await axiosInstance.delete('/job', { params: { ids: idOrIds.join(',') } });
  } else {
    await axiosInstance.delete('/job', { params: { id: idOrIds } });
  }
}

export async function updateJobApi(id: number, formData: any): Promise<jobOutputModel> {
  const fd = new FormData();
  if (formData.job_code?.trim()) fd.append('job_code', formData.job_code.trim());
  if (Object.prototype.hasOwnProperty.call(formData, 'project')) {
    fd.append('project', formData.project == null || formData.project.trim() === '' ? 'null' : formData.project.trim());
  }

  if (formData.note) fd.append('note', formData.note);
  if (formData.request_date) fd.append('request_date', formData.request_date);
  if (Object.prototype.hasOwnProperty.call(formData, 'recruiter_id')) {
    fd.append('recruiter_id', formData.recruiter_id == null ? 'null' : String(formData.recruiter_id));
  }
  if (formData.recruiter_name) fd.append('recruiter_name', formData.recruiter_name);
  if (formData.file) fd.append('file', formData.file);

  if (formData.departments?.length) fd.append('departments', JSON.stringify(formData.departments));
  if (formData.sites?.length) fd.append('sites', JSON.stringify(formData.sites));
  if (formData.titles?.length) fd.append('titles', JSON.stringify(formData.titles));
  if (formData.managers?.length) fd.append('managers', JSON.stringify(formData.managers));
  if (formData.employee_levels?.length) fd.append('employee_levels', JSON.stringify(formData.employee_levels));

  if (formData.departments_name?.length) fd.append('departments_name', JSON.stringify(formData.departments_name));
  if (formData.sites_name?.length) fd.append('sites_name', JSON.stringify(formData.sites_name));
  if (formData.titles_name?.length) fd.append('titles_name', JSON.stringify(formData.titles_name));
  if (formData.managers_name?.length) fd.append('managers_name', JSON.stringify(formData.managers_name));
  if (formData.employee_levels_name?.length) fd.append('employee_levels_name', JSON.stringify(formData.employee_levels_name));

  if (formData.notes) {
    fd.append('notes', JSON.stringify(formData.notes));
  }

  const response = await axiosInstance.put('/job', fd, { params: { id } });
  return response.data.data!;
}

export async function parseJobSheetApi(file: File): Promise<any[]> {
  const fd = new FormData();
  fd.append('file', file);

  const response = await axiosInstance.post('/file/parse-job-sheet', fd);
  return response.data.data || [];
}

export async function createJobExtendedApi(formData: any): Promise<jobOutputModel> {
  const fd = new FormData();
  if (formData.job_code?.trim()) {
    fd.append('job_code', formData.job_code.trim());
  }
  if (Object.prototype.hasOwnProperty.call(formData, 'project')) {
    fd.append('project', formData.project == null || formData.project.trim() === '' ? 'null' : formData.project.trim());
  }

  if (formData.note) fd.append('note', formData.note);
  if (formData.request_date) fd.append('request_date', formData.request_date);
  if (formData.recruiter_id) fd.append('recruiter_id', String(formData.recruiter_id));
  if (formData.recruiter_name) fd.append('recruiter_name', formData.recruiter_name);
  if (formData.file) fd.append('file', formData.file);

  if (formData.partners?.length) fd.append('partners', JSON.stringify(formData.partners));
  if (formData.departments?.length) fd.append('departments', JSON.stringify(formData.departments));
  if (formData.sites?.length) fd.append('sites', JSON.stringify(formData.sites));
  if (formData.titles?.length) fd.append('titles', JSON.stringify(formData.titles));
  if (formData.managers?.length) fd.append('managers', JSON.stringify(formData.managers));
  if (formData.employee_levels?.length) fd.append('employee_levels', JSON.stringify(formData.employee_levels));

  if (formData.partners_name?.length) fd.append('partners_name', JSON.stringify(formData.partners_name));
  if (formData.managers_name?.length) fd.append('managers_name', JSON.stringify(formData.managers_name));
  if (formData.departments_name?.length) fd.append('departments_name', JSON.stringify(formData.departments_name));
  if (formData.sites_name?.length) fd.append('sites_name', JSON.stringify(formData.sites_name));
  if (formData.titles_name?.length) fd.append('titles_name', JSON.stringify(formData.titles_name));
  if (formData.employee_levels_name?.length) fd.append('employee_levels_name', JSON.stringify(formData.employee_levels_name));

  const response = await axiosInstance.post('/job/extended', fd);
  return response.data.data!;
}

export interface BatchImportResult {
  success: boolean;
  importedCount: number;
  errors: Array<{ job_code: string; message: string }>;
}

const BATCH_IMPORT_CHUNK_SIZE = 10;

export async function batchImportJobsApi(
  jobs: any[],
  onProgress?: (processedCount: number) => void
): Promise<BatchImportResult> {
  const chunkSize = BATCH_IMPORT_CHUNK_SIZE;
  let totalImportedCount = 0;
  let aggregatedErrors: any[] = [];
  let overallSuccess = true;

  if (jobs.length === 0) {
    return {
      success: true,
      importedCount: 0,
      errors: [],
    };
  }

  for (let i = 0; i < jobs.length; i += chunkSize) {
    const chunk = jobs.slice(i, i + chunkSize);
    const response = await axiosInstance.post('/job/batch', { jobs: chunk });
    const resultData = response.data.data;
    totalImportedCount += resultData.importedCount;
    if (resultData.errors && resultData.errors.length > 0) {
      aggregatedErrors = aggregatedErrors.concat(resultData.errors);
    }
    if (!resultData.success) {
      overallSuccess = false;
    }
    onProgress?.(Math.min(i + chunk.length, jobs.length));
  }

  return {
    success: overallSuccess,
    importedCount: totalImportedCount,
    errors: aggregatedErrors,
  };
}

export async function downloadIdlTrackingSheetApi(): Promise<void> {
  const response = await axiosInstance.get('/file/idl-tracking-sheet', {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'idl-tracking-sheet.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadFullWorkbookApi(): Promise<void> {
  const response = await axiosInstance.get('/file/full-workbook', {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'full-workbook.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
