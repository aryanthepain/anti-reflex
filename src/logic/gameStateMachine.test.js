import { describe, it, expect } from 'vitest';
import { createGameStateMachine } from './gameStateMachine.js';
import { correctAction } from './judge.js';

function trueCueSide(snapshot) {
  return snapshot.scene.elements.find((el) => el.role === 'trueCue').side;
}

describe('gameStateMachine — menu', () => {
  it('starts on a menu snapshot surfacing the three actions', () => {
    const game = createGameStateMachine();
    const snap = game.getSnapshot();
    expect(snap.phase).toBe('menu');
    expect(snap.actions).toEqual(['left', 'right', 'resist']);
  });

  it('startRun transitions to a round snapshot at round 0', () => {
    const game = createGameStateMachine({ inputWindowMs: 1200 });
    const snap = game.startRun({ seed: 1 });
    expect(snap.phase).toBe('round');
    expect(snap.roundsSurvived).toBe(0);
    expect(snap.rule).toBe('greyDot');
    expect(snap.scene.activeRule).toBe('greyDot');
    expect(snap.inputWindowMs).toBe(1200);
    expect(snap.locked).toBe(false);
    expect(snap.judgment).toBeNull();
  });

  it('announces the opening rule with a dismissible popup when announceFirstRule is set', () => {
    const game = createGameStateMachine({ inputWindowMs: 1200, announceFirstRule: true });
    const start = game.startRun({ seed: 1 });
    // The run opens on the rule-announcement popup, not a live round.
    expect(start.phase).toBe('ruleChange');
    expect(start.previousRule).toBeNull();
    expect(start.rule).toBe('greyDot');
    expect(start.canDismiss).toBe(false);

    // It holds (never auto-advances) until the minimum display time elapses…
    game.tick(5000);
    expect(game.getSnapshot().phase).toBe('ruleChange');
    expect(game.getSnapshot().canDismiss).toBe(true);

    // …then acknowledging opens the first round at round 0.
    const round = game.acknowledge();
    expect(round.phase).toBe('round');
    expect(round.roundsSurvived).toBe(0);
    expect(round.rule).toBe('greyDot');
    expect(round.locked).toBe(false);
  });
});

describe('gameStateMachine — visible shrinking-window countdown', () => {
  it('exposes a window that opens and shrinks as the clock advances', () => {
    const game = createGameStateMachine({ inputWindowMs: 1000 });
    game.startRun({ seed: 1 });
    expect(game.getSnapshot().windowOpen).toBe(true);
    expect(game.getSnapshot().windowRemainingMs).toBe(1000);
    game.tick(300);
    expect(game.getSnapshot().windowRemainingMs).toBe(700);
    game.tick(900);
    expect(game.getSnapshot().windowRemainingMs).toBe(100);
  });
});

describe('gameStateMachine — timing phases', () => {
  it('tooEarly: an input before the cue reveal is judged wrong and locks the round', () => {
    const game = createGameStateMachine({ inputWindowMs: 1000, cueDelayMs: 500 });
    game.startRun({ seed: 1 });
    game.tick(200);
    expect(game.getSnapshot().windowOpen).toBe(false);
    const side = trueCueSide(game.getSnapshot());
    const snap = game.submitInput({ action: side, source: 'keyboard' });
    expect(snap.locked).toBe(true);
    expect(snap.judgment).toEqual({ outcome: 'wrong', reason: 'tooEarly' });
  });

  it('in-window: the first correct press is judged correct and locks the round', () => {
    const game = createGameStateMachine({ inputWindowMs: 1000 });
    game.startRun({ seed: 1 });
    game.tick(200);
    const side = trueCueSide(game.getSnapshot());
    const snap = game.submitInput({ action: side, source: 'keyboard' });
    expect(snap.locked).toBe(true);
    expect(snap.judgment).toEqual({ outcome: 'correct', reason: 'correct' });
  });

  it('expiry: a window that lapses with no input resolves as resist', () => {
    const game = createGameStateMachine({ inputWindowMs: 1000 });
    const start = game.startRun({ seed: 1 });
    // greyDot always requires a press, so a resist at expiry is wrong.
    expect(correctAction(start.scene)).not.toBe('resist');
    game.tick(1000);
    const snap = game.getSnapshot();
    expect(snap.locked).toBe(true);
    expect(snap.windowOpen).toBe(false);
    expect(snap.judgment).toEqual({ outcome: 'wrong', reason: 'shouldHavePressed' });
  });

  it('late input after a round is locked is ignored', () => {
    const game = createGameStateMachine({ inputWindowMs: 1000 });
    game.startRun({ seed: 1 });
    game.tick(200);
    const side = trueCueSide(game.getSnapshot());
    game.submitInput({ action: side, source: 'keyboard' });
    const locked = game.getSnapshot();
    const after = game.submitInput({ action: side === 'left' ? 'right' : 'left', source: 'keyboard' });
    expect(after.judgment).toEqual(locked.judgment);
  });
});

