import { describe, it, expect } from 'vitest';
import { judge, correctAction } from './judge.js';

function greyDotScene(side) {
  const decoySide = side === 'left' ? 'right' : 'left';
  return {
    activeRule: 'greyDot',
    ruleVariant: 'normal',
    inputWindowMs: 1200,
    elements: [
      {
        id: 'cue',
        role: 'trueCue',
        type: 'dot',
        side,
        color: 'grey',
        shapeLabel: 'DOT',
      },
      {
        id: 'decoy',
        role: 'decoy',
        type: 'dot',
        side: decoySide,
        color: 'bright',
        shapeLabel: 'DOT',
      },
    ],
  };
}

function blueRedScene(color, side, ruleVariant = 'normal') {
  return {
    activeRule: 'blueRed',
    ruleVariant,
    inputWindowMs: 1200,
    elements: [
      {
        id: 'cue',
        role: 'trueCue',
        type: 'colorCue',
        side,
        color,
        shape: color === 'blue' ? 'circle' : 'octagon',
        shapeLabel: color === 'blue' ? 'GO' : 'STOP',
      },
    ],
  };
}

describe('correctAction (blueRed)', () => {
  it('normal: blue cue → press its side, red cue → resist', () => {
    expect(correctAction(blueRedScene('blue', 'left', 'normal'))).toBe('left');
    expect(correctAction(blueRedScene('blue', 'right', 'normal'))).toBe('right');
    expect(correctAction(blueRedScene('red', 'left', 'normal'))).toBe('resist');
    expect(correctAction(blueRedScene('red', 'right', 'normal'))).toBe('resist');
  });

  it('inverted: red cue → press its side, blue cue → resist', () => {
    expect(correctAction(blueRedScene('red', 'left', 'inverted'))).toBe('left');
    expect(correctAction(blueRedScene('red', 'right', 'inverted'))).toBe('right');
    expect(correctAction(blueRedScene('blue', 'left', 'inverted'))).toBe('resist');
    expect(correctAction(blueRedScene('blue', 'right', 'inverted'))).toBe('resist');
  });
});

describe('judge (blueRed)', () => {
  it('blue-normal: pressing the cue side is correct, the other side is wrongSide', () => {
    const scene = blueRedScene('blue', 'left', 'normal');
    expect(judge(scene, { action: 'left', source: 'keyboard', pressMs: 200 })).toEqual({
      outcome: 'correct',
      reason: 'correct',
    });
    expect(judge(scene, { action: 'right', source: 'keyboard', pressMs: 200 })).toEqual({
      outcome: 'wrong',
      reason: 'wrongSide',
    });
    expect(judge(scene, { action: 'resist', source: 'keyboard' })).toEqual({
      outcome: 'wrong',
      reason: 'shouldHavePressed',
    });
  });

  it('red-normal: resisting is correct, pressing is shouldResist', () => {
    const scene = blueRedScene('red', 'right', 'normal');
    expect(judge(scene, { action: 'resist', source: 'keyboard' })).toEqual({
      outcome: 'correct',
      reason: 'correct',
    });
    expect(judge(scene, { action: 'right', source: 'keyboard', pressMs: 200 })).toEqual({
      outcome: 'wrong',
      reason: 'shouldResist',
    });
  });

  it('red-inverted: pressing the cue side is correct, blue-inverted resist is correct', () => {
    const red = blueRedScene('red', 'left', 'inverted');
    expect(judge(red, { action: 'left', source: 'keyboard', pressMs: 200 })).toEqual({
      outcome: 'correct',
      reason: 'correct',
    });
    const blue = blueRedScene('blue', 'left', 'inverted');
    expect(judge(blue, { action: 'resist', source: 'keyboard' })).toEqual({
      outcome: 'correct',
      reason: 'correct',
    });
    expect(judge(blue, { action: 'left', source: 'keyboard', pressMs: 200 })).toEqual({
      outcome: 'wrong',
      reason: 'shouldResist',
    });
  });
});

function stroopScene(ink, word) {
  const byInk = {
    green: { side: 'left', shape: 'triangle', shapeLabel: '▲L' },
    orange: { side: 'right', shape: 'diamond', shapeLabel: '◆R' },
    grey: { side: 'resist', shape: 'bar', shapeLabel: '▬X' },
  };
  const a = byInk[ink];
  return {
    activeRule: 'stroop',
    ruleVariant: 'normal',
    inputWindowMs: 1100,
    elements: [
      {
        id: 'cue',
        role: 'trueCue',
        type: 'stroop',
        ink,
        word,
        shape: a.shape,
        shapeLabel: a.shapeLabel,
      },
    ],
  };
}

