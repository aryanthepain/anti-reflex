/**
 * judge — the single source of fairness truth (pure logic, no DOM).
 *
 * `correctAction(scene)` derives the one correct action ('left'|'right'|'resist')
 * for the scene under its active rule. `judge(scene, input)` resolves a player's
 * normalized InputEvent into `{ outcome, reason }`.
 *
 * This slice implements Rule 1 — Grey dot, Rule 2 — Blue/Red, and Rule 3 — Stroop.
 * Further rules are added in later slices.
 */

const STROOP_INK_ACTION = {
  green: 'left',
  orange: 'right',
  grey: 'resist',
};

function trueCue(scene) {
  return scene.elements.find((el) => el.role === 'trueCue');
}

export function correctAction(scene) {
  switch (scene.activeRule) {
    case 'greyDot': {
      const cue = trueCue(scene);
      return cue.side; // press the side the grey dot is on
    }
    case 'blueRed': {
      const cue = trueCue(scene);
      const inverted = scene.ruleVariant === 'inverted';
      // Normal: blue is GO (press its side), red is STOP (resist). Inverted flips.
      const goColor = inverted ? 'red' : 'blue';
      return cue.color === goColor ? cue.side : 'resist';
    }
    case 'stroop': {
      const cue = trueCue(scene);
      // Obey the ink color, not the word. The word is decorative bait.
      const action = STROOP_INK_ACTION[cue.ink];
      if (!action) throw new Error(`Unknown Stroop ink: ${cue.ink}`);
      return action;
    }
    default:
      throw new Error(`Unknown rule: ${scene.activeRule}`);
  }
}

export function judge(scene, input) {
  const action = input.action ?? 'resist';

  // Baits (honeypot / peripheral) are harmless visual decoys: a press on one is
  // judged purely on its side and timing, exactly like a keyboard / zone press.
  // Timing: an input before the window opens is too early.
  if (action !== 'resist' && typeof input.pressMs === 'number' && input.pressMs < 0) {
    return { outcome: 'wrong', reason: 'tooEarly' };
  }

  const correct = correctAction(scene);

  if (action === correct) {
    return { outcome: 'correct', reason: 'correct' };
  }

  if (action === 'resist') {
    return { outcome: 'wrong', reason: 'shouldHavePressed' };
  }

  if (correct === 'resist') {
    return { outcome: 'wrong', reason: 'shouldResist' };
  }

  return { outcome: 'wrong', reason: 'wrongSide' };
}
