import { describe, it, expect } from 'vitest';
import { formatDateTime, formatRelative, formatDuration } from './dateFormatter';

describe('dateFormatter', () => {
  it('formats ISO to IST correctly', () => {
    const iso = '2026-10-19T10:30:00Z';
    const formatted = formatDateTime(iso);
    expect(formatted).toContain('2026');
    expect(formatted).toContain('16:00:00'); // 10:30 UTC = 16:00 IST
  });

  it('handles null or invalid date', () => {
    expect(formatDateTime(null)).toBe('-');
    expect(formatDateTime('invalid-date')).toBe('-');
  });

  it('formats duration in seconds', () => {
    expect(formatDuration(900)).toBe('15m 0s');
    expect(formatDuration(3665)).toBe('1h 1m');
  });

  it('formats relative time', () => {
    const recent = new Date(Date.now() - 5000).toISOString();
    expect(formatRelative(recent)).toBe('just now');
  });
});
