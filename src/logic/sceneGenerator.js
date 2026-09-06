/**
 * sceneGenerator — pure, seedable scene construction (no DOM).
 *
 * Given the active rule, a seedable RNG, and difficulty params, it returns a
 * Scene descriptor. It guarantees the fairness invariant: exactly one trueCue
 * and exactly one correct action under the active rule (cross-checked in tests
 * against `judge`).
 *
 * This slice implements Rule 1 — Grey dot.
 */
const SIDES = ['left', 'right'];

const STROOP_INKS = [
  { ink: 'green', shape: 'triangle', shapeLabel: '▲' },
  { ink: 'orange', shape: 'diamond', shapeLabel: '◆' },
  { ink: 'grey', shape: 'bar', shapeLabel: '▬' },
];

const STROOP_WORDS = ['LEFT', 'RIGHT', 'RESIST'];

function opposite(side) {
  return side === 'left' ? 'right' : 'left';
}

// The honeypot is a persistent, tempting button placed on one side. It is a
// `bait`: pressing it is always judged wrong (baitPressed), even when it happens
// to sit on the side the active rule wants. Appended last so the rule-relevant
// elements stay byte-stable for a given seed.
function makeHoneypot(rng) {
  return {
    id: 'honeypot',
    role: 'bait',
    type: 'honeypot',
    side: rng.pick(SIDES),
    inputSource: 'honeypot',
    shapeLabel: 'TRAP',
  };
}

// Peripheral baits are flashy distractors that twitch in the periphery but are
// never the answer. They carry inputSource 'peripheral-bait' so the bait-source
// rule in judge marks any press baitPressed. Their count is bounded by the
// escalation `maxBaitCount`. Appended after the honeypot so prior seed-based
// cue/decoy/honeypot values stay byte-stable.
function makePeripheralBaits(rng, maxBaitCount = 1) {
  const max = Math.max(1, maxBaitCount);
  const count = 1 + rng.int(max);
  const baits = [];
  for (let i = 0; i < count; i++) {
    baits.push({
      id: `peripheral-bait-${i}`,
      role: 'bait',
      type: 'peripheral-bait',
      side: rng.pick(SIDES),
      inputSource: 'peripheral-bait',
      motion: 'flash',
      shapeLabel: 'BAIT',
    });
  }
  return baits;
}

function generateGreyDot({ rng, inputWindowMs, maxBaitCount = 1, ruleVariant = 'normal' }) {
  const cueSide = rng.pick(SIDES);
  const decoySide = opposite(cueSide);

  const elements = [
    {
      id: 'cue',
      role: 'trueCue',
      type: 'dot',
      side: cueSide,
      color: 'grey',
      shape: 'disc',
      shapeLabel: 'DOT',
    },
  ];

  // One or more bright decoys on the opposite side. Bounded by maxBaitCount.
  // They carry a distinct shape ('burst') and label ('HOT') so the calm grey
  // cue is distinguishable from the bright decoys without relying on color.
  const decoyCount = 1 + rng.int(Math.max(1, maxBaitCount));
  for (let i = 0; i < decoyCount; i++) {
    elements.push({
      id: `decoy-${i}`,
      role: 'decoy',
      type: 'dot',
      side: decoySide,
      color: 'bright',
      shape: 'burst',
      shapeLabel: 'HOT',
    });
  }

  return {
    activeRule: 'greyDot',
    ruleVariant,
    inputWindowMs,
    elements,
  };
}

function generateBlueRed({ rng, inputWindowMs, ruleVariant = 'normal' }) {
  const cueSide = rng.pick(SIDES);
  const color = rng.pick(['blue', 'red']);
  const accessible =
    color === 'blue'
      ? { shape: 'circle', shapeLabel: 'GO' }
      : { shape: 'octagon', shapeLabel: 'STOP' };

  const elements = [
    {
      id: 'cue',
      role: 'trueCue',
      type: 'colorCue',
      side: cueSide,
      color,
      shape: accessible.shape,
      shapeLabel: accessible.shapeLabel,
    },
  ];

  return {
    activeRule: 'blueRed',
    ruleVariant,
    inputWindowMs,
    elements,
  };
}

function generateStroop({ rng, inputWindowMs, ruleVariant = 'normal' }) {
  const { ink, shape, shapeLabel } = rng.pick(STROOP_INKS);
  // The displayed word is decorative bait; it may contradict the ink.
  const word = rng.pick(STROOP_WORDS);

  const elements = [
    {
      id: 'cue',
      role: 'trueCue',
      type: 'stroop',
      ink,
      word,
      shape,
      shapeLabel,
    },
  ];

  return {
    activeRule: 'stroop',
    ruleVariant,
    inputWindowMs,
    elements,
  };
}

export function generateScene({ rule, rng, inputWindowMs, maxBaitCount, ruleVariant }) {
  let scene;
  switch (rule) {
    case 'greyDot':
      scene = generateGreyDot({ rng, inputWindowMs, maxBaitCount, ruleVariant });
      break;
    case 'blueRed':
      scene = generateBlueRed({ rng, inputWindowMs, ruleVariant });
      break;
    case 'stroop':
      scene = generateStroop({ rng, inputWindowMs, ruleVariant });
      break;
    default:
      throw new Error(`Unknown rule: ${rule}`);
  }
  // The honeypot bait is shared across every rule and appended last.
  scene.elements.push(makeHoneypot(rng));
  // Peripheral baits follow the honeypot, bounded by maxBaitCount.
  scene.elements.push(...makePeripheralBaits(rng, maxBaitCount));
  return scene;
}
