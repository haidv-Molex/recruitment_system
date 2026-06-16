import { describe, it, expect } from 'vitest';
import FileUploadField from '../FileUploadField';

describe('FileUploadField component tests', () => {
  it('should export FileUploadField component as default', () => {
    expect(FileUploadField).toBeDefined();
    expect(typeof FileUploadField).toBe('function');
  });
});
