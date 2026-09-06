import { describe, it, expect } from 'vitest';
import { applyOutcome, speedBonus, initialScoringState } from './scoring.js';

describe('scoring — speedBonus', () => {
  it('matches the PRD formula and clamps to [0, 50]', () => {
    expect(speedBonus(200, 1000)).toBe(40);
    expect(speedBonus(100, 1000)).toBe(45);
    expect(speedBonus(0, 1000)).toBe(50); // fastest possible
    expect(speedBonus(1000, 1000)).toBe(0); // at the buzzer
    expect(speedBonus(2000, 1000)).toBe(0); // never negative
  });
});

describe('scoring — applyOutcome', () => {
  it('scores a correct press as (base + speedBonus) * combo', () => {
    const s = applyOutcome(initialScoringState(), {
      outcome: 'correct',
      action: 'left',
      reactionMs: 200,
      windowMs: 1000,
    });
    expect(s.lastRoundScore).toBe(140);
    expect(s.score).toBe(140);
    expect(s.combo).toBe(1);
    expect(s.strikes).toBe(0);
  });

  it('scores a correct resist as base * combo with no speed bonus', () => {
    let s = applyOutcome(initialScoringState(), {
      outcome: 'correct',
      action: 'left',
      reactionMs: 200,
      windowMs: 1000,
    });
    s = applyOutcome(s, { outcome: 'correct', action: 'resist', reactionMs: 1000, windowMs: 1000 });
    expect(s.lastRoundScore).toBe(200); // 100 * combo 2, no bonus
    expect(s.combo).toBe(2);
  });

  it('climbs the combo on consecutive correct and caps it at 8', () => {
    let s = initialScoringState();
    const combos = [];
    for (let i = 0; i < 10; i++) {
      s = applyOutcome(s, { outcome: 'correct', action: 'resist', reactionMs: 0, windowMs: 1000 });
      combos.push(s.combo);
    }
    expect(combos).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 8, 8]);
  });

  it('awards 0 and resets the combo to 1 on a strike', () => {
    let s = initialScoringState();
    s = applyOutcome(s, { outcome: 'correct', action: 'resist', reactionMs: 0, windowMs: 1000 });
    s = applyOutcome(s, { outcome: 'correct', action: 'resist', reactionMs: 0, windowMs: 1000 });
    const before = s.score;
    s = applyOutcome(s, { outcome: 'wrong', action: 'left', reactionMs: 100, windowMs: 1000 });
    expect(s.lastRoundScore).toBe(0);
    expect(s.score).toBe(before);
    expect(s.combo).toBe(1);
    expect(s.strikes).toBe(1);
  });

  it('reproduces the PRD worked example (total 630, 1 strike)', () => {
    let s = initialScoringState();
    s = applyOutcome(s, { outcome: 'correct', action: 'left', reactionMs: 200, windowMs: 1000 });
    s = applyOutcome(s, { outcome: 'correct', action: 'resist', reactionMs: 1000, windowMs: 1000 });
    s = applyOutcome(s, { outcome: 'wrong', action: 'left', reactionMs: 100, windowMs: 1000 });
    s = applyOutcome(s, { outcome: 'correct', action: 'right', reactionMs: 100, windowMs: 1000 });
    expect(s.score).toBe(630);
    expect(s.strikes).toBe(1);
    expect(s.combo).toBe(2);
  });
});
