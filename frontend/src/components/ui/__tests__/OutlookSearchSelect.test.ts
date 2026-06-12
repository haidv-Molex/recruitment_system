import { describe, it, expect } from 'vitest';
import OutlookSearchSelect from '../OutlookSearchSelect';

describe('OutlookSearchSelect component exports', () => {
  it('should be exported as a default function', () => {
    expect(OutlookSearchSelect).toBeDefined();
    expect(typeof OutlookSearchSelect).toBe('function');
  });
});
