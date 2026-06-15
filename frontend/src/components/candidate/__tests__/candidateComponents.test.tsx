import { describe, it, expect } from 'vitest';
import CandidateForm from '../CandidateForm';
import BulkCVUpload from '../BulkCVUpload';
import CandidateTable from '../CandidateTable';

describe('Candidate components structure', () => {
  it('should export CandidateForm default component', () => {
    expect(CandidateForm).toBeDefined();
    expect(typeof CandidateForm).toBe('function');
  });

  it('should export BulkCVUpload default component', () => {
    expect(BulkCVUpload).toBeDefined();
    expect(typeof BulkCVUpload).toBe('function');
  });

  it('should export CandidateTable default component', () => {
    expect(CandidateTable).toBeDefined();
    expect(typeof CandidateTable).toBe('function');
  });
});