describe('gameStateMachine — round advance', () => {
  it('advances to the next round after the result delay', () => {
    const game = createGameStateMachine({ inputWindowMs: 1000, resultDelayMs: 600 });
    game.startRun({ seed: 1 });
    game.tick(200);
    const side = trueCueSide(game.getSnapshot());
    game.submitInput({ action: side, source: 'keyboard' });
    expect(game.getSnapshot().locked).toBe(true);
    expect(game.getSnapshot().roundsSurvived).toBe(0);
    game.tick(200 + 600);
    const next = game.getSnapshot();
    expect(next.phase).toBe('round');
    expect(next.roundsSurvived).toBe(1);
    expect(next.locked).toBe(false);
    expect(next.judgment).toBeNull();
  });
});

describe('gameStateMachine — scoring, strikes & gameOver', () => {
  function makePlayer(game) {
    let clock = 0;
    return function playRound(outcome, { resultDelayMs = 600 } = {}) {
      const round = game.getSnapshot();
      const correct = trueCueSide(round);
      const action = outcome === 'correct' ? correct : (correct === 'left' ? 'right' : 'left');
      clock = round.cueRevealMs + 50;
      game.tick(clock);
      const resolved = game.submitInput({ action, source: 'keyboard' });
      clock = clock + resultDelayMs + 1;
      game.tick(clock);
      // A wrong outcome now pauses on the strike screen instead of auto-advancing;
      // wait past the minimum hold and acknowledge it to reach the next round.
      if (game.getSnapshot().phase === 'strike') {
        clock = clock + 1000;
        game.tick(clock);
        game.acknowledge();
      }
      return resolved;
    };
  }

  it('surfaces a running score, combo, and strikes during play', () => {
    const game = createGameStateMachine();
    const start = game.startRun({ seed: 1 });
    expect(start.score).toBe(0);
    expect(start.combo).toBe(1);
    expect(start.strikes).toBe(0);

    const play = makePlayer(game);
    const r1 = play('correct');
    expect(r1.score).toBeGreaterThan(0);
    expect(r1.combo).toBe(1);
    expect(game.getSnapshot().strikes).toBe(0);
  });

  it('climbs the combo on consecutive correct and resets it on a strike', () => {
    const game = createGameStateMachine();
    game.startRun({ seed: 1 });
    const play = makePlayer(game);
    play('correct');
    expect(game.getSnapshot().combo).toBe(1);
    play('correct');
    expect(game.getSnapshot().combo).toBe(2);
    const struck = play('strike');
    expect(struck.strikes).toBe(1);
    expect(game.getSnapshot().combo).toBe(1);
  });

  it('ends the run at exactly three strikes with a gameOver snapshot', () => {
    const game = createGameStateMachine();
    game.startRun({ seed: 1 });
    const play = makePlayer(game);
    play('strike');
    expect(game.getSnapshot().phase).toBe('round');
    expect(game.getSnapshot().strikes).toBe(1);
    play('strike');
    expect(game.getSnapshot().phase).toBe('round');
    expect(game.getSnapshot().strikes).toBe(2);
    play('strike');
    const over = game.getSnapshot();
    expect(over.phase).toBe('gameOver');
    expect(over.strikes).toBe(3);
    expect(typeof over.score).toBe('number');
  });

  it('ignores input after the run is over', () => {
    const game = createGameStateMachine();
    game.startRun({ seed: 1 });
    const play = makePlayer(game);
    play('strike');
    play('strike');
    play('strike');
    expect(game.getSnapshot().phase).toBe('gameOver');
    const after = game.submitInput({ action: 'left', source: 'keyboard' });
    expect(after.phase).toBe('gameOver');
  });
});

describe('gameStateMachine — escalation wiring', () => {
  it('escalates the input window from the curve as rounds are survived', () => {
    const game = createGameStateMachine(); // no fixed window → escalation drives it
    const snap = game.startRun({ seed: 7 });
    expect(snap.inputWindowMs).toBe(3000); // roundsSurvived 0
    let clock = 0;
    for (let i = 0; i < 4; i++) {
      const round = game.getSnapshot();
      const correct = trueCueSide(round);
      clock = round.cueRevealMs + 50;
      game.tick(clock);
      game.submitInput({ action: correct, source: 'keyboard' });
      clock = clock + 601;
      game.tick(clock);
    }
    expect(game.getSnapshot().roundsSurvived).toBe(4);
    expect(game.getSnapshot().inputWindowMs).toBe(2400);
  });
});

