import axiosInstance from '@/config/axiosInstance';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface JobHCTracking {
  job_id: number;
  job_title: string;
  candidate_required: number;
  closed_count: number;
  open_count: number;
}

export interface ChartDateRangeParams {
  from?: string;
  to?: string;
}

export async function fetchHCByDepartmentApi(
  params: ChartDateRangeParams & { job_id?: number } = {}
): Promise<ChartDataPoint[]> {
  const response = await axiosInstance.get('/dashboard/hc-by-department', { params });
  return response.data.data || [];
}

export async function fetchHCByStatusAndMonthApi(
  status: string,
  params: ChartDateRangeParams = {}
): Promise<ChartDataPoint[]> {
  const response = await axiosInstance.get('/dashboard/hc-by-status-month', {
    params: { ...params, status },
  });
  return response.data.data || [];
}

export async function fetchHCByRecruiterApi(
  params: ChartDateRangeParams & { job_id?: number; department_id?: number } = {}
): Promise<ChartDataPoint[]> {
  const response = await axiosInstance.get('/dashboard/hc-by-recruiter', { params });
  return response.data.data || [];
}

export async function fetchHCByHrbpApi(
  params: ChartDateRangeParams & { job_id?: number; department_id?: number } = {}
): Promise<ChartDataPoint[]> {
  const response = await axiosInstance.get('/dashboard/hc-by-hrbp', { params });
  return response.data.data || [];
}

export async function fetchHCByMonthApi(
  params: ChartDateRangeParams & { department_id?: number } = {}
): Promise<ChartDataPoint[]> {
  const response = await axiosInstance.get('/dashboard/hc-by-month', { params });
  return response.data.data || [];
}

export async function fetchJobHCTrackingApi(params: { department_id?: number } = {}): Promise<JobHCTracking[]> {
  const response = await axiosInstance.get('/dashboard/job-hc-tracking', { params });
  return response.data.data || [];
}
