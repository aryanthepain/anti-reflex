import { describe, it, expect } from 'vitest';
import { escalation } from './escalation.js';

describe('escalation — curve table', () => {
  it('matches the PRD escalation table at each band', () => {
    expect(escalation(0)).toEqual({ inputWindowMs: 3000, maxBaitCount: 1 });
    expect(escalation(3)).toEqual({ inputWindowMs: 3000, maxBaitCount: 1 });
    expect(escalation(4)).toEqual({ inputWindowMs: 2400, maxBaitCount: 2 });
    expect(escalation(7)).toEqual({ inputWindowMs: 2400, maxBaitCount: 2 });
    expect(escalation(8)).toEqual({ inputWindowMs: 1900, maxBaitCount: 3 });
    expect(escalation(12)).toEqual({ inputWindowMs: 1900, maxBaitCount: 3 });
    expect(escalation(13)).toEqual({ inputWindowMs: 1400, maxBaitCount: 4 });
    expect(escalation(18)).toEqual({ inputWindowMs: 1400, maxBaitCount: 4 });
    expect(escalation(19)).toEqual({ inputWindowMs: 1000, maxBaitCount: 5 });
    expect(escalation(100)).toEqual({ inputWindowMs: 1000, maxBaitCount: 5 });
  });

  it('is monotonic: window non-increasing to 1000, baits non-decreasing to 5', () => {
    let prevWindow = Infinity;
    let prevBaits = 0;
    for (let n = 0; n <= 30; n++) {
      const { inputWindowMs, maxBaitCount } = escalation(n);
      expect(inputWindowMs).toBeLessThanOrEqual(prevWindow);
      expect(inputWindowMs).toBeGreaterThanOrEqual(1000);
      expect(maxBaitCount).toBeGreaterThanOrEqual(prevBaits);
      expect(maxBaitCount).toBeLessThanOrEqual(5);
      prevWindow = inputWindowMs;
      prevBaits = maxBaitCount;
    }
  });
});
