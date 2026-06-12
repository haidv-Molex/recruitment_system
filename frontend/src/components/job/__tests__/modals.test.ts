import { describe, it, expect } from 'vitest';
import JobExcelImport from '../JobExcelImport';
import JobConfirmDeleteModal from '../JobConfirmDeleteModal';

describe('Job components exports', () => {
  it('should export JobExcelImport default component', () => {
    expect(JobExcelImport).toBeDefined();
    expect(typeof JobExcelImport).toBe('function');
  });

  it('should export JobConfirmDeleteModal default component', () => {
    expect(JobConfirmDeleteModal).toBeDefined();
    expect(typeof JobConfirmDeleteModal).toBe('function');
  });
});
