import { beforeEach, describe, expect, it, vi } from 'vitest';
import axiosInstance from '@/config/axiosInstance';
import {
  batchImportJobsApi,
  createJobApi,
  createJobExtendedApi,
  updateJobApi,
} from '../jobApi';

vi.mock('@/config/axiosInstance', () => {
  return {
    default: {
      post: vi.fn(),
      put: vi.fn(),
    },
  };
});

function formDataEntries(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(Array.from(formData.entries()));
}

describe('jobApi contract tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createJobApi should not send unsupported partner fields to POST /job', async () => {
    const mockJob = { job_id: 1, job_code: 'J001', project: 'Project A' };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { result: true, data: mockJob },
    });

    const result = await createJobApi({
      job_code: 'J001',
      project: 'Project A',
      partners: [1, 2],
      departments: [{ department_id: 3, candidate_required: 2 }],
    });

    expect(axiosInstance.post).toHaveBeenCalledWith('/job', expect.any(FormData));
    const formData = vi.mocked(axiosInstance.post).mock.calls[0][1] as FormData;
    const entries = formDataEntries(formData);

    expect(entries.job_code).toBe('J001');
    expect(entries.project).toBe('Project A');
    expect(entries.partners).toBeUndefined();
    expect(entries.departments).toBe(JSON.stringify([{ department_id: 3, candidate_required: 2 }]));
    expect(result).toEqual(mockJob);
  });

  it('createJobExtendedApi should omit blank job_code and send recruiter_name', async () => {
    const mockJob = { job_id: 7, job_code: 'J007', project: 'Project Auto' };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { result: true, data: mockJob },
    });

    await createJobExtendedApi({
      job_code: '',
      project: 'Project Auto',
      recruiter_id: null,
      recruiter_name: 'New Recruiter',
    });

    expect(axiosInstance.post).toHaveBeenCalledWith('/job/extended', expect.any(FormData));
    const formData = vi.mocked(axiosInstance.post).mock.calls[0][1] as FormData;
    const entries = formDataEntries(formData);

    expect(entries.job_code).toBeUndefined();
    expect(entries.project).toBe('Project Auto');
    expect(entries.recruiter_name).toBe('New Recruiter');
  });

  it('updateJobApi should not send unsupported partners or partners_name to PUT /job', async () => {
    const mockJob = { job_id: 1, job_code: 'J001', project: 'Project A' };
    vi.mocked(axiosInstance.put).mockResolvedValueOnce({
      data: { result: true, data: mockJob },
    });

    const result = await updateJobApi(1, {
      job_code: 'J001',
      project: 'Project A',
      partners: [1],
      partners_name: ['HRBP A'],
      departments: [{ department_id: 3, candidate_required: 2 }],
      departments_name: [{ name: 'Dept A', candidate_required: 1 }],
    });

    expect(axiosInstance.put).toHaveBeenCalledWith('/job', expect.any(FormData), { params: { id: 1 } });
    const formData = vi.mocked(axiosInstance.put).mock.calls[0][1] as FormData;
    const entries = formDataEntries(formData);

    expect(entries.partners).toBeUndefined();
    expect(entries.partners_name).toBeUndefined();
    expect(entries.recruiter_name).toBeUndefined();
    expect(entries.departments).toBe(JSON.stringify([{ department_id: 3, candidate_required: 2 }]));
    expect(entries.departments_name).toBe(JSON.stringify([{ name: 'Dept A', candidate_required: 1 }]));
    expect(result).toEqual(mockJob);
  });

  it('updateJobApi should send recruiter_name for newly typed recruiter', async () => {
    const mockJob = { job_id: 1, job_code: 'J001', project: 'Project A' };
    vi.mocked(axiosInstance.put).mockResolvedValueOnce({
      data: { result: true, data: mockJob },
    });

    await updateJobApi(1, {
      project: 'Project A',
      recruiter_id: null,
      recruiter_name: 'New Recruiter',
    });

    const formData = vi.mocked(axiosInstance.put).mock.calls[0][1] as FormData;
    const entries = formDataEntries(formData);

    expect(entries.job_code).toBeUndefined();
    expect(entries.recruiter_id).toBe('null');
    expect(entries.recruiter_name).toBe('New Recruiter');
  });

  it('createJobExtendedApi should keep partner fields for POST /job/extended', async () => {
    const mockJob = { job_id: 1, job_code: 'J001', project: 'Project A' };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { result: true, data: mockJob },
    });

    await createJobExtendedApi({
      job_code: 'J001',
      project: 'Project A',
      partners: [1],
      partners_name: ['HRBP A'],
    });

    expect(axiosInstance.post).toHaveBeenCalledWith('/job/extended', expect.any(FormData));
    const formData = vi.mocked(axiosInstance.post).mock.calls[0][1] as FormData;
    const entries = formDataEntries(formData);

    expect(entries.partners).toBe(JSON.stringify([1]));
    expect(entries.partners_name).toBe(JSON.stringify(['HRBP A']));
  });

  it('batchImportJobsApi should post jobs payload unchanged to /job/batch', async () => {
    const resultPayload = { success: true, importedCount: 1, errors: [] };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { result: true, data: resultPayload },
    });

    const jobs = [
      {
        job_code: 'J001',
        project: 'Project A',
        partners_name: ['HRBP A'],
        departments_name: [{ name: 'Dept A', candidate_required: 2, partner_name: 'HRBP A' }],
      }
    ];

    const result = await batchImportJobsApi(jobs);

    expect(axiosInstance.post).toHaveBeenCalledWith('/job/batch', { jobs });
    expect(result).toEqual(resultPayload);
  });

  it('batchImportJobsApi should chunk jobs payload by 10, aggregate results, and report progress', async () => {
    vi.mocked(axiosInstance.post)
      .mockResolvedValueOnce({
        data: { result: true, data: { success: true, importedCount: 10, errors: [] } },
      })
      .mockResolvedValueOnce({
        data: { result: true, data: { success: true, importedCount: 10, errors: [] } },
      })
      .mockResolvedValueOnce({
        data: { result: true, data: { success: false, importedCount: 4, errors: [{ job_code: 'J25', message: 'Fail' }] } },
      });

    const jobs = Array.from({ length: 25 }, (_, i) => ({
      job_code: `J${i + 1}`,
      project: `Project ${i + 1}`,
    }));
    const onProgress = vi.fn();

    const result = await batchImportJobsApi(jobs, onProgress);

    expect(axiosInstance.post).toHaveBeenCalledTimes(3);
    expect(axiosInstance.post).toHaveBeenNthCalledWith(1, '/job/batch', { jobs: jobs.slice(0, 10) });
    expect(axiosInstance.post).toHaveBeenNthCalledWith(2, '/job/batch', { jobs: jobs.slice(10, 20) });
    expect(axiosInstance.post).toHaveBeenNthCalledWith(3, '/job/batch', { jobs: jobs.slice(20, 25) });
    expect(onProgress).toHaveBeenNthCalledWith(1, 10);
    expect(onProgress).toHaveBeenNthCalledWith(2, 20);
    expect(onProgress).toHaveBeenNthCalledWith(3, 25);

    expect(result).toEqual({
      success: false,
      importedCount: 24,
      errors: [{ job_code: 'J25', message: 'Fail' }],
    });
  });
});
