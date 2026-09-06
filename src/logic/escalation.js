/**
 * escalation — maps `roundsSurvived` (0-based) to difficulty params per the PRD
 * "Escalation curve" table. `inputWindowMs` monotonically non-increases to a
 * 1000ms floor; `maxBaitCount` monotonically non-decreases to a 5 ceiling.
 */

const CURVE = [
  { upTo: 3, inputWindowMs: 3000, maxBaitCount: 1 },
  { upTo: 7, inputWindowMs: 2400, maxBaitCount: 2 },
  { upTo: 12, inputWindowMs: 1900, maxBaitCount: 3 },
  { upTo: 18, inputWindowMs: 1400, maxBaitCount: 4 },
];

const FLOOR = { inputWindowMs: 1000, maxBaitCount: 5 };

export function escalation(roundsSurvived) {
  const n = Math.max(0, Math.floor(roundsSurvived));
  for (const band of CURVE) {
    if (n <= band.upTo) {
      return { inputWindowMs: band.inputWindowMs, maxBaitCount: band.maxBaitCount };
    }
  }
  return { ...FLOOR };
}
