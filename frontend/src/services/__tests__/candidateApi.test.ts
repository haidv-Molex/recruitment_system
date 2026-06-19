import { describe, expect, it, vi, beforeEach } from 'vitest';
import axiosInstance from '@/config/axiosInstance';
import { updateCandidateApi } from '../candidateApi';

vi.mock('@/config/axiosInstance', () => {
  return {
    default: {
      put: vi.fn(),
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
      candidateCode: 'C001',
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
    expect(entries.candidate_code).toBe('C001');
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
});
