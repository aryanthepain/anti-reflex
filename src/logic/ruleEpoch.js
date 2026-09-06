/**
 * ruleEpoch — the deterministic rule-epoch scheduler (pure logic, no DOM).
 *
 * Per the PRD "Rule-epoch & inversion contract": the active rule (and, for
 * variant-bearing rules, its variant) is fixed for a seedable **epoch** of a
 * deterministic number of rounds (default 5). Rule/variant changes therefore
 * happen only at epoch boundaries, between rounds — never mid-round.
 *
 * This slice ships the mechanism with only the grey-dot rule available, so the
 * default schedule never actually changes (the telegraph stays dormant). Later
 * slices widen the `rules` pool (Blue/Red, Stroop) and the same machinery drives
 * the `RULE CHANGED` telegraph.
 *
 * The schedule draws from its own derived RNG stream so it never perturbs the
 * scene-generation RNG, keeping prior seed-based scenes byte-for-byte stable.
 */
import { makeRng } from './rng.js';

export const DEFAULT_EPOCH_LENGTH = 5;

export const RULE_CATALOG = {
  greyDot: { variants: ['normal'] },
  blueRed: { variants: ['normal', 'inverted'] },
  stroop: { variants: ['normal'] },
};

export function epochIndexForRound(roundIndex, epochLength = DEFAULT_EPOCH_LENGTH) {
  return Math.floor(roundIndex / epochLength);
}

export function isEpochBoundary(roundIndex, epochLength = DEFAULT_EPOCH_LENGTH) {
  return roundIndex > 0 && roundIndex % epochLength === 0;
}

export function createRuleSchedule({
  seed = 0,
  epochLength = DEFAULT_EPOCH_LENGTH,
  rules = ['greyDot'],
  catalog = RULE_CATALOG,
} = {}) {
  const cache = new Map();

  function forEpoch(epochIndex) {
    if (cache.has(epochIndex)) return cache.get(epochIndex);
    // Derive a per-epoch RNG so the choice is deterministic in `seed` and the
    // epoch index, independent of how many random draws scenes consume.
    const rng = makeRng(((seed >>> 0) ^ 0x9e3779b9) + epochIndex * 0x85ebca6b);
    // A pool entry is either a bare rule id ('blueRed') or a rule modifier object
    // ({ rule, variant }) that pins a specific variant (e.g. the inverted Blue/Red
    // modifier), so it reliably appears and is telegraphed as its own rule state.
    const choice = rng.pick(rules);
    const rule = typeof choice === 'string' ? choice : choice.rule;
    const forcedVariant = typeof choice === 'string' ? undefined : choice.variant;
    const variants = catalog[rule]?.variants ?? ['normal'];
    const ruleVariant = forcedVariant ?? rng.pick(variants);
    const value = { epochIndex, rule, ruleVariant };
    cache.set(epochIndex, value);
    return value;
  }

  function forRound(roundIndex) {
    return forEpoch(epochIndexForRound(roundIndex, epochLength));
  }

  return { epochLength, forEpoch, forRound };
}
