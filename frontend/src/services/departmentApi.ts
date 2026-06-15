import axiosInstance from '@/config/axiosInstance';
import type { departmentModel } from '@/types/departmentModel';
import type { PaginationMetadata } from '@/types/pagination';

export async function createDepartmentApi(code: string, name: string, description: string): Promise<departmentModel> {
  const response = await axiosInstance.post('/department', {
    department_code: code,
    department_name: name,
    department_description: description,
  });
  return response.data.data!;
}

export async function searchDepartmentsApi({
  page = 1,
  limit = 10,
  search = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<{ data: departmentModel[]; pagination?: PaginationMetadata }> {
  const params: Record<string, any> = { page, limit };
  if (search.trim()) {
    params.search = search.trim();
  }

  const response = await axiosInstance.get('/department/search', { params });
  return {
    data: response.data.data || [],
    pagination: response.data.pagination as PaginationMetadata | undefined,
  };
}

export async function getDepartmentApi(id: number): Promise<departmentModel> {
  const response = await axiosInstance.get('/department', { params: { id } });
  return response.data.data!;
}

export async function updateDepartmentApi(
  id: number,
  code: string,
  name: string,
  description: string
): Promise<departmentModel> {
  const response = await axiosInstance.put(
    '/department',
    {
      department_code: code,
      department_name: name,
      department_description: description,
    },
    { params: { id } }
  );
  return response.data.data!;
}

export async function deleteDepartmentApi(idOrIds: number | number[]): Promise<void> {
  const params: Record<string, any> = {};
  if (Array.isArray(idOrIds)) {
    params.ids = idOrIds.join(',');
  } else {
    params.id = idOrIds;
  }
  await axiosInstance.delete('/department', { params });
}
