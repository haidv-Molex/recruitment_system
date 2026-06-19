import axiosInstance from '@/config/axiosInstance';
import type { segmentModel } from '@/types/segmentModel';
import type { PaginationMetadata } from '@/types/pagination';

export async function createSegmentApi(code: string = '', name: string, description: string = ''): Promise<segmentModel> {
  const response = await axiosInstance.post('/segment', {
    segment_code: code,
    segment_name: name,
    segment_description: description,
  });
  return response.data.data!;
}

export async function searchSegmentsApi({
  page = 1,
  limit = 10,
  search = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<{ data: segmentModel[]; pagination?: PaginationMetadata }> {
  const params: Record<string, any> = { page, limit };
  if (search.trim()) {
    params.search = search.trim();
  }

  const response = await axiosInstance.get('/segment/search', { params });
  return {
    data: response.data.data || [],
    pagination: response.data.pagination as PaginationMetadata | undefined,
  };
}

export async function getSegmentApi(id: number): Promise<segmentModel> {
  const response = await axiosInstance.get('/segment', { params: { id } });
  return response.data.data!;
}

export async function updateSegmentApi(
  id: number,
  code: string,
  name: string,
  description: string
): Promise<segmentModel> {
  const response = await axiosInstance.put(
    '/segment',
    {
      segment_code: code,
      segment_name: name,
      segment_description: description,
    },
    { params: { id } }
  );
  return response.data.data!;
}

export async function deleteSegmentApi(idOrIds: number | number[]): Promise<void> {
  const params: Record<string, any> = {};
  if (Array.isArray(idOrIds)) {
    params.ids = idOrIds.join(',');
  } else {
    params.id = idOrIds;
  }
  await axiosInstance.delete('/segment', { params });
}
