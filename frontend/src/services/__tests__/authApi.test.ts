import { describe, it, expect, vi, beforeEach } from 'vitest';
import axiosInstance from '@/config/axiosInstance';
import {
  loginApi,
  changePasswordApi,
  updateProfileApi,
  logoutApi,
} from '../authApi';

vi.mock('@/config/axiosInstance', () => {
  return {
    default: {
      post: vi.fn(),
      put: vi.fn(),
    },
  };
});

describe('authApi tests', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { for (const k in store) delete store[k]; },
    });
  });

  it('loginApi should call axiosInstance.post, store token, and return user details', async () => {
    const mockResponse = {
      user_id: 1,
      user_name: 'Admin',
      user_role: 'admin',
      accessToken: 'test-token',
    };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { result: true, data: mockResponse },
    });

    const result = await loginApi('admin', 'password');
    expect(axiosInstance.post).toHaveBeenCalledWith('/auth/login', { account: 'admin', password: 'password' });
    expect(localStorage.getItem('authToken')).toBe('test-token');
    expect(result).toEqual(mockResponse);
  });

  it('changePasswordApi should call axiosInstance.post', async () => {
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { result: true },
    });

    await changePasswordApi('old', 'new');
    expect(axiosInstance.post).toHaveBeenCalledWith('/auth/change-password', { oldPassword: 'old', newPassword: 'new' });
  });

  it('updateProfileApi should call axiosInstance.put and return updated user', async () => {
    const mockUser = { user_id: 1, user_name: 'New Name' };
    vi.mocked(axiosInstance.put).mockResolvedValueOnce({
      data: { result: true, data: mockUser },
    });

    const result = await updateProfileApi('New Name', 'New Description');
    expect(axiosInstance.put).toHaveBeenCalledWith('/user/profile', { username: 'New Name', description: 'New Description' });
    expect(result).toEqual(mockUser);
  });

  it('logoutApi should clear token and user details from localStorage', () => {
    localStorage.setItem('authToken', 'token');
    localStorage.setItem('recruitment_auth_user', 'user');

    logoutApi();

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('recruitment_auth_user')).toBeNull();
  });
});
