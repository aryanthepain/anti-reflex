/**
 * Seedable pseudo-random number generator (mulberry32).
 * Deterministic for a given seed so scene generation is reproducible in tests.
 */
export function makeRng(seed) {
  let state = seed >>> 0;

  function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(maxExclusive) {
    return Math.floor(next() * maxExclusive);
  }

  function pick(arr) {
    return arr[int(arr.length)];
  }

  return { next, int, pick };
}
