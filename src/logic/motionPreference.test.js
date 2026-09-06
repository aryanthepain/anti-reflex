import { describe, it, expect } from 'vitest';
import {
  prefersReducedMotion,
  motionBodyClass,
  toggleLabel,
  createMotionController,
} from './motionPreference.js';

function fakeMatchMedia(matches) {
  return (query) => ({ media: query, matches });
}

describe('prefersReducedMotion', () => {
  it('reflects the OS prefers-reduced-motion query', () => {
    expect(prefersReducedMotion(fakeMatchMedia(true))).toBe(true);
    expect(prefersReducedMotion(fakeMatchMedia(false))).toBe(false);
  });

  it('defaults to false when matchMedia is unavailable', () => {
    expect(prefersReducedMotion(undefined)).toBe(false);
    expect(prefersReducedMotion(null)).toBe(false);
  });

  it('defaults to false when matchMedia throws', () => {
    const throwing = () => {
      throw new Error('no matchMedia');
    };
    expect(prefersReducedMotion(throwing)).toBe(false);
  });

  it('queries the reduce media feature', () => {
    let asked = '';
    prefersReducedMotion((query) => {
      asked = query;
      return { matches: false };
    });
    expect(asked).toBe('(prefers-reduced-motion: reduce)');
  });
});

describe('motionBodyClass / toggleLabel', () => {
  it('maps the reduced flag to a body class', () => {
    expect(motionBodyClass(true)).toBe('motion-reduced');
    expect(motionBodyClass(false)).toBe('motion-full');
  });

  it('labels the toggle by current state', () => {
    expect(toggleLabel(true)).toBe('Reduced motion: ON');
    expect(toggleLabel(false)).toBe('Reduced motion: OFF');
  });
});

describe('createMotionController', () => {
  it('defaults its state from prefers-reduced-motion', () => {
    expect(createMotionController({ matchMedia: fakeMatchMedia(true) }).isReduced()).toBe(true);
    expect(createMotionController({ matchMedia: fakeMatchMedia(false) }).isReduced()).toBe(false);
  });

  it('defaults to full motion when no matchMedia is provided', () => {
    const controller = createMotionController();
    expect(controller.isReduced()).toBe(false);
    expect(controller.bodyClass()).toBe('motion-full');
  });

  it('toggles between reduced and full motion', () => {
    const controller = createMotionController({ matchMedia: fakeMatchMedia(false) });
    expect(controller.toggle()).toBe(true);
    expect(controller.isReduced()).toBe(true);
    expect(controller.bodyClass()).toBe('motion-reduced');
    expect(controller.label()).toBe('Reduced motion: ON');
    expect(controller.toggle()).toBe(false);
    expect(controller.isReduced()).toBe(false);
  });

  it('lets callers force a specific state', () => {
    const controller = createMotionController({ matchMedia: fakeMatchMedia(true) });
    expect(controller.set(false)).toBe(false);
    expect(controller.isReduced()).toBe(false);
    expect(controller.set(true)).toBe(true);
    expect(controller.isReduced()).toBe(true);
  });
});
