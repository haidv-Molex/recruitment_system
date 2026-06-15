import { describe, it, expect } from 'vitest';
import SingleSearchSelect from '../SingleSearchSelect';

describe('SingleSearchSelect components', () => {
  it('should export SingleSearchSelect default component', () => {
    expect(SingleSearchSelect).toBeDefined();
    expect(typeof SingleSearchSelect).toBe('function');
  });
});
