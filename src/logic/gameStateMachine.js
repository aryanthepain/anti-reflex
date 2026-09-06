/**
 * gameStateMachine — the core round loop driven by an injected clock (pure logic).
 *
 * Public interface (PRD "State machine public interface & test clock"):
 *   - `startRun({ seed })` — begins a seeded run, returns the first round snapshot.
 *   - `submitInput({ action, source })` — feeds a normalized input; the machine
 *     stamps the press time from its own clock so timing is the single truth.
 *   - `tick(nowMs)` — advances time via the injected clock; all window/expiry
 *     logic flows through tick, never wall-clock timers, so tests are deterministic.
 *   - `getSnapshot()` — returns the current immutable snapshot.
 *
 * This slice emits `menu`, `round`, and `gameOver` snapshots. Scoring, the combo
 * multiplier, three strikes, and the escalation curve are wired in here; the
 * rule-epoch `ruleChange` telegraph (issue 004) layers on later.
 */
import { makeRng } from './rng.js';
import { generateScene } from './sceneGenerator.js';
import { judge } from './judge.js';
import { escalation } from './escalation.js';
import { initialScoringState, applyOutcome } from './scoring.js';
import { createRuleSchedule, DEFAULT_EPOCH_LENGTH } from './ruleEpoch.js';

const ACTIONS = ['left', 'right', 'resist'];
const MAX_STRIKES = 3;

function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const value of Object.values(obj)) deepFreeze(value);
  }
  return obj;
}

