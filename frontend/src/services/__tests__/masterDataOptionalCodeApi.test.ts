import { beforeEach, describe, expect, it, vi } from 'vitest';
import axiosInstance from '@/config/axiosInstance';
import { createLevelApi } from '../levelApi';
import { createSiteApi } from '../siteApi';

vi.mock('@/config/axiosInstance', () => {
  return {
    default: {
      post: vi.fn(),
    },
  };
});

describe('master data optional code API tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createLevelApi should allow omitted code via undefined', async () => {
    const mockLevel = { level_id: 1, level_name: 'Engineer' };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { result: true, data: mockLevel },
    });

    const result = await createLevelApi(undefined, 'Engineer', '');

    expect(axiosInstance.post).toHaveBeenCalledWith('/level', {
      level_code: '',
      level_name: 'Engineer',
      level_description: '',
    });
    expect(result).toEqual(mockLevel);
  });

  it('createSiteApi should allow omitted code via undefined', async () => {
    const mockSite = { site_id: 1, site_name: 'MXV' };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { result: true, data: mockSite },
    });

    const result = await createSiteApi(undefined, 'MXV', '');

    expect(axiosInstance.post).toHaveBeenCalledWith('/site', {
      site_code: '',
      site_name: 'MXV',
      site_description: '',
    });
    expect(result).toEqual(mockSite);
  });
});
