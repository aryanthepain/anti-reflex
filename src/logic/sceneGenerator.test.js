import { describe, it, expect } from 'vitest';
import { generateScene } from './sceneGenerator.js';
import { makeRng } from './rng.js';
import { judge, correctAction } from './judge.js';

const ACTIONS = ['left', 'right', 'resist'];

function countCorrect(scene) {
  return ACTIONS.filter(
    (action) => judge(scene, { action, source: 'keyboard', pressMs: 100 }).outcome === 'correct',
  ).length;
}

describe('generateScene (blueRed)', () => {
  it('is deterministic for a given seed and variant', () => {
    const a = generateScene({
      rule: 'blueRed',
      rng: makeRng(7),
      inputWindowMs: 1100,
      ruleVariant: 'normal',
    });
    const b = generateScene({
      rule: 'blueRed',
      rng: makeRng(7),
      inputWindowMs: 1100,
      ruleVariant: 'normal',
    });
    expect(a).toEqual(b);
  });

  it('emits exactly one trueCue colorCue carrying its paired shape and label', () => {
    for (let seed = 0; seed < 200; seed++) {
      const scene = generateScene({
        rule: 'blueRed',
        rng: makeRng(seed),
        inputWindowMs: 1100,
        ruleVariant: 'normal',
      });
      const cues = scene.elements.filter((el) => el.role === 'trueCue');
      expect(cues).toHaveLength(1);
      const cue = cues[0];
      expect(cue.type).toBe('colorCue');
      expect(['left', 'right']).toContain(cue.side);
      expect(['blue', 'red']).toContain(cue.color);
      if (cue.color === 'blue') {
        expect(cue.shape).toBe('circle');
        expect(cue.shapeLabel).toBe('GO');
      } else {
        expect(cue.shape).toBe('octagon');
        expect(cue.shapeLabel).toBe('STOP');
      }
    }
  });

  it('cross-check: exactly one correct action for both variants', () => {
    for (const ruleVariant of ['normal', 'inverted']) {
      for (let seed = 0; seed < 250; seed++) {
        const scene = generateScene({
          rule: 'blueRed',
          rng: makeRng(seed),
          inputWindowMs: 1100,
          ruleVariant,
        });
        expect(countCorrect(scene)).toBe(1);
        expect(['left', 'right', 'resist']).toContain(correctAction(scene));
      }
    }
  });
});

describe('generateScene (stroop)', () => {
  it('is deterministic for a given seed', () => {
    const a = generateScene({ rule: 'stroop', rng: makeRng(11), inputWindowMs: 1000 });
    const b = generateScene({ rule: 'stroop', rng: makeRng(11), inputWindowMs: 1000 });
    expect(a).toEqual(b);
  });

  it('emits exactly one trueCue stroop element with ink, word, and paired shape/label', () => {
    for (let seed = 0; seed < 200; seed++) {
      const scene = generateScene({ rule: 'stroop', rng: makeRng(seed), inputWindowMs: 1000 });
      const cues = scene.elements.filter((el) => el.role === 'trueCue');
      expect(cues).toHaveLength(1);
      const cue = cues[0];
      expect(cue.type).toBe('stroop');
      expect(['green', 'orange', 'grey']).toContain(cue.ink);
      expect(['LEFT', 'RIGHT', 'RESIST']).toContain(cue.word);
      if (cue.ink === 'green') {
        expect(cue.shape).toBe('triangle');
        expect(cue.shapeLabel).toBe('▲');
      } else if (cue.ink === 'orange') {
        expect(cue.shape).toBe('diamond');
        expect(cue.shapeLabel).toBe('◆');
      } else {
        expect(cue.shape).toBe('bar');
        expect(cue.shapeLabel).toBe('▬');
      }
    }
  });

  it('produces scenes where the word contradicts the ink', () => {
    let contradictions = 0;
    const inkWord = { green: 'LEFT', orange: 'RIGHT', grey: 'RESIST' };
    for (let seed = 0; seed < 200; seed++) {
      const scene = generateScene({ rule: 'stroop', rng: makeRng(seed), inputWindowMs: 1000 });
      const cue = scene.elements.find((el) => el.role === 'trueCue');
      if (cue.word !== inkWord[cue.ink]) contradictions++;
    }
    expect(contradictions).toBeGreaterThan(0);
  });

  it('cross-check: exactly one correct action keyed off ink', () => {
    const inkAction = { green: 'left', orange: 'right', grey: 'resist' };
    for (let seed = 0; seed < 300; seed++) {
      const scene = generateScene({ rule: 'stroop', rng: makeRng(seed), inputWindowMs: 1000 });
      expect(countCorrect(scene)).toBe(1);
      const cue = scene.elements.find((el) => el.role === 'trueCue');
      expect(correctAction(scene)).toBe(inkAction[cue.ink]);
    }
  });
});

