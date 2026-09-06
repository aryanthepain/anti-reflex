import { describe, it, expect } from 'vitest';
import { inputEventFromKey, inputEventFromZone, inputEventFromBait } from './input.js';
import { judge } from '../logic/judge.js';

function greyDotScene(side) {
  const decoySide = side === 'left' ? 'right' : 'left';
  return {
    activeRule: 'greyDot',
    ruleVariant: 'normal',
    inputWindowMs: 1000,
    elements: [
      { id: 'cue', role: 'trueCue', type: 'dot', side, color: 'grey', shapeLabel: 'DOT' },
      { id: 'decoy', role: 'decoy', type: 'dot', side: decoySide, color: 'bright', shapeLabel: 'DOT' },
    ],
  };
}

describe('inputEventFromKey', () => {
  it('maps arrow keys to normalized keyboard events', () => {
    expect(inputEventFromKey('ArrowLeft', 100)).toEqual({ action: 'left', source: 'keyboard', pressMs: 100 });
    expect(inputEventFromKey('ArrowRight', 100)).toEqual({ action: 'right', source: 'keyboard', pressMs: 100 });
    expect(inputEventFromKey('Space', 100)).toBeNull();
  });
});

describe('inputEventFromZone', () => {
  it('maps the left half to a left-zone action and the right half to a right-zone action', () => {
    expect(inputEventFromZone(10, 200, 50)).toEqual({ action: 'left', source: 'left-zone', pressMs: 50 });
    expect(inputEventFromZone(150, 200, 50)).toEqual({ action: 'right', source: 'right-zone', pressMs: 50 });
  });

  it('puts the exact midpoint on the right half', () => {
    expect(inputEventFromZone(100, 200, 0).action).toBe('right');
  });
});

describe('inputEventFromBait', () => {
  it('normalizes a honeypot element into a honeypot-source event carrying its side', () => {
    const honeypot = { role: 'bait', type: 'honeypot', side: 'left', inputSource: 'honeypot' };
    expect(inputEventFromBait(honeypot, 120)).toEqual({
      action: 'left',
      source: 'honeypot',
      pressMs: 120,
    });
  });

  it('falls back to a resist action for a sideless bait', () => {
    const bait = { role: 'bait', type: 'peripheralBait', inputSource: 'peripheral-bait' };
    expect(inputEventFromBait(bait, 80)).toEqual({
      action: 'resist',
      source: 'peripheral-bait',
      pressMs: 80,
    });
  });

  it('a honeypot press on the correct side is judged correct, like a normal side press', () => {
    const scene = greyDotScene('left');
    const honeypot = { role: 'bait', type: 'honeypot', side: 'left', inputSource: 'honeypot' };
    expect(judge(scene, inputEventFromBait(honeypot, 100))).toEqual({
      outcome: 'correct',
      reason: 'correct',
    });
  });
});

describe('keyboard, click, and touch are judged identically', () => {
  it('a press on the cue side is correct regardless of source', () => {
    const scene = greyDotScene('left');
    const expected = { outcome: 'correct', reason: 'correct' };
    expect(judge(scene, inputEventFromKey('ArrowLeft', 100))).toEqual(expected);
    expect(judge(scene, inputEventFromZone(10, 200, 100))).toEqual(expected);
    // touch uses the same zone mapping
    expect(judge(scene, inputEventFromZone(40, 200, 100))).toEqual(expected);
  });
});
