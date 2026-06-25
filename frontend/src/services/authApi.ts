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

export async function updateProfileApi(code: string, username: string, description: string): Promise<userOutputModel> {
  const response = await axiosInstance.put('/user/profile', {
    code,
    username,
    description,
  });
  return response.data.data!;
}

export async function refreshTokenApi(): Promise<string> {
  const response = await axiosInstance.post('/auth/token');
  const token = response.data.data?.accessToken;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export async function logoutApi(): Promise<void> {
  try {
    await axiosInstance.post('/auth/logout');
  } catch (error) {
    console.error('Failed to log out from server:', error);
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('recruitment_auth_user');
  }
}
