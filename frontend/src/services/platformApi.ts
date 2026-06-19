import axiosInstance from '@/config/axiosInstance';
import type { platformModel } from '@/types/platformModel';
import type { PaginationMetadata } from '@/types/pagination';

export async function createPlatformApi(code: string, name: string, description: string): Promise<platformModel> {
  const response = await axiosInstance.post('/platform', {
    platform_code: code,
    platform_name: name,
    platform_description: description,
  });
  return response.data.data!;
}

export async function searchPlatformsApi({
  page = 1,
  limit = 10,
  search = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<{ data: platformModel[]; pagination?: PaginationMetadata }> {
  const params: Record<string, any> = { page, limit };
  if (search.trim()) {
    params.search = search.trim();
  }

  const response = await axiosInstance.get('/platform/search', { params });
  return {
    data: response.data.data || [],
    pagination: response.data.pagination as PaginationMetadata | undefined,
  };
}

export async function getPlatformApi(id: number): Promise<platformModel> {
  const response = await axiosInstance.get('/platform', { params: { id } });
  return response.data.data!;
}

export async function updatePlatformApi(id: number, code: string, name: string, description: string): Promise<platformModel> {
  const response = await axiosInstance.put(
    '/platform',
    {
      platform_code: code,
      platform_name: name,
      platform_description: description,
    },
    { params: { id } }
  );
  return response.data.data!;
}

export async function deletePlatformApi(idOrIds: number | number[]): Promise<void> {
  const params: Record<string, any> = {};
  if (Array.isArray(idOrIds)) {
    params.ids = idOrIds.join(',');
  } else {
    params.id = idOrIds;
  }
  await axiosInstance.delete('/platform', { params });
}
