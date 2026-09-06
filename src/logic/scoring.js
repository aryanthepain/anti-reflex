/**
 * scoring — a pure reducer over judged outcomes (no DOM, no clock).
 *
 * Tracks the composure score, the combo multiplier, and the strike count per the
 * PRD "Scoring formula":
 *   - Base 100 per correct outcome; 0 for a wrong outcome (a strike).
 *   - Combo is the multiplier applied to a correct round. The first correct of a
 *     streak applies 1, each consecutive correct climbs by 1 (cap 8). Any strike
 *     resets the streak so the *next* correct applies 2 again — exactly the
 *     behaviour the PRD worked example encodes (R4 scores at combo 2 right after
 *     a strike, while the run's very first correct scores at combo 1).
 *   - Speed bonus on a correct press (left/right): round(50 * (1 - reactionMs /
 *     windowMs)) clamped to [0, 50]. A correct `resist` earns no speed bonus.
 *   - Round score = round((base + speedBonus) * combo); run total is their sum.
 *
 * The state is `{ score, combo, strikes }` plus an internal `_streak` used to
 * distinguish the run start (streak 0 → first correct applies 1) from a post-
 * strike reset (streak 1 → next correct applies 2). `lastRoundScore` exposes the
 * most recent round's contribution for the renderer.
 */

const BASE_POINTS = 100;
const COMBO_CAP = 8;
const MAX_SPEED_BONUS = 50;

export function speedBonus(reactionMs, windowMs) {
  if (!windowMs || windowMs <= 0) return 0;
  const raw = Math.round(MAX_SPEED_BONUS * (1 - reactionMs / windowMs));
  return Math.max(0, Math.min(MAX_SPEED_BONUS, raw));
}

export function initialScoringState() {
  return { score: 0, combo: 1, strikes: 0, lastRoundScore: 0, _streak: 0 };
}

export function applyOutcome(state, { outcome, action, reactionMs, windowMs }) {
  if (outcome === 'correct') {
    const streak = Math.min(COMBO_CAP, state._streak + 1);
    const bonus = action === 'resist' ? 0 : speedBonus(reactionMs, windowMs);
    const roundScore = Math.round((BASE_POINTS + bonus) * streak);
    return {
      score: state.score + roundScore,
      combo: streak,
      strikes: state.strikes,
      lastRoundScore: roundScore,
      _streak: streak,
    };
  }

  // Wrong outcome — a strike. No points; combo resets to 1.
  return {
    score: state.score,
    combo: 1,
    strikes: state.strikes + 1,
    lastRoundScore: 0,
    _streak: 1,
  };
}
