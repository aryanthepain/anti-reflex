import { describe, it, expect } from 'vitest';
import { makeRng } from './rng.js';

describe('makeRng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(12345);
    const b = makeRng(12345);
    const seqA = [a.next(), a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next(), b.next()];
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = makeRng(1);
    const b = makeRng(2);
    expect(a.next()).not.toEqual(b.next());
  });

  it('next() returns floats in [0, 1)', () => {
    const r = makeRng(7);
    for (let i = 0; i < 100; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int(maxExclusive) returns integers in [0, max)', () => {
    const r = makeRng(99);
    for (let i = 0; i < 100; i++) {
      const v = r.int(5);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(5);
    }
  });

  it('pick returns an element of the array deterministically', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const r1 = makeRng(42);
    const r2 = makeRng(42);
    expect(r1.pick(arr)).toBe(r2.pick(arr));
    expect(arr).toContain(r1.pick(arr));
  });
});
