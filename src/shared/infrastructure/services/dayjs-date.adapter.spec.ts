import { describe, it, expect } from 'vitest';
import { DayjsDateAdapter } from './dayjs-date.adapter';

describe('DayjsDateAdapter', () => {
  const adapter = new DayjsDateAdapter();

  it('should return current date', () => {
    const now = adapter.now();
    expect(now).toBeInstanceOf(Date);
  });

  it('should add days correctly', () => {
    const now = adapter.now();
    const future = adapter.addDays(5);
    expect(adapter.isAfter(future, now)).toBe(true);
    expect(adapter.isBefore(now, future)).toBe(true);
  });

  it('should format dates properly', () => {
    const date = new Date(2026, 0, 15);
    const formatted = adapter.format(date, 'YYYY-MM-DD');
    expect(formatted).toBe('2026-01-15');
  });
});
