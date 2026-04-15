import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeTime } from './formatRelativeTime';

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for recent dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:30Z'));
    expect(formatRelativeTime('2026-04-10T12:00:00Z')).toBe('just now');
  });

  it('returns minutes ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:05:00Z'));
    expect(formatRelativeTime('2026-04-10T12:00:00Z')).toBe('5m ago');
  });

  it('returns hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T14:00:00Z'));
    expect(formatRelativeTime('2026-04-10T12:00:00Z')).toBe('2h ago');
  });

  it('returns days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-13T12:00:00Z'));
    expect(formatRelativeTime('2026-04-10T12:00:00Z')).toBe('3d ago');
  });
});