export function createGameStateMachine(options = {}) {
  const {
    cueDelayMs = 0,
    resultDelayMs = 600,
    epochLength = DEFAULT_EPOCH_LENGTH,
    ruleChangeFlashMs = 1500,
    announceFirstRule = false,
    strikeHoldMs = 500,
  } = options;

  // The rule pool the schedule draws from. With only greyDot available this slice
  // keeps the telegraph dormant; later slices widen the pool. A `ruleSchedule`
  // may be injected directly (used by tests to force telegraphed boundaries).
  const rules = options.rules ?? [options.rule ?? 'greyDot'];

  // When `inputWindowMs` is supplied it pins the window (used by tests); otherwise
  // the window is driven by the escalation curve from `roundsSurvived`.
  const fixedWindowMs = options.inputWindowMs;

  let state = { phase: 'menu' };

  function difficulty() {
    const curve = escalation(state.roundsSurvived);
    return {
      inputWindowMs: fixedWindowMs ?? curve.inputWindowMs,
      maxBaitCount: curve.maxBaitCount,
    };
  }

  function startRound() {
    const { inputWindowMs, maxBaitCount } = difficulty();
    const { rule, ruleVariant } = state.schedule.forRound(state.roundsSurvived);
    const scene = generateScene({
      rule,
      ruleVariant,
      rng: state.rng,
      inputWindowMs,
      maxBaitCount,
    });
    const cueRevealMs = state.currentMs + cueDelayMs;
    state.round = {
      scene,
      inputWindowMs,
      cueRevealMs,
      windowEndMs: cueRevealMs + inputWindowMs,
      locked: false,
      judgment: null,
      resolveMs: null,
    };
  }

  function resolve(judgment, resolveMs, { action, reactionMs }) {
    const round = state.round;
    round.locked = true;
    round.judgment = judgment;
    round.resolveMs = resolveMs;
    round.lastAction = action;
    round.lastReactionMs = reactionMs;
    state.scoring = applyOutcome(state.scoring, {
      outcome: judgment.outcome,
      action,
      reactionMs,
      windowMs: round.inputWindowMs,
    });
  }

  function buildSnapshot() {
    if (state.phase === 'menu') {
      return { phase: 'menu', actions: [...ACTIONS] };
    }
    if (state.phase === 'ruleChange') {
      const rc = state.ruleChange;
      return {
        phase: 'ruleChange',
        rule: rc.toRule,
        ruleVariant: rc.toVariant,
        previousRule: rc.fromRule,
        previousRuleVariant: rc.fromVariant,
        flashRemainingMs: Math.max(0, rc.endMs - state.currentMs),
        canDismiss: state.currentMs >= rc.endMs,
        roundsSurvived: state.roundsSurvived,
        score: state.scoring.score,
        combo: state.scoring.combo,
        strikes: state.scoring.strikes,
      };
    }
    if (state.phase === 'strike') {
      const round = state.round;
      return {
        phase: 'strike',
        rule: round.scene.activeRule,
        ruleVariant: round.scene.ruleVariant,
        judgment: round.judgment,
        lastAction: round.lastAction ?? null,
        lastReactionMs: round.lastReactionMs ?? null,
        inputWindowMs: round.inputWindowMs,
        canDismiss: state.currentMs >= state.strike.endMs,
        isFinalStrike: state.scoring.strikes >= MAX_STRIKES,
        roundsSurvived: state.roundsSurvived,
        score: state.scoring.score,
        combo: state.scoring.combo,
        strikes: state.scoring.strikes,
      };
    }
    if (state.phase === 'gameOver') {
      return {
        phase: 'gameOver',
        score: state.scoring.score,
        strikes: state.scoring.strikes,
        roundsSurvived: state.roundsSurvived,
      };
    }
    const round = state.round;
    const open =
      !round.locked &&
      state.currentMs >= round.cueRevealMs &&
      state.currentMs < round.windowEndMs;
    return {
      phase: 'round',
      roundsSurvived: state.roundsSurvived,
      rule: round.scene.activeRule,
      ruleVariant: round.scene.ruleVariant,
      scene: round.scene,
      inputWindowMs: round.inputWindowMs,
      cueRevealMs: round.cueRevealMs,
      windowOpen: open,
      windowRemainingMs: open ? Math.max(0, round.windowEndMs - state.currentMs) : 0,
      locked: round.locked,
      judgment: round.judgment,
      lastAction: round.lastAction ?? null,
      lastReactionMs: round.lastReactionMs ?? null,
      score: state.scoring.score,
      combo: state.scoring.combo,
      strikes: state.scoring.strikes,
    };
  }

  function snapshot() {
    return deepFreeze(buildSnapshot());
  }

  function startRun({ seed }) {
    state = {
      phase: 'round',
      seed,
      rng: makeRng(seed),
      schedule: options.ruleSchedule ?? createRuleSchedule({ seed, epochLength, rules }),
      roundsSurvived: 0,
      currentMs: 0,
      round: null,
      ruleChange: null,
      strike: null,
      scoring: initialScoringState(),
    };
    // When enabled, announce the opening rule with the same popup used for rule
    // changes (from null → first rule) so the player always sees the rule before
    // the first window opens. They acknowledge to begin; the first round is built
    // by `acknowledge`. Otherwise the first round opens immediately.
    if (announceFirstRule) {
      const opening = state.schedule.forRound(0);
      state.phase = 'ruleChange';
      state.ruleChange = {
        fromRule: null,
        fromVariant: null,
        toRule: opening.rule,
        toVariant: opening.ruleVariant,
        startMs: state.currentMs,
        endMs: state.currentMs + ruleChangeFlashMs,
      };
      return snapshot();
    }
    startRound();
    return snapshot();
  }

  function submitInput(inputEvent) {
    if (state.phase !== 'round') return snapshot();    const round = state.round;
    if (round.locked) return snapshot(); // late input ignored

    const action = inputEvent?.action ?? 'resist';
    const source = inputEvent?.source ?? 'keyboard';
    const pressMs = state.currentMs - round.cueRevealMs;
    const judgment = judge(round.scene, { action, source, pressMs });
    resolve(judgment, state.currentMs, { action, reactionMs: pressMs });
    return snapshot();
  }

  function advance() {
    if (state.scoring.strikes >= MAX_STRIKES) {
      state.phase = 'gameOver';
      return;
    }
    const current = state.schedule.forRound(state.roundsSurvived);
    const nextRound = state.roundsSurvived + 1;
    const upcoming = state.schedule.forRound(nextRound);
    state.roundsSurvived = nextRound;

    // A telegraphed rule/variant change happens only here, between rounds, at an
    // epoch boundary — never during an active window. Otherwise advance directly.
    if (upcoming.rule !== current.rule || upcoming.ruleVariant !== current.ruleVariant) {
      state.phase = 'ruleChange';
      state.ruleChange = {
        fromRule: current.rule,
        fromVariant: current.ruleVariant,
        toRule: upcoming.rule,
        toVariant: upcoming.ruleVariant,
        startMs: state.currentMs,
        endMs: state.currentMs + ruleChangeFlashMs,
      };
    } else {
      state.phase = 'round';
      startRound();
    }
  }

  function tick(nowMs) {
    state.currentMs = nowMs;

    // During the RULE CHANGED popup input is disabled until the minimum display
    // time (`ruleChangeFlashMs`) elapses; after that the popup holds and waits for
    // the player to acknowledge (`acknowledge()`) — it never auto-advances.
    if (state.phase === 'ruleChange') {
      return snapshot();
    }

    if (state.phase !== 'round') return snapshot();

    const round = state.round;

    // Window expiry with no input resolves to resist.
    if (!round.locked && state.currentMs >= round.windowEndMs) {
      const judgment = judge(round.scene, { action: 'resist' });
      resolve(judgment, round.windowEndMs, { action: 'resist', reactionMs: round.inputWindowMs });
    }

    // After the result delay: a wrong outcome is a strike, so pause on the strike
    // screen and wait for the player to acknowledge it (it never auto-advances).
    // A correct outcome auto-advances straight into the next round.
    if (round.locked && state.currentMs >= round.resolveMs + resultDelayMs) {
      if (round.judgment && round.judgment.outcome === 'wrong') {
        state.phase = 'strike';
        state.strike = { endMs: state.currentMs + strikeHoldMs };
      } else {
        advance();
      }
    }

    return snapshot();
  }

  // Dismiss the RULE CHANGED popup and open the next round. No-op until the
  // minimum display time has elapsed (`canDismiss`), so the player always sees the
  // new rule for a beat before any key press can skip it.
  function acknowledge() {
    if (state.phase === 'ruleChange') {
      if (state.currentMs < state.ruleChange.endMs) return snapshot();
      state.ruleChange = null;
      state.phase = 'round';
      startRound();
      return snapshot();
    }
    // Dismiss the strike screen. No-op until the minimum hold elapses; then
    // advance() ends the run at three strikes or opens the next round / telegraph.
    if (state.phase === 'strike') {
      if (state.currentMs < state.strike.endMs) return snapshot();
      state.strike = null;
      advance();
      return snapshot();
    }
    return snapshot();
  }

  return { startRun, submitInput, tick, acknowledge, getSnapshot: snapshot };
}
