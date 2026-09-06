import { describe, it, expect } from 'vitest';
import {
  DEFAULT_EPOCH_LENGTH,
  epochIndexForRound,
  isEpochBoundary,
  createRuleSchedule,
  RULE_CATALOG,
} from './ruleEpoch.js';

describe('ruleEpoch — epoch math', () => {
  it('defaults to a 5-round epoch', () => {
    expect(DEFAULT_EPOCH_LENGTH).toBe(5);
  });

  it('maps rounds to epoch indices by epoch length', () => {
    expect(epochIndexForRound(0)).toBe(0);
    expect(epochIndexForRound(4)).toBe(0);
    expect(epochIndexForRound(5)).toBe(1);
    expect(epochIndexForRound(9)).toBe(1);
    expect(epochIndexForRound(10)).toBe(2);
    expect(epochIndexForRound(3, 3)).toBe(1);
  });

  it('flags only the rounds that open a new epoch as boundaries', () => {
    expect(isEpochBoundary(0)).toBe(false);
    expect(isEpochBoundary(4)).toBe(false);
    expect(isEpochBoundary(5)).toBe(true);
    expect(isEpochBoundary(10)).toBe(true);
    expect(isEpochBoundary(2, 2)).toBe(true);
    expect(isEpochBoundary(3, 2)).toBe(false);
  });
});

describe('ruleEpoch — schedule', () => {
  it('keeps the rule/variant constant within an epoch', () => {
    const schedule = createRuleSchedule({
      seed: 42,
      epochLength: 5,
      rules: ['greyDot', 'blueRed'],
      catalog: { greyDot: { variants: ['normal'] }, blueRed: { variants: ['normal', 'inverted'] } },
    });
    const first = schedule.forRound(0);
    for (let r = 0; r < 5; r++) {
      expect(schedule.forRound(r)).toEqual(first);
    }
    // a new epoch is resolved independently (may or may not differ)
    expect(schedule.forRound(5).epochIndex).toBe(1);
  });

  it('is deterministic for a given seed', () => {
    const opts = {
      seed: 7,
      rules: ['greyDot', 'blueRed'],
      catalog: { greyDot: { variants: ['normal'] }, blueRed: { variants: ['normal', 'inverted'] } },
    };
    const a = createRuleSchedule(opts);
    const b = createRuleSchedule(opts);
    for (let r = 0; r < 30; r++) {
      expect(a.forRound(r)).toEqual(b.forRound(r));
    }
  });

  it('only ever changes rule/variant at epoch boundaries', () => {
    const schedule = createRuleSchedule({
      seed: 99,
      epochLength: 5,
      rules: ['greyDot', 'blueRed'],
      catalog: { greyDot: { variants: ['normal'] }, blueRed: { variants: ['normal', 'inverted'] } },
    });
    let prev = schedule.forRound(0);
    for (let r = 1; r < 40; r++) {
      const cur = schedule.forRound(r);
      const changed = cur.rule !== prev.rule || cur.ruleVariant !== prev.ruleVariant;
      if (changed) {
        expect(isEpochBoundary(r, 5)).toBe(true);
      }
      prev = cur;
    }
  });

  it('with a single-rule single-variant pool never changes (dormant mechanism)', () => {
    const schedule = createRuleSchedule({ seed: 3, rules: ['greyDot'] });
    const first = schedule.forRound(0);
    expect(first).toMatchObject({ rule: 'greyDot', ruleVariant: 'normal' });
    for (let r = 0; r < 50; r++) {
      expect(schedule.forRound(r)).toMatchObject({ rule: 'greyDot', ruleVariant: 'normal' });
    }
  });

  it('the default catalog registers blueRed with both variants', () => {
    expect(RULE_CATALOG.blueRed).toBeDefined();
    expect(RULE_CATALOG.blueRed.variants).toEqual(['normal', 'inverted']);
    const schedule = createRuleSchedule({ seed: 11, rules: ['blueRed'] });
    for (let r = 0; r < 40; r++) {
      const { rule, ruleVariant } = schedule.forRound(r);
      expect(rule).toBe('blueRed');
      expect(['normal', 'inverted']).toContain(ruleVariant);
    }
  });

  it('the default catalog registers stroop as a single-variant rule', () => {
    expect(RULE_CATALOG.stroop).toBeDefined();
    expect(RULE_CATALOG.stroop.variants).toEqual(['normal']);
    const schedule = createRuleSchedule({ seed: 11, rules: ['stroop'] });
    for (let r = 0; r < 40; r++) {
      const { rule, ruleVariant } = schedule.forRound(r);
      expect(rule).toBe('stroop');
      expect(ruleVariant).toBe('normal');
    }
  });
});
