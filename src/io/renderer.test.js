import { describe, it, expect } from 'vitest';
import { bannerText } from './renderer.js';

describe('bannerText', () => {
  it('states the grey-dot rule', () => {
    expect(bannerText('greyDot', 'normal')).toBe('PRESS THE SIDE OF THE GREY DOT');
  });

  it('reflects the active Blue/Red variant', () => {
    expect(bannerText('blueRed', 'normal')).toBe('REACT TO BLUE · RESIST RED');
    expect(bannerText('blueRed', 'inverted')).toBe('REACT TO RED · RESIST BLUE');
  });

  it('defaults to the normal variant when none is given', () => {
    expect(bannerText('blueRed')).toBe('REACT TO BLUE · RESIST RED');
  });

  it('states the Stroop rule', () => {
    expect(bannerText('stroop', 'normal')).toBe(
      'OBEY THE INK · ▲ GREEN→LEFT · ◆ ORANGE→RIGHT · ▬ GREY→RESIST',
    );
  });

  it('returns empty string for an unknown rule', () => {
    expect(bannerText('mystery', 'normal')).toBe('');
  });
});
