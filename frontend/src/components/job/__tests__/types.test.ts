import { describe, it, expect } from 'vitest';
import { emptyJob } from '../types';

describe('Job types and default values', () => {
  it('should define emptyJob with correct initial state', () => {
    expect(emptyJob).toBeDefined();
    expect(emptyJob.jobCode).toBe('');
    expect(emptyJob.project).toBe('');
    expect(emptyJob.candidateRequired).toBe(1);
    expect(emptyJob.note).toBe('');
    expect(emptyJob.requestDate).toBe('');
    expect(emptyJob.file).toBeNull();
    expect(Array.isArray(emptyJob.departments)).toBe(true);
    expect(emptyJob.departments.length).toBe(0);
    expect(Array.isArray(emptyJob.segments)).toBe(true);
    expect(emptyJob.segments.length).toBe(0);
    expect(Array.isArray(emptyJob.sites)).toBe(true);
    expect(emptyJob.sites.length).toBe(0);
    expect(Array.isArray(emptyJob.titles)).toBe(true);
    expect(emptyJob.titles.length).toBe(0);
    expect(Array.isArray(emptyJob.employeeLevels)).toBe(true);
    expect(emptyJob.employeeLevels.length).toBe(0);
    expect(Array.isArray(emptyJob.partners)).toBe(true);
    expect(emptyJob.partners.length).toBe(0);
    expect(Array.isArray(emptyJob.managers)).toBe(true);
    expect(emptyJob.managers.length).toBe(0);
  });
});
