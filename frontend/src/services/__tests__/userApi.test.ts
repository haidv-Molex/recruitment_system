import { describe, it, expect, vi } from 'vitest';
import axiosInstance from '@/config/axiosInstance';
import {
  createHRApi,
  fetchUsersApi,
  getUserApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
  changeUserRoleApi,
} from '../userApi';

vi.mock('@/config/axiosInstance', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe('userApi tests', () => {
  it('createHRApi should call axiosInstance.post and return data', async () => {
    const mockUser = { user_id: 1, user_name: 'HR User', user_role: 'hr' };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { result: true, data: mockUser },
    });

    const params = { username: 'hr', account: 'hr_acc', password: 'password' };
    const result = await createHRApi(params);
    expect(axiosInstance.post).toHaveBeenCalledWith('/user/hr', params);
    expect(result).toEqual(mockUser);
  });

  it('fetchUsersApi should call axiosInstance.get and return list and pagination', async () => {
    const mockList = [{ user_id: 1, user_name: 'User 1', user_role: 'user' }];
    const mockPagination = { current_page: 1, total_pages: 1, total_items: 1 };
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({
      data: { result: true, data: mockList, pagination: mockPagination },
    });

    const result = await fetchUsersApi({ page: 1, limit: 100, search: 'Test' });
    expect(axiosInstance.get).toHaveBeenCalledWith('/user/search', {
      params: { page: 1, limit: 100, search: 'Test' },
    });
    expect(result).toEqual({ data: mockList, pagination: mockPagination });
  });

  it('getUserApi should call axiosInstance.get and return user', async () => {
    const mockUser = { user_id: 1, user_name: 'User 1' };
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({
      data: { result: true, data: mockUser },
    });

    const result = await getUserApi(1);
    expect(axiosInstance.get).toHaveBeenCalledWith('/user', { params: { id: 1 } });
    expect(result).toEqual(mockUser);
  });

  it('createUserApi should call axiosInstance.post and return user', async () => {
    const mockUser = { user_id: 1, user_name: 'User 1' };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { result: true, data: mockUser },
    });

    const params = { username: 'User 1', description: 'Desc' };
    const result = await createUserApi(params);
    expect(axiosInstance.post).toHaveBeenCalledWith('/user', params);
    expect(result).toEqual(mockUser);
  });

  it('updateUserApi should call axiosInstance.put and return updated user', async () => {
    const mockUser = { user_id: 1, user_name: 'Updated User' };
    vi.mocked(axiosInstance.put).mockResolvedValueOnce({
      data: { result: true, data: mockUser },
    });

    const params = { username: 'Updated User' };
    const result = await updateUserApi(1, params);
    expect(axiosInstance.put).toHaveBeenCalledWith('/user', params, { params: { id: 1 } });
    expect(result).toEqual(mockUser);
  });

  it('deleteUserApi should call axiosInstance.delete', async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: { result: true },
    });

    await deleteUserApi(1);
    expect(axiosInstance.delete).toHaveBeenCalledWith('/user', { params: { id: 1 } });
  });

  it('changeUserRoleApi should call axiosInstance.patch', async () => {
    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: { result: true },
    });

    await changeUserRoleApi(1, 'admin');
    expect(axiosInstance.patch).toHaveBeenCalledWith('/user/role', { role: 'admin' }, { params: { id: 1 } });
  });
});
