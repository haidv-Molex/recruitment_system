import { describe, it, expect } from 'vitest';
import ExcelImportTable from '../ExcelImportTable';

describe('ExcelImportTable components', () => {
  it('should export ExcelImportTable default component', () => {
    expect(ExcelImportTable).toBeDefined();
    expect(typeof ExcelImportTable).toBe('function');
  });
});
