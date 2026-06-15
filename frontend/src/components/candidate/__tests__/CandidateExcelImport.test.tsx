import { describe, it, expect } from 'vitest';
import CandidateExcelImport from '../CandidateExcelImport';

describe('Candidate components exports', () => {
  it('should export CandidateExcelImport default component', () => {
    expect(CandidateExcelImport).toBeDefined();
    expect(typeof CandidateExcelImport).toBe('function');
  });
});
