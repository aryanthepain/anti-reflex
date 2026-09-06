/**
 * commentator — selects a roast line and formats the "betrayal" stat for a judged
 * mistake (pure data lookup, unit-tested).
 *
 * On each strike the run pauses for a roast screen. The commentator turns the
 * judge's `reason` (the mistake type) into a sassy line plus a one-liner that
 * quantifies the betrayal, e.g. "You reacted in 180ms… to the wrong thing."
 *
 * Guarantees (per the PRD test contract): it returns an appropriate roast for
 * each mistake type and never returns empty — an unknown reason falls back to a
 * generic pool so the screen always has something to say. An rng (anything with a
 * `pick(arr)` method, like `makeRng`) may be injected for deterministic selection;
 * without one a stable first line is used.
 */

// The mistake types mirror the judge's wrong-outcome `reason` values.
export const MISTAKE_TYPES = [
  'wrongSide',
  'shouldResist',
  'shouldHavePressed',
  'tooEarly',
  'baitPressed',
];

const ROAST_LINES = {
  // Pressed — but the other side.
  wrongSide: [
    'Confidently wrong. The other side, genius.',
    'You picked a side. Bold. Incorrect, but bold.',
    'Left, right… clearly not your strong suit.',
  ],
  // Pressed when the cue said do nothing.
  shouldResist: [
    'The answer was to chill. You chose chaos.',
    'Nobody asked you to touch anything. You touched it.',
    'Doing nothing was free. You spent it anyway.',
  ],
  // Resisted / froze when the cue demanded action.
  shouldHavePressed: [
    'A statue would have done the same. And lost.',
    'You out-thought yourself into doing nothing.',
    'The cue begged for a press. You ghosted it.',
  ],
  // Jumped before the cue even appeared.
  tooEarly: [
    'Reflexes: fast. Patience: not invited.',
    'You answered before the question. Classic.',
    'Itchy trigger finger strikes again.',
  ],
  // Took the obvious bait — never the answer.
  baitPressed: [
    'The shiny trap got you. It always gets you.',
    'Bait taken, hook, line, and composure.',
    'That button existed only to humiliate you. Mission accomplished.',
  ],
};

const GENERIC_ROASTS = [
  'That was a choice. A bad one, but a choice.',
  'Your instincts betrayed you again.',
  'Composure: misplaced.',
];

export function roastLines(mistakeType) {
  return ROAST_LINES[mistakeType] ?? GENERIC_ROASTS;
}

export function selectRoast(mistakeType, rng) {
  const lines = roastLines(mistakeType);
  if (rng && typeof rng.pick === 'function') {
    const line = rng.pick(lines);
    if (typeof line === 'string' && line.trim().length > 0) return line;
  }
  return lines[0];
}

function ms(value) {
  const n = Number.isFinite(value) ? Math.round(value) : 0;
  return Math.abs(n);
}

export function formatBetrayal({ mistakeType, reactionMs, windowMs } = {}) {
  switch (mistakeType) {
    case 'shouldResist':
      return `You reacted in ${ms(reactionMs)}ms… when the answer was to do nothing.`;
    case 'baitPressed':
      return `You reacted in ${ms(reactionMs)}ms… to a trap that was never the answer.`;
    case 'tooEarly':
      return `You jumped ${ms(reactionMs)}ms early… before the cue even appeared.`;
    case 'shouldHavePressed':
      return `You froze for the full ${ms(windowMs ?? reactionMs)}ms… when the cue demanded action.`;
    case 'wrongSide':
    default:
      return `You reacted in ${ms(reactionMs)}ms… to the wrong thing.`;
  }
}

/**
 * Turn a judgment into a roast screen payload. Returns `null` for a correct
 * outcome (there is nothing to roast); otherwise `{ mistakeType, roast, betrayal }`
 * with non-empty strings.
 */
export function commentate(judgment, { reactionMs, windowMs, rng } = {}) {
  if (!judgment || judgment.outcome === 'correct') return null;
  const mistakeType = judgment.reason ?? 'wrongSide';
  return {
    mistakeType,
    roast: selectRoast(mistakeType, rng),
    betrayal: formatBetrayal({ mistakeType, reactionMs, windowMs }),
  };
}
