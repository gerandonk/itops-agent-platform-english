import { describe, it, expect } from 'vitest';

describe('Date Utilities', () => {
  it('should export safeFormatDistance', async () => {
    const { safeFormatDistance } = await import('../../lib/date');
    expect(safeFormatDistance).toBeDefined();
  });

  it('should handle null/undefined dates gracefully', async () => {
    const { safeFormatDistance } = await import('../../lib/date');
    expect(safeFormatDistance(null)).toBe('Unknown time');
    expect(safeFormatDistance(undefined)).toBe('Unknown time');
  });

  it('should format relative time for recent dates', async () => {
    const { safeFormatDistance } = await import('../../lib/date');
    const now = new Date();

    const result = safeFormatDistance(now);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should handle invalid date strings gracefully', async () => {
    const { safeFormatDistance } = await import('../../lib/date');
    expect(safeFormatDistance('not-a-date')).toBe('Unknown time');
  });

  it('should handle empty string dates', async () => {
    const { safeFormatDistance } = await import('../../lib/date');
    expect(safeFormatDistance('')).toBe('Unknown time');
  });
});
