import axiosInstance from '@/config/axiosInstance';
import type { PaginationMetadata } from '@/types/pagination';
import type { OpenPositionRequest } from '@/types/openPositionRequest';

export async function fetchOpenPositionRequestsApi({
  page = 1,
  limit = 10,
  search = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<{ data: OpenPositionRequest[]; pagination?: PaginationMetadata }> {
  const params: Record<string, any> = { page, limit };
  if (search.trim()) {
    params.search = search.trim();
  }

  const response = await axiosInstance.get('/integrations/open-position-requests', { params });
  return {
    data: response.data.data || [],
    pagination: response.data.pagination as PaginationMetadata | undefined,
  };
}

export async function fetchOpenPositionRequestApi(id: number): Promise<OpenPositionRequest> {
  const response = await axiosInstance.get(`/integrations/open-position-requests/${id}`);
  return response.data.data!;
}
