import axiosInstance from '@/config/axiosInstance';
import type { accessOutputModel } from '@/types/accessModel';
import type { PaginationMetadata } from '@/types/pagination';

export async function fetchAccessListApi({
  page = 1,
  limit = 10,
  user_id,
  candidate_id,
  job_id,
}: {
  page?: number;
  limit?: number;
  user_id?: number;
  candidate_id?: number;
  job_id?: number;
} = {}): Promise<{ data: accessOutputModel[]; pagination?: PaginationMetadata }> {
  const params: Record<string, any> = { page, limit };
  if (user_id) params.user_id = user_id;
  if (candidate_id) params.candidate_id = candidate_id;
  if (job_id) params.job_id = job_id;

  const response = await axiosInstance.get('/access/search', { params });
  return {
    data: response.data.data || [],
    pagination: response.data.pagination as PaginationMetadata | undefined,
  };
}

export async function createAccessApi(body: {
  user_id: number;
  candidate_id?: number | null;
  job_id?: number | null;
}): Promise<accessOutputModel> {
  const response = await axiosInstance.post('/access', body);
  return response.data.data!;
}

export async function deleteAccessApi(idOrIds: number | number[]): Promise<void> {
  if (Array.isArray(idOrIds)) {
    await axiosInstance.delete('/access', { params: { ids: idOrIds.join(',') } });
  } else {
    await axiosInstance.delete('/access', { params: { id: idOrIds } });
  }
}
