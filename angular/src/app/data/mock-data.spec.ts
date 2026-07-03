import { describe, it, expect } from 'vitest';
import { formatBytes, isDone, examById, STATUS_ORDER } from './mock-data';

describe('mock-data helpers', () => {
  it('formats bytes', () => {
    expect(formatBytes(2_400_000)).toBe('2.3 MB');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  it('isDone only for accepted', () => {
    expect(isDone('accepted')).toBe(true);
    expect(isDone('submitted')).toBe(false);
  });

  it('finds an examination by id', () => {
    expect(examById('1148')?.subjectId).toBe('2734273');
    expect(examById('nope')).toBeUndefined();
  });

  it('orders statuses todo-first, accepted-last', () => {
    expect(STATUS_ORDER[0]).toBe('todo');
    expect(STATUS_ORDER[STATUS_ORDER.length - 1]).toBe('accepted');
  });
});
