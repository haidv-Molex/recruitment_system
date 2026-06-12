import axiosInstance from '@/config/axiosInstance';
import type { companyModel } from '@/types/companyModel';
import type { PaginationMetadata } from '@/types/pagination';

export async function getCompanyApi(id: number): Promise<companyModel> {
  const response = await axiosInstance.get('/company', { params: { id } });
  return response.data.data!;
}

export async function searchCompaniesApi({
  page = 1,
  limit = 10,
  search = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<{ data: companyModel[]; pagination?: PaginationMetadata }> {
  const params: Record<string, any> = { page, limit };
  if (search.trim()) {
    params.search = search.trim();
  }

  const response = await axiosInstance.get('/company/search', { params });
  return {
    data: response.data.data || [],
    pagination: response.data.pagination as PaginationMetadata | undefined,
  };
}

export async function createCompanyApi(name: string, description: string): Promise<companyModel> {
  const response = await axiosInstance.post('/company', {
    company_name: name,
    company_description: description,
  });
  return response.data.data!;
}

export async function updateCompanyApi(id: number, name: string, description: string): Promise<companyModel> {
  const response = await axiosInstance.put(
    '/company',
    {
      company_name: name,
      company_description: description,
    },
    { params: { id } }
  );
  return response.data.data!;
}

export async function deleteCompanyApi(id: number): Promise<void> {
  await axiosInstance.delete('/company', { params: { id } });
}
