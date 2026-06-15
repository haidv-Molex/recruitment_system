import axiosInstance from '@/config/axiosInstance';
import type { userOutputModel } from '@/types/userModel';
import type { PaginationMetadata } from '@/types/pagination';

export async function createHRApi(body: {
  username: string;
  account: string;
  password?: string;
  description?: string;
  departmentId?: number;
}): Promise<userOutputModel> {
  const response = await axiosInstance.post('/user/hr', body);
  return response.data.data!;
}

export async function fetchUsersApi({
  page = 1,
  limit = 100,
  search = '',
  role = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
} = {}): Promise<{ data: userOutputModel[]; pagination?: PaginationMetadata }> {
  const params: Record<string, any> = { page, limit };
  if (search.trim()) {
    params.search = search.trim();
  }
  if (role.trim()) {
    params.role = role.trim();
  }

  const response = await axiosInstance.get('/user/search', { params });
  return {
    data: response.data.data || [],
    pagination: response.data.pagination as PaginationMetadata | undefined,
  };
}

export async function fetchRolesApi(): Promise<string[]> {
  const response = await axiosInstance.get('/user/roles');
  return response.data.data || [];
}

export async function getUserApi(id: number): Promise<userOutputModel> {
  const response = await axiosInstance.get('/user', { params: { id } });
  return response.data.data!;
}

export async function createUserApi(body: {
  username: string;
  description?: string;
  departmentId?: number;
}): Promise<userOutputModel> {
  const response = await axiosInstance.post('/user', body);
  return response.data.data!;
}

export async function updateUserApi(
  id: number,
  body: {
    username?: string;
    description?: string;
    departmentId?: number;
  }
): Promise<userOutputModel> {
  const response = await axiosInstance.put('/user', body, { params: { id } });
  return response.data.data!;
}

export async function deleteUserApi(id: number): Promise<void> {
  await axiosInstance.delete('/user', { params: { id } });
}

export async function changeUserRoleApi(id: number, role: string): Promise<void> {
  await axiosInstance.patch('/user/role', { role }, { params: { id } });
}