describe('gameStateMachine — rule-epoch telegraph (ruleChange)', () => {
  // A schedule with single-round epochs that alternates the greyDot variant, so
  // every advance crosses an epoch boundary that actually changes the rule state
  // and must be telegraphed. (greyDot judging ignores the variant, so judging
  // stays valid while the mechanism is exercised end to end.)
  function alternatingSchedule() {
    return {
      epochLength: 1,
      forEpoch: (e) => ({ epochIndex: e, rule: 'greyDot', ruleVariant: e % 2 === 0 ? 'normal' : 'inverted' }),
      forRound(r) {
        return this.forEpoch(r);
      },
    };
  }

  function advanceToResolveAndAdvance(game, { cueRevealMs, resultDelayMs = 600 }) {
    const round = game.getSnapshot();
    const side = trueCueSide(round);
    game.tick(round.cueRevealMs + 50);
    game.submitInput({ action: side, source: 'keyboard' });
    game.tick(round.cueRevealMs + 50 + resultDelayMs + 1);
  }

  it('keeps the rule/variant constant within an epoch (default greyDot pool never telegraphs)', () => {
    const game = createGameStateMachine();
    let snap = game.startRun({ seed: 1 });
    expect(snap.rule).toBe('greyDot');
    expect(snap.ruleVariant).toBe('normal');
    for (let i = 0; i < 8; i++) {
      advanceToResolveAndAdvance(game, {});
      snap = game.getSnapshot();
      expect(snap.phase).toBe('round');
      expect(snap.rule).toBe('greyDot');
      expect(snap.ruleVariant).toBe('normal');
    }
  });

  it('emits a ruleChange snapshot with a 1500ms flash at an epoch boundary', () => {
    const game = createGameStateMachine({ ruleSchedule: alternatingSchedule() });
    const start = game.startRun({ seed: 1 });
    expect(start.phase).toBe('round');
    expect(start.ruleVariant).toBe('normal');

    advanceToResolveAndAdvance(game, {});
    const flash = game.getSnapshot();
    expect(flash.phase).toBe('ruleChange');
    expect(flash.rule).toBe('greyDot');
    expect(flash.ruleVariant).toBe('inverted');
    expect(flash.previousRuleVariant).toBe('normal');
    expect(flash.flashRemainingMs).toBe(1500);
  });

  it('disables input during the flash and opens the next window only after the player acknowledges', () => {
    const game = createGameStateMachine({ ruleSchedule: alternatingSchedule() });
    game.startRun({ seed: 1 });
    // round 0: cueReveal at 0, press at 50, resolve, advance after resultDelay (600)+1
    game.tick(50);
    const side = trueCueSide(game.getSnapshot());
    game.submitInput({ action: side, source: 'keyboard' });
    game.tick(651); // crosses into the epoch boundary → ruleChange flash begins at 651
    const flashStart = game.getSnapshot();
    expect(flashStart.phase).toBe('ruleChange');
    expect(flashStart.flashRemainingMs).toBe(1500);
    expect(flashStart.canDismiss).toBe(false);

    // input during the minimum-display flash is ignored — phase stays ruleChange
    const ignored = game.submitInput({ action: 'left', source: 'keyboard' });
    expect(ignored.phase).toBe('ruleChange');

    // partway through the flash it is not yet dismissible, and acknowledging no-ops
    game.tick(651 + 700);
    const mid = game.getSnapshot();
    expect(mid.phase).toBe('ruleChange');
    expect(mid.flashRemainingMs).toBe(800);
    expect(mid.canDismiss).toBe(false);
    expect(game.acknowledge().phase).toBe('ruleChange');

    // once the 1500ms minimum elapses it becomes dismissible but never auto-advances
    game.tick(651 + 1500);
    expect(game.getSnapshot().canDismiss).toBe(true);
    game.tick(651 + 9000);
    expect(game.getSnapshot().phase).toBe('ruleChange');

    // acknowledging opens the next round with the new variant
    const next = game.acknowledge();
    expect(next.phase).toBe('round');
    expect(next.ruleVariant).toBe('inverted');
    expect(next.windowOpen).toBe(true);
    expect(next.locked).toBe(false);
  });

  it('never changes the rule during an active input window', () => {
    const game = createGameStateMachine({ ruleSchedule: alternatingSchedule() });
    const start = game.startRun({ seed: 1 });
    const variantAtStart = start.ruleVariant;
    // tick across the whole window; the variant must not change mid-round
    for (let t = 0; t <= start.inputWindowMs; t += 100) {
      game.tick(t);
      const snap = game.getSnapshot();
      if (snap.phase === 'round') {
        expect(snap.ruleVariant).toBe(variantAtStart);
      }
    }
  });
});

describe('gameStateMachine — determinism & immutability', () => {
  it('is deterministic for a given seed', () => {
    const sceneFor = (seed) => {
      const game = createGameStateMachine();
      return JSON.stringify(game.startRun({ seed }).scene);
    };
    expect(sceneFor(42)).toBe(sceneFor(42));
  });

  it('emits immutable snapshots', () => {
    const game = createGameStateMachine();
    const snap = game.startRun({ seed: 1 });
    expect(Object.isFrozen(snap)).toBe(true);
    expect(() => {
      snap.locked = true;
    }).toThrow();
    expect(game.getSnapshot().locked).toBe(false);
  });

  it('startRun resets the run', () => {
    const game = createGameStateMachine({ inputWindowMs: 1000 });
    game.startRun({ seed: 1 });
    game.tick(1000);
    game.tick(1600);
    // The timeout is a strike, which pauses on the strike screen; acknowledge it.
    game.tick(2200);
    game.acknowledge();
    expect(game.getSnapshot().roundsSurvived).toBe(1);
    const restarted = game.startRun({ seed: 1 });
    expect(restarted.roundsSurvived).toBe(0);
    expect(restarted.locked).toBe(false);
  });
});
