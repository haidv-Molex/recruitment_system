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
      status: 'CV Sent',
      platform_name: 'Vietnamworks Job Post',
      candidate_levels_name: ['Engineer', 'Professional'],
      targeted_company_name: 'LG Innotek',
      reference_name: 'Nguyen Thi B',
      job_code: 'J001',
      project: 'DSS Talent Connector',
    });
    expect(result.payload).not.toHaveProperty('candidate_code');
    expect(result.payload?.offer_date).toBe('2025-08-22');
    expect(result.payload?.onboard_date).toBe('2025-09-15');
    expect(result.payload?.feedback_date).toBe('2025-08-21');
  });

  it('should map blank email to null without error', () => {
    const result = mapParsedCandidateToBatchPayload({
      ...parsedCandidate,
      candidate_email: '',
    }, 1);

    expect(result.error).toBeNull();
    expect(result.payload?.candidate_email).toBeNull();
  });

  it('should map non-empty invalid email directly to payload without error', () => {
    const result = mapParsedCandidateToBatchPayload({
      ...parsedCandidate,
      candidate_email: 'not-an-email',
    }, 2);

    expect(result.error).toBeNull();
    expect(result.payload?.candidate_email).toBe('not-an-email');
  });

  it('should collect all payloads with no errors for a parsed candidate batch', () => {
    const result = mapParsedCandidatesToBatchPayload([
      parsedCandidate,
      { ...parsedCandidate, candidate_name: 'Bad Email', candidate_email: 'bad-email' },
      { ...parsedCandidate, candidate_name: 'No Email', candidate_email: null },
    ]);

    expect(result.candidatesPayload).toHaveLength(3);
    expect(result.errors).toHaveLength(0);
    expect(result.candidatesPayload[1].candidate_name).toBe('Bad Email');
    expect(result.candidatesPayload[1].candidate_email).toBe('bad-email');
    expect(result.candidatesPayload[2].candidate_name).toBe('No Email');
    expect(result.candidatesPayload[2].candidate_email).toBeNull();
  });

  it('should map parsed candidate to extended form payload for fallback import', () => {
    const result = mapParsedCandidateToExtendedFormPayload(parsedCandidate, 0);

    expect(result.error).toBeNull();
    expect(result.payload).toMatchObject({
      candidateName: 'Nguyen Van A',
      candidateEmail: 'candidate@example.com',
      platformName: 'Vietnamworks Job Post',
      candidateLevelsName: ['Engineer', 'Professional'],
      targetedCompanyName: 'LG Innotek',
      referenceName: 'Nguyen Thi B',
      jobCode: 'J001',
      project: 'DSS Talent Connector',
    });
    expect(result.payload).not.toHaveProperty('candidateCode');
  });
});
