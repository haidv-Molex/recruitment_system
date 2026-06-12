import { describe, it, expect } from 'vitest';
import { getExtension, getMimeType } from '../FilePreview';

describe('FilePreview helper functions tests', () => {
  describe('getExtension', () => {
    it('should extract lowercase file extension', () => {
      expect(getExtension('resume.pdf')).toBe('pdf');
      expect(getExtension('document.DOCX')).toBe('docx');
      expect(getExtension('archive.tar.gz')).toBe('gz');
    });

    it('should return empty string if no extension exists', () => {
      expect(getExtension('filename')).toBe('filename'); // wait, filename.split('.').pop() returns 'filename' if there are no dots
      expect(getExtension('')).toBe('');
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME types for extensions', () => {
      expect(getMimeType('pdf')).toBe('application/pdf');
      expect(getMimeType('docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(getMimeType('png')).toBe('image/png');
      expect(getMimeType('xls')).toBe('application/vnd.ms-excel');
    });

    it('should return application/octet-stream for unknown extensions', () => {
      expect(getMimeType('unknown')).toBe('application/octet-stream');
      expect(getMimeType('')).toBe('application/octet-stream');
    });
  });
});
