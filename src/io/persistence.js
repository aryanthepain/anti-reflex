/**
 * persistence — reads/writes the local best composure score (shallow IO).
 *
 * Per the PRD "Storage & clipboard fallbacks": `localStorage` failures (private
 * mode, quota, insecure context) must never block gameplay. The store wraps every
 * storage access in a guard and falls back to an in-memory best for the session,
 * simply skipping persistence. The best is updated only when a run beats it.
 *
 * The browser `localStorage` is injected (like `matchMedia` for the motion
 * controller) so the pure logic is testable under the node test environment.
 */

const DEFAULT_KEY = 'anti-reflex.bestScore';

export function higherScore(a, b) {
  const x = Number.isFinite(a) ? a : 0;
  const y = Number.isFinite(b) ? b : 0;
  return Math.max(x, y);
}

function safeRead(storage, key) {
  try {
    const raw = storage?.getItem(key);
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function safeWrite(storage, key, value) {
  try {
    storage?.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

export function createBestScoreStore({ storage, key = DEFAULT_KEY } = {}) {
  let best = safeRead(storage, key);
  return {
    getBest: () => best,
    /**
     * Offer a finished run's score. The best is updated (and persisted, best
     * effort) only when the run beats it. Returns `{ best, isNewBest }`.
     */
    submit(runScore) {
      const score = Number.isFinite(runScore) ? runScore : 0;
      const isNewBest = score > best;
      if (isNewBest) {
        best = score;
        safeWrite(storage, key, best);
      }
      return { best, isNewBest };
    },
  };
}
