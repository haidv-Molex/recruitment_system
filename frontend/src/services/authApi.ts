import axiosInstance from '@/config/axiosInstance';
import type { userOutputModel } from '@/types/userModel';

const TOKEN_KEY = 'authToken';

export async function loginApi(account: string, password: string): Promise<userOutputModel & { accessToken: string }> {
  const response = await axiosInstance.post('/auth/login', { account, password });
  const data = response.data.data;
  if (data?.accessToken) {
    localStorage.setItem(TOKEN_KEY, data.accessToken);
  }
  return data!;
}

export async function changePasswordApi(oldPassword: string, newPassword: string): Promise<void> {
  await axiosInstance.post('/auth/change-password', {
    oldPassword,
    newPassword,
  });
}

export async function updateProfileApi(username: string, description: string): Promise<userOutputModel> {
  const response = await axiosInstance.put('/user/profile', {
    username,
    description,
  });
  return response.data.data!;
}

export function logoutApi(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('recruitment_auth_user');
}
