import { describe, it, expect } from 'vitest';
import {
  MISTAKE_TYPES,
  roastLines,
  selectRoast,
  formatBetrayal,
  commentate,
} from './commentator.js';

// A fake rng exposing only the `pick` the commentator relies on, so selection is
// deterministic without pulling in the real seeded generator.
function fakePick(index) {
  return { pick: (arr) => arr[index % arr.length] };
}

describe('roastLines', () => {
  it('returns a non-empty pool of strings for every known mistake type', () => {
    for (const type of MISTAKE_TYPES) {
      const lines = roastLines(type);
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect(typeof line).toBe('string');
        expect(line.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('falls back to a generic non-empty pool for an unknown mistake type', () => {
    const lines = roastLines('totally-unknown-reason');
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((l) => l.trim().length > 0)).toBe(true);
  });

  it('falls back for a missing mistake type', () => {
    expect(roastLines(undefined).length).toBeGreaterThan(0);
  });
});

describe('selectRoast', () => {
  it('never returns empty for any known mistake type', () => {
    for (const type of MISTAKE_TYPES) {
      const roast = selectRoast(type);
      expect(typeof roast).toBe('string');
      expect(roast.trim().length).toBeGreaterThan(0);
    }
  });

  it('uses the rng to pick a line from the matching pool', () => {
    const lines = roastLines('wrongSide');
    expect(selectRoast('wrongSide', fakePick(1))).toBe(lines[1 % lines.length]);
    expect(selectRoast('wrongSide', fakePick(0))).toBe(lines[0]);
  });

  it('returns a stable first line when no rng is supplied', () => {
    expect(selectRoast('shouldResist')).toBe(roastLines('shouldResist')[0]);
  });

  it('never returns empty for an unknown mistake type', () => {
    expect(selectRoast('nonsense').trim().length).toBeGreaterThan(0);
  });
});

describe('formatBetrayal', () => {
  it('formats a wrong-side press with the reaction time', () => {
    expect(formatBetrayal({ mistakeType: 'wrongSide', reactionMs: 180 })).toBe(
      'You reacted in 180ms… to the wrong thing.',
    );
  });

  it('rounds fractional reaction times', () => {
    expect(formatBetrayal({ mistakeType: 'wrongSide', reactionMs: 179.6 })).toContain('180ms');
  });

  it('calls out pressing when the answer was to do nothing', () => {
    const stat = formatBetrayal({ mistakeType: 'shouldResist', reactionMs: 120 });
    expect(stat).toContain('120ms');
    expect(stat).toMatch(/nothing/i);
  });

  it('calls out a swallowed bait', () => {
    const stat = formatBetrayal({ mistakeType: 'baitPressed', reactionMs: 90 });
    expect(stat).toContain('90ms');
    expect(stat).toMatch(/trap|bait/i);
  });

  it('frames a freeze (resisted when action was required) by the window', () => {
    const stat = formatBetrayal({
      mistakeType: 'shouldHavePressed',
      reactionMs: 1200,
      windowMs: 1200,
    });
    expect(stat).toContain('1200ms');
    expect(stat).toMatch(/froze|still|nothing/i);
  });

  it('frames a too-early press by how early it was', () => {
    const stat = formatBetrayal({ mistakeType: 'tooEarly', reactionMs: -40 });
    expect(stat).toContain('40ms');
    expect(stat).toMatch(/early/i);
  });

  it('never returns empty even with missing fields', () => {
    expect(formatBetrayal({}).trim().length).toBeGreaterThan(0);
    expect(formatBetrayal().trim().length).toBeGreaterThan(0);
  });
});

describe('commentate', () => {
  it('returns the mistake type, a non-empty roast, and a betrayal stat from a judgment', () => {
    const result = commentate(
      { outcome: 'wrong', reason: 'wrongSide' },
      { reactionMs: 180, rng: fakePick(0) },
    );
    expect(result.mistakeType).toBe('wrongSide');
    expect(result.roast.trim().length).toBeGreaterThan(0);
    expect(result.betrayal).toBe('You reacted in 180ms… to the wrong thing.');
  });

  it('matches the roast pool to the mistake type', () => {
    const result = commentate(
      { outcome: 'wrong', reason: 'baitPressed' },
      { reactionMs: 75, rng: fakePick(0) },
    );
    expect(roastLines('baitPressed')).toContain(result.roast);
  });

  it('still produces a non-empty roast + stat for an unknown reason', () => {
    const result = commentate({ outcome: 'wrong', reason: 'mystery' }, { reactionMs: 50 });
    expect(result.roast.trim().length).toBeGreaterThan(0);
    expect(result.betrayal.trim().length).toBeGreaterThan(0);
  });

  it('returns null for a correct outcome (nothing to roast)', () => {
    expect(commentate({ outcome: 'correct', reason: 'correct' }, {})).toBeNull();
  });

  it('tolerates a missing options object', () => {
    const result = commentate({ outcome: 'wrong', reason: 'shouldResist' });
    expect(result.roast.trim().length).toBeGreaterThan(0);
    expect(result.betrayal.trim().length).toBeGreaterThan(0);
  });
});
