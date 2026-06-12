import { describe, it, expect, vi } from 'vitest';
import axiosInstance from '@/config/axiosInstance';
import {
  getCompanyApi,
  searchCompaniesApi,
  createCompanyApi,
  updateCompanyApi,
  deleteCompanyApi,
} from '../companyApi';

vi.mock('@/config/axiosInstance', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe('companyApi tests', () => {
  it('getCompanyApi should call axiosInstance.get and return data', async () => {
    const mockCompany = { company_id: 1, company_name: 'Test Co' };
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({
      data: { result: true, data: mockCompany },
    });

    const result = await getCompanyApi(1);
    expect(axiosInstance.get).toHaveBeenCalledWith('/company', { params: { id: 1 } });
    expect(result).toEqual(mockCompany);
  });

  it('searchCompaniesApi should call axiosInstance.get and return list and pagination', async () => {
    const mockList = [{ company_id: 1, company_name: 'Test Co' }];
    const mockPagination = { current_page: 1, total_pages: 1, total_items: 1 };
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({
      data: { result: true, data: mockList, pagination: mockPagination },
    });

    const result = await searchCompaniesApi({ page: 1, limit: 10, search: 'Test' });
    expect(axiosInstance.get).toHaveBeenCalledWith('/company/search', {
      params: { page: 1, limit: 10, search: 'Test' },
    });
    expect(result).toEqual({ data: mockList, pagination: mockPagination });
  });

  it('createCompanyApi should call axiosInstance.post and return data', async () => {
    const mockCompany = { company_id: 1, company_name: 'New Co', company_description: 'Desc' };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { result: true, data: mockCompany },
    });

    const result = await createCompanyApi('New Co', 'Desc');
    expect(axiosInstance.post).toHaveBeenCalledWith('/company', {
      company_name: 'New Co',
      company_description: 'Desc',
    });
    expect(result).toEqual(mockCompany);
  });

  it('updateCompanyApi should call axiosInstance.put and return updated data', async () => {
    const mockCompany = { company_id: 1, company_name: 'Updated Co', company_description: 'Updated Desc' };
    vi.mocked(axiosInstance.put).mockResolvedValueOnce({
      data: { result: true, data: mockCompany },
    });

    const result = await updateCompanyApi(1, 'Updated Co', 'Updated Desc');
    expect(axiosInstance.put).toHaveBeenCalledWith(
      '/company',
      {
        company_name: 'Updated Co',
        company_description: 'Updated Desc',
      },
      { params: { id: 1 } }
    );
    expect(result).toEqual(mockCompany);
  });

  it('deleteCompanyApi should call axiosInstance.delete', async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: { result: true },
    });

    await deleteCompanyApi(1);
    expect(axiosInstance.delete).toHaveBeenCalledWith('/company', { params: { id: 1 } });
  });
});
