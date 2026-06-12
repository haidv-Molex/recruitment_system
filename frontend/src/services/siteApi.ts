import axiosInstance from '@/config/axiosInstance';
import type { siteModel } from '@/types/siteModel';
import type { PaginationMetadata } from '@/types/pagination';

export async function createSiteApi(code: string, name: string, description: string): Promise<siteModel> {
  const response = await axiosInstance.post('/site', {
    site_code: code,
    site_name: name,
    site_description: description,
  });
  return response.data.data!;
}

export async function searchSitesApi({
  page = 1,
  limit = 10,
  search = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<{ data: siteModel[]; pagination?: PaginationMetadata }> {
  const params: Record<string, any> = { page, limit };
  if (search.trim()) {
    params.search = search.trim();
  }

  const response = await axiosInstance.get('/site/search', { params });
  return {
    data: response.data.data || [],
    pagination: response.data.pagination as PaginationMetadata | undefined,
  };
}

export async function getSiteApi(id: number): Promise<siteModel> {
  const response = await axiosInstance.get('/site', { params: { id } });
  return response.data.data!;
}

export async function updateSiteApi(
  id: number,
  code: string,
  name: string,
  description: string
): Promise<siteModel> {
  const response = await axiosInstance.put(
    '/site',
    {
      site_code: code,
      site_name: name,
      site_description: description,
    },
    { params: { id } }
  );
  return response.data.data!;
}

export async function deleteSiteApi(id: number): Promise<void> {
  await axiosInstance.delete('/site', { params: { id } });
}
