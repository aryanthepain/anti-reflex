import { describe, it, expect } from 'vitest';
import { higherScore, createBestScoreStore } from './persistence.js';

function fakeStorage(initial = {}) {
  const map = { ...initial };
  return {
    getItem: (key) => (key in map ? map[key] : null),
    setItem: (key, value) => {
      map[key] = String(value);
    },
    _map: map,
  };
}

function throwingStorage() {
  return {
    getItem() {
      throw new Error('storage blocked');
    },
    setItem() {
      throw new Error('storage blocked');
    },
  };
}

describe('higherScore', () => {
  it('returns the larger of two scores', () => {
    expect(higherScore(10, 20)).toBe(20);
    expect(higherScore(30, 5)).toBe(30);
  });

  it('treats non-finite values as zero', () => {
    expect(higherScore(NaN, 5)).toBe(5);
    expect(higherScore(undefined, 0)).toBe(0);
    expect(higherScore(7, null)).toBe(7);
  });
});

describe('createBestScoreStore', () => {
  it('reads the persisted best on creation', () => {
    const store = createBestScoreStore({ storage: fakeStorage({ 'anti-reflex.bestScore': '420' }) });
    expect(store.getBest()).toBe(420);
  });

  it('starts at zero when nothing is persisted', () => {
    const store = createBestScoreStore({ storage: fakeStorage() });
    expect(store.getBest()).toBe(0);
  });

  it('updates and persists the best only when the run beats it', () => {
    const storage = fakeStorage();
    const store = createBestScoreStore({ storage, key: 'best' });

    expect(store.submit(100)).toEqual({ best: 100, isNewBest: true });
    expect(storage._map.best).toBe('100');

    // A lower run does not change the best and does not write.
    storage._map.best = 'sentinel-not-overwritten';
    expect(store.submit(50)).toEqual({ best: 100, isNewBest: false });
    expect(storage._map.best).toBe('sentinel-not-overwritten');

    expect(store.submit(250)).toEqual({ best: 250, isNewBest: true });
    expect(storage._map.best).toBe('250');
    expect(store.getBest()).toBe(250);
  });

  it('falls back to an in-memory best when storage throws and never blocks', () => {
    const store = createBestScoreStore({ storage: throwingStorage() });
    expect(store.getBest()).toBe(0);
    expect(() => store.submit(300)).not.toThrow();
    expect(store.submit(300)).toEqual({ best: 300, isNewBest: false });
    // After the first in-memory write the best is retained for the session.
    expect(store.getBest()).toBe(300);
    expect(store.submit(500)).toEqual({ best: 500, isNewBest: true });
  });

  it('works when no storage is provided at all', () => {
    const store = createBestScoreStore();
    expect(store.getBest()).toBe(0);
    expect(store.submit(123)).toEqual({ best: 123, isNewBest: true });
    expect(store.getBest()).toBe(123);
  });
});
