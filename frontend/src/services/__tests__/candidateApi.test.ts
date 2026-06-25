import { describe, expect, it, vi, beforeEach } from 'vitest';
import axiosInstance from '@/config/axiosInstance';
import { updateCandidateApi, batchImportCandidatesApi } from '../candidateApi';

vi.mock('@/config/axiosInstance', () => {
  return {
    default: {
      put: vi.fn(),
      post: vi.fn(),
    },
  };
});

function formDataEntries(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(Array.from(formData.entries()));
}

describe('candidateApi tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updateCandidateApi should send present empty optional fields so backend can clear them', async () => {
    const mockCandidate = { candidate_id: 1, candidate_name: 'Candidate A' };
    vi.mocked(axiosInstance.put).mockResolvedValueOnce({
      data: { result: true, data: mockCandidate },
    });

    const result = await updateCandidateApi(1, {
      candidateName: 'Candidate A',
      candidateEmail: '',
      candidatePhone: '',
      agency: '',
      offerDate: '',
      onboardDate: '',
      expectedOnboardDate: '',
      feedbackDate: '',
      currentSalary: '',
      expectedSalary: '',
      status: 'CV Sent',
      note: '',
      platformId: '',
      jobId: '',
      targetedCompanyId: '',
      referenceId: '',
    });

    expect(axiosInstance.put).toHaveBeenCalledWith('/candidate', expect.any(FormData), { params: { id: 1 } });
    const formData = vi.mocked(axiosInstance.put).mock.calls[0][1] as FormData;
    const entries = formDataEntries(formData);

    expect(entries.candidate_name).toBe('Candidate A');
    expect(entries.candidate_code).toBeUndefined();
    expect(entries.candidate_email).toBe('');
    expect(entries.candidate_phone).toBe('');
    expect(entries.agency).toBe('');
    expect(entries.offer_date).toBe('');
    expect(entries.onboard_date).toBe('');
    expect(entries.expected_onboard_date).toBe('');
    expect(entries.feedback_date).toBe('');
    expect(entries.current_salary).toBe('');
    expect(entries.expected_salary).toBe('');
    expect(entries.note).toBe('');
    expect(entries.platform_id).toBe('');
    expect(entries.job_id).toBe('');
    expect(entries.targeted_company).toBe('');
    expect(entries.reference).toBe('null');
    expect(result).toEqual(mockCandidate);
  });

  it('batchImportCandidatesApi should post candidates payload, chunk by 10, and report progress', async () => {
    vi.mocked(axiosInstance.post)
      .mockResolvedValueOnce({
        data: { result: true, data: { success: true, importedCount: 10, errors: [] } },
      })
      .mockResolvedValueOnce({
        data: { result: true, data: { success: true, importedCount: 10, errors: [] } },
      })
      .mockResolvedValueOnce({
        data: { result: true, data: { success: false, importedCount: 4, errors: [{ candidate_name: 'Cand 25', message: 'Fail' }] } },
      });

    const candidates = Array.from({ length: 25 }, (_, i) => ({
      candidate_name: `Cand ${i + 1}`,
      status: 'CV Sent',
    }));
    const onProgress = vi.fn();

    const result = await batchImportCandidatesApi(candidates, onProgress);

    expect(axiosInstance.post).toHaveBeenCalledTimes(3);
    expect(axiosInstance.post).toHaveBeenNthCalledWith(1, '/candidate/batch', { candidates: candidates.slice(0, 10) });
    expect(axiosInstance.post).toHaveBeenNthCalledWith(2, '/candidate/batch', { candidates: candidates.slice(10, 20) });
    expect(axiosInstance.post).toHaveBeenNthCalledWith(3, '/candidate/batch', { candidates: candidates.slice(20, 25) });
    expect(onProgress).toHaveBeenNthCalledWith(1, 10);
    expect(onProgress).toHaveBeenNthCalledWith(2, 20);
    expect(onProgress).toHaveBeenNthCalledWith(3, 25);

    expect(result).toEqual({
      success: false,
      importedCount: 24,
      errors: [{ candidate_name: 'Cand 25', message: 'Fail' }],
    });
  });
});