describe('generateScene (honeypot bait)', () => {
  const RULES = ['greyDot', 'blueRed', 'stroop'];

  it('places exactly one honeypot bait with inputSource honeypot in every scene', () => {
    for (const rule of RULES) {
      for (let seed = 0; seed < 100; seed++) {
        const scene = generateScene({ rule, rng: makeRng(seed), inputWindowMs: 1000 });
        const honeypots = scene.elements.filter((el) => el.inputSource === 'honeypot');
        expect(honeypots).toHaveLength(1);
        const hp = honeypots[0];
        expect(hp.role).toBe('bait');
        expect(hp.type).toBe('honeypot');
        expect(['left', 'right']).toContain(hp.side);
      }
    }
  });

  it('keeps exactly one correct action even when the honeypot lands on the correct side', () => {
    for (const rule of RULES) {
      for (let seed = 0; seed < 200; seed++) {
        const scene = generateScene({ rule, rng: makeRng(seed), inputWindowMs: 1000 });
        expect(countCorrect(scene)).toBe(1);
      }
    }
  });

  it('pressing the honeypot is judged exactly like a normal press on its side', () => {
    const scene = generateScene({ rule: 'greyDot', rng: makeRng(3), inputWindowMs: 1000 });
    const hp = scene.elements.find((el) => el.inputSource === 'honeypot');
    expect(judge(scene, { action: hp.side, source: 'honeypot', pressMs: 100 })).toEqual(
      judge(scene, { action: hp.side, source: 'keyboard', pressMs: 100 }),
    );
  });
});

describe('generateScene (peripheral bait)', () => {
  const RULES = ['greyDot', 'blueRed', 'stroop'];

  it('adds peripheral-bait elements (role bait) bounded by maxBaitCount across every rule', () => {
    for (const rule of RULES) {
      for (const maxBaitCount of [1, 2, 3, 5]) {
        for (let seed = 0; seed < 60; seed++) {
          const scene = generateScene({ rule, rng: makeRng(seed), inputWindowMs: 1000, maxBaitCount });
          const peripherals = scene.elements.filter((el) => el.inputSource === 'peripheral-bait');
          expect(peripherals.length).toBeGreaterThanOrEqual(1);
          expect(peripherals.length).toBeLessThanOrEqual(maxBaitCount);
          for (const p of peripherals) {
            expect(p.role).toBe('bait');
            expect(p.type).toBe('peripheral-bait');
            expect(['left', 'right']).toContain(p.side);
          }
        }
      }
    }
  });

  it('defaults to at most one peripheral bait when maxBaitCount is omitted', () => {
    const scene = generateScene({ rule: 'greyDot', rng: makeRng(2), inputWindowMs: 1000 });
    const peripherals = scene.elements.filter((el) => el.inputSource === 'peripheral-bait');
    expect(peripherals).toHaveLength(1);
  });

  it('pressing a peripheral bait is judged exactly like a normal press on its side', () => {
    const scene = generateScene({ rule: 'greyDot', rng: makeRng(4), inputWindowMs: 1000, maxBaitCount: 3 });
    const p = scene.elements.find((el) => el.inputSource === 'peripheral-bait');
    expect(judge(scene, { action: p.side, source: 'peripheral-bait', pressMs: 100 })).toEqual(
      judge(scene, { action: p.side, source: 'keyboard', pressMs: 100 }),
    );
  });

  it('keeps exactly one correct action even with many peripheral baits present', () => {
    for (const rule of RULES) {
      for (let seed = 0; seed < 120; seed++) {
        const scene = generateScene({ rule, rng: makeRng(seed), inputWindowMs: 1000, maxBaitCount: 5 });
        expect(countCorrect(scene)).toBe(1);
      }
    }
  });
});

