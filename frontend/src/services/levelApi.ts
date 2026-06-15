import axiosInstance from '@/config/axiosInstance';
import type { levelModel } from '@/types/levelModel';
import type { PaginationMetadata } from '@/types/pagination';

export async function createLevelApi(code: string, name: string, description: string): Promise<levelModel> {
  const response = await axiosInstance.post('/level', {
    level_code: code,
    level_name: name,
    level_description: description,
  });
  return response.data.data!;
}

export async function searchLevelsApi({
  page = 1,
  limit = 10,
  search = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<{ data: levelModel[]; pagination?: PaginationMetadata }> {
  const params: Record<string, any> = { page, limit };
  if (search.trim()) {
    params.search = search.trim();
  }

  const response = await axiosInstance.get('/level/search', { params });
  return {
    data: response.data.data || [],
    pagination: response.data.pagination as PaginationMetadata | undefined,
  };
}

export async function getLevelApi(id: number): Promise<levelModel> {
  const response = await axiosInstance.get('/level', { params: { id } });
  return response.data.data!;
}

export async function updateLevelApi(
  id: number,
  code: string,
  name: string,
  description: string
): Promise<levelModel> {
  const response = await axiosInstance.put(
    '/level',
    {
      level_code: code,
      level_name: name,
      level_description: description,
    },
    { params: { id } }
  );
  return response.data.data!;
}

export async function deleteLevelApi(idOrIds: number | number[]): Promise<void> {
  const params: Record<string, any> = {};
  if (Array.isArray(idOrIds)) {
    params.ids = idOrIds.join(',');
  } else {
    params.id = idOrIds;
  }
  await axiosInstance.delete('/level', { params });
}