describe('correctAction (stroop)', () => {
  it('keys off ink color, not the word', () => {
    // green ink → left, even when the word says RIGHT
    expect(correctAction(stroopScene('green', 'RIGHT'))).toBe('left');
    // orange ink → right, even when the word says LEFT
    expect(correctAction(stroopScene('orange', 'LEFT'))).toBe('right');
    // grey ink → resist, even when the word says LEFT
    expect(correctAction(stroopScene('grey', 'LEFT'))).toBe('resist');
  });
});

describe('judge (stroop)', () => {
  it('green ink with contradicting word: pressing left is correct', () => {
    const scene = stroopScene('green', 'RIGHT');
    expect(judge(scene, { action: 'left', source: 'keyboard', pressMs: 200 })).toEqual({
      outcome: 'correct',
      reason: 'correct',
    });
    expect(judge(scene, { action: 'right', source: 'keyboard', pressMs: 200 })).toEqual({
      outcome: 'wrong',
      reason: 'wrongSide',
    });
  });

  it('orange ink with contradicting word: pressing right is correct', () => {
    const scene = stroopScene('orange', 'LEFT');
    expect(judge(scene, { action: 'right', source: 'keyboard', pressMs: 200 })).toEqual({
      outcome: 'correct',
      reason: 'correct',
    });
    expect(judge(scene, { action: 'left', source: 'keyboard', pressMs: 200 })).toEqual({
      outcome: 'wrong',
      reason: 'wrongSide',
    });
  });

  it('grey ink with contradicting word: resisting is correct, pressing is shouldResist', () => {
    const scene = stroopScene('grey', 'LEFT');
    expect(judge(scene, { action: 'resist', source: 'keyboard' })).toEqual({
      outcome: 'correct',
      reason: 'correct',
    });
    expect(judge(scene, { action: 'left', source: 'keyboard', pressMs: 200 })).toEqual({
      outcome: 'wrong',
      reason: 'shouldResist',
    });
  });
});

describe('judge (bait source)', () => {
  it('a bait press is judged purely on its side, exactly like a keyboard press', () => {
    const scene = greyDotScene('left'); // correct action is left
    expect(judge(scene, { action: 'left', source: 'honeypot', pressMs: 200 })).toEqual({
      outcome: 'correct',
      reason: 'correct',
    });
    expect(judge(scene, { action: 'right', source: 'honeypot', pressMs: 200 })).toEqual({
      outcome: 'wrong',
      reason: 'wrongSide',
    });
  });

  it('a peripheral-bait press on the wrong side is wrong, like any wrong-side press', () => {
    const scene = greyDotScene('right'); // correct action is right
    expect(judge(scene, { action: 'left', source: 'peripheral-bait', pressMs: 200 })).toEqual({
      outcome: 'wrong',
      reason: 'wrongSide',
    });
  });

  it('a bait source is still subject to the same too-early timing rule', () => {
    const scene = greyDotScene('left');
    expect(judge(scene, { action: 'left', source: 'honeypot', pressMs: -10 })).toEqual({
      outcome: 'wrong',
      reason: 'tooEarly',
    });
  });

  it('keyboard and zone sources are still judged purely on side/timing', () => {
    const scene = greyDotScene('left');
    expect(judge(scene, { action: 'left', source: 'keyboard', pressMs: 200 })).toEqual({
      outcome: 'correct',
      reason: 'correct',
    });
    expect(judge(scene, { action: 'left', source: 'left-zone', pressMs: 200 })).toEqual({
      outcome: 'correct',
      reason: 'correct',
    });
  });
});

describe('correctAction (greyDot)', () => {
  it('is the side of the grey dot', () => {
    expect(correctAction(greyDotScene('left'))).toBe('left');
    expect(correctAction(greyDotScene('right'))).toBe('right');
  });
});

describe('judge (greyDot)', () => {
  it('pressing the grey dot side is correct', () => {
    const scene = greyDotScene('left');
    expect(judge(scene, { action: 'left', source: 'keyboard', pressMs: 200 })).toEqual({
      outcome: 'correct',
      reason: 'correct',
    });
  });

  it('pressing the decoy side is wrong (wrongSide)', () => {
    const scene = greyDotScene('left');
    expect(judge(scene, { action: 'right', source: 'keyboard', pressMs: 200 })).toEqual({
      outcome: 'wrong',
      reason: 'wrongSide',
    });
  });

  it('resisting when a press is required is wrong (shouldHavePressed)', () => {
    const scene = greyDotScene('right');
    expect(judge(scene, { action: 'resist', source: 'keyboard' })).toEqual({
      outcome: 'wrong',
      reason: 'shouldHavePressed',
    });
  });

  it('an input before the window opens is too early', () => {
    const scene = greyDotScene('left');
    expect(judge(scene, { action: 'left', source: 'keyboard', pressMs: -10 })).toEqual({
      outcome: 'wrong',
      reason: 'tooEarly',
    });
  });

  it('treats a missing action as resist at window expiry', () => {
    const scene = greyDotScene('left');
    expect(judge(scene, { action: 'resist' }).outcome).toBe('wrong');
  });
});
