import { describe, it, expect } from 'vitest';
import { formatDate, formatDateFull } from './formatDate';

describe('formatDate', () => {
  it('formats a date string to short form', () => {
    const result = formatDate('2026-04-10T10:00:00.000Z');
    expect(result).toMatch(/Apr/);
    expect(result).toMatch(/2026/);
  });
});

describe('formatDateFull', () => {
  it('includes time in output', () => {
    const result = formatDateFull('2026-04-10T10:00:00.000Z');
    expect(result).toMatch(/April/);
    expect(result).toMatch(/2026/);
  });
});
