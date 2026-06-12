import axiosInstance from '@/config/axiosInstance';
import type { jobOutputModel } from '@/types/jobModel';
import type { PaginationMetadata } from '@/types/pagination';

export async function createJobApi(formData: any): Promise<jobOutputModel> {
  const fd = new FormData();
  fd.append('job_code', formData.job_code);
  fd.append('project', formData.project);
  fd.append('candidate_required', String(formData.candidate_required));

  if (formData.note) {
    fd.append('note', formData.note);
  }
  if (formData.request_date) {
    fd.append('request_date', formData.request_date);
  }
  if (formData.file) {
    fd.append('file', formData.file);
  }
  if (formData.partners?.length) {
    formData.partners.forEach((id: number) => fd.append('partners', String(id)));
  }
  if (formData.departments?.length) {
    formData.departments.forEach((id: number) => fd.append('departments', String(id)));
  }
  if (formData.segments?.length) {
    formData.segments.forEach((id: number) => fd.append('segments', String(id)));
  }
  if (formData.sites?.length) {
    formData.sites.forEach((id: number) => fd.append('sites', String(id)));
  }
  if (formData.titles?.length) {
    formData.titles.forEach((id: number) => fd.append('titles', String(id)));
  }
  if (formData.managers?.length) {
    formData.managers.forEach((id: number) => fd.append('managers', String(id)));
  }
  if (formData.employee_levels?.length) {
    formData.employee_levels.forEach((id: number) => fd.append('employee_levels', String(id)));
  }

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
  segment?: string;
  site?: string;
  job_title?: string;
  ee_level?: string;
  manager?: string;
  partner?: string;
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
  fd.append('job_code', formData.job_code);
  fd.append('project', formData.project);
  fd.append('candidate_required', String(formData.candidate_required));

  if (formData.note) fd.append('note', formData.note);
  if (formData.request_date) fd.append('request_date', formData.request_date);
  if (formData.file) fd.append('file', formData.file);

  if (formData.partners?.length) fd.append('partners', JSON.stringify(formData.partners));
  if (formData.departments?.length) fd.append('departments', JSON.stringify(formData.departments));
  if (formData.segments?.length) fd.append('segments', JSON.stringify(formData.segments));
  if (formData.sites?.length) fd.append('sites', JSON.stringify(formData.sites));
  if (formData.titles?.length) fd.append('titles', JSON.stringify(formData.titles));
  if (formData.managers?.length) fd.append('managers', JSON.stringify(formData.managers));
  if (formData.employee_levels?.length) fd.append('employee_levels', JSON.stringify(formData.employee_levels));

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
  fd.append('job_code', formData.job_code);
  fd.append('project', formData.project);
  fd.append('candidate_required', String(formData.candidate_required));

  if (formData.note) fd.append('note', formData.note);
  if (formData.request_date) fd.append('request_date', formData.request_date);
  if (formData.file) fd.append('file', formData.file);

  if (formData.partners?.length) fd.append('partners', JSON.stringify(formData.partners));
  if (formData.departments?.length) fd.append('departments', JSON.stringify(formData.departments));
  if (formData.segments?.length) fd.append('segments', JSON.stringify(formData.segments));
  if (formData.sites?.length) fd.append('sites', JSON.stringify(formData.sites));
  if (formData.titles?.length) fd.append('titles', JSON.stringify(formData.titles));
  if (formData.managers?.length) fd.append('managers', JSON.stringify(formData.managers));
  if (formData.employee_levels?.length) fd.append('employee_levels', JSON.stringify(formData.employee_levels));

  if (formData.partnersName?.length) fd.append('partners_name', JSON.stringify(formData.partnersName));
  if (formData.managersName?.length) fd.append('managers_name', JSON.stringify(formData.managersName));
  if (formData.departmentsName?.length) fd.append('departments_name', JSON.stringify(formData.departmentsName));
  if (formData.segmentsName?.length) fd.append('segments_name', JSON.stringify(formData.segmentsName));
  if (formData.sitesName?.length) fd.append('sites_name', JSON.stringify(formData.sitesName));
  if (formData.titlesName?.length) fd.append('titles_name', JSON.stringify(formData.titlesName));
  if (formData.employeeLevelsName?.length) fd.append('employee_levels_name', JSON.stringify(formData.employeeLevelsName));

  const response = await axiosInstance.post('/job/extended', fd);
  return response.data.data!;
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