describe('generateScene (greyDot)', () => {
  it('is deterministic for a given seed', () => {
    const a = generateScene({ rule: 'greyDot', rng: makeRng(123), inputWindowMs: 1200 });
    const b = generateScene({ rule: 'greyDot', rng: makeRng(123), inputWindowMs: 1200 });
    expect(a).toEqual(b);
  });

  it('emits the Scene schema', () => {
    const scene = generateScene({ rule: 'greyDot', rng: makeRng(1), inputWindowMs: 1200 });
    expect(scene.activeRule).toBe('greyDot');
    expect(scene.inputWindowMs).toBe(1200);
    expect(Array.isArray(scene.elements)).toBe(true);
    for (const el of scene.elements) {
      expect(el).toHaveProperty('id');
      expect(el).toHaveProperty('role');
      expect(el).toHaveProperty('type');
    }
  });

  it('contains exactly one trueCue', () => {
    for (let seed = 0; seed < 200; seed++) {
      const scene = generateScene({ rule: 'greyDot', rng: makeRng(seed), inputWindowMs: 1200 });
      const cues = scene.elements.filter((el) => el.role === 'trueCue');
      expect(cues).toHaveLength(1);
    }
  });

  it('the trueCue is a grey dot with a side', () => {
    const scene = generateScene({ rule: 'greyDot', rng: makeRng(5), inputWindowMs: 1200 });
    const cue = scene.elements.find((el) => el.role === 'trueCue');
    expect(cue.type).toBe('dot');
    expect(cue.color).toBe('grey');
    expect(cue.shapeLabel).toBe('DOT');
    expect(['left', 'right']).toContain(cue.side);
  });

  it('pairs the grey cue and bright decoys with distinct shapes and labels (color-blind safe)', () => {
    for (let seed = 0; seed < 100; seed++) {
      const scene = generateScene({ rule: 'greyDot', rng: makeRng(seed), inputWindowMs: 1200 });
      const cue = scene.elements.find((el) => el.role === 'trueCue');
      expect(cue.shape).toBe('disc');
      expect(cue.shapeLabel).toBe('DOT');
      const decoys = scene.elements.filter((el) => el.role === 'decoy');
      for (const d of decoys) {
        expect(d.shape).toBe('burst');
        expect(d.shapeLabel).toBe('HOT');
        // The decoy must be distinguishable from the calm cue without relying on color.
        expect(d.shape).not.toBe(cue.shape);
        expect(d.shapeLabel).not.toBe(cue.shapeLabel);
      }
    }
  });

  it('places decoys on the opposite side of the grey dot', () => {
    for (let seed = 0; seed < 50; seed++) {
      const scene = generateScene({ rule: 'greyDot', rng: makeRng(seed), inputWindowMs: 1200 });
      const cue = scene.elements.find((el) => el.role === 'trueCue');
      const decoys = scene.elements.filter((el) => el.role === 'decoy');
      expect(decoys.length).toBeGreaterThanOrEqual(1);
      for (const d of decoys) {
        expect(d.side).not.toBe(cue.side);
      }
    }
  });

  it('cross-check: every generated scene has exactly one correct action', () => {
    for (let seed = 0; seed < 500; seed++) {
      const scene = generateScene({ rule: 'greyDot', rng: makeRng(seed), inputWindowMs: 1200 });
      expect(countCorrect(scene)).toBe(1);
      // and that one correct action matches the cue side
      const cue = scene.elements.find((el) => el.role === 'trueCue');
      expect(correctAction(scene)).toBe(cue.side);
    }
  });
});
