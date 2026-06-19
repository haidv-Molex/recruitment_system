import { describe, expect, it } from 'vitest';
import {
  mapParsedCandidateToBatchPayload,
  mapParsedCandidatesToBatchPayload,
  mapParsedCandidateToExtendedFormPayload,
} from '../candidateImportMapper';

const parsedCandidate = {
  candidate_name: 'Nguyen Van A',
  candidate_email: '  candidate@example.com  ',
  candidate_phone: '0903442885',
  agency: 'AsiaHr',
  offer_date: '2025-08-22T00:00:00.000Z',
  onboard_date: '2025-09-15T00:00:00.000Z',
  feedback_date: '2025-08-21T00:00:00.000Z',
  current_salary: '20',
  expected_salary: '30',
  status: 'CV Sent',
  note: 'Good candidate',
  employee_code: 'V6222',
  recruiter: { user_id: null, user_name: 'New Recruiter' },
  targeted_company: 'Yes',
  targeted_company_name: 'LG Innotek',
  reference_name: 'Nguyen Thi B',
  source: 'Vietnamworks Job Post',
  ee_level: 'Engineer, Professional',
  job_code: 'J001',
  project: 'DSS Talent Connector',
};

describe('candidateImportMapper', () => {
  it('should map parsed candidate fields to batch payload using sample workbook semantics', () => {
    const result = mapParsedCandidateToBatchPayload(parsedCandidate, 0);

    expect(result.error).toBeNull();
    expect(result.payload).toMatchObject({
      candidate_name: 'Nguyen Van A',
      candidate_email: 'candidate@example.com',
      candidate_phone: '0903442885',
      candidate_code: 'V6222',
      status: 'CV Sent',
      platform_name: 'Vietnamworks Job Post',
      candidate_levels_name: ['Engineer', 'Professional'],
      recruiter: null,
      recruiter_name: 'New Recruiter',
      targeted_company_name: 'LG Innotek',
      reference_name: 'Nguyen Thi B',
      job_code: 'J001',
      project: 'DSS Talent Connector',
    });
    expect(result.payload?.offer_date).toBe('2025-08-22');
    expect(result.payload?.onboard_date).toBe('2025-09-15');
    expect(result.payload?.feedback_date).toBe('2025-08-21');
  });

  it('should allow blank email and map it to null', () => {
    const result = mapParsedCandidateToBatchPayload({
      ...parsedCandidate,
      candidate_email: '',
    }, 1);

    expect(result.error).toBeNull();
    expect(result.payload?.candidate_email).toBeNull();
  });

  it('should return a row-level error with the expected format for non-empty invalid email', () => {
    const result = mapParsedCandidateToBatchPayload({
      ...parsedCandidate,
      candidate_email: 'not-an-email',
    }, 2);

    expect(result.payload).toBeNull();
    expect(result.error).toMatchObject({
      candidate_name: 'Nguyen Van A',
      rowIndex: 2,
    });
    expect(result.error?.message).toContain('Email không hợp lệ');
    expect(result.error?.message).toContain('not-an-email');
    expect(result.error?.message).toContain('Định dạng email chuẩn: name@example.com');
    expect(result.error?.message).toContain('không chứa khoảng trắng');
  });

  it('should collect payloads and errors for a parsed candidate batch', () => {
    const result = mapParsedCandidatesToBatchPayload([
      parsedCandidate,
      { ...parsedCandidate, candidate_name: 'Bad Email', candidate_email: 'bad-email' },
      { ...parsedCandidate, candidate_name: 'No Email', candidate_email: null },
    ]);

    expect(result.candidatesPayload).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].candidate_name).toBe('Bad Email');
    expect(result.candidatesPayload[1].candidate_name).toBe('No Email');
    expect(result.candidatesPayload[1].candidate_email).toBeNull();
  });

  it('should map parsed candidate to extended form payload for fallback import', () => {
    const result = mapParsedCandidateToExtendedFormPayload(parsedCandidate, 0);

    expect(result.error).toBeNull();
    expect(result.payload).toMatchObject({
      candidateCode: 'V6222',
      candidateName: 'Nguyen Van A',
      candidateEmail: 'candidate@example.com',
      platformName: 'Vietnamworks Job Post',
      candidateLevelsName: ['Engineer', 'Professional'],
      recruiterName: 'New Recruiter',
      targetedCompanyName: 'LG Innotek',
      referenceName: 'Nguyen Thi B',
      jobCode: 'J001',
      project: 'DSS Talent Connector',
    });
  });
});
