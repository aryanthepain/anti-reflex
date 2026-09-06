import { describe, it, expect } from 'vitest';
import { buildShareText, copyShareText } from './shareCard.js';

describe('buildShareText', () => {
  it('never returns an empty string', () => {
    expect(buildShareText({ score: 0, best: 0, roundsSurvived: 0 }).length).toBeGreaterThan(0);
  });

  it('includes the composure score and rounds survived', () => {
    const text = buildShareText({ score: 1234, best: 2000, roundsSurvived: 7 });
    expect(text).toContain('1234');
    expect(text).toContain('7');
    expect(text).toContain('2000');
  });

  it('pluralizes rounds correctly', () => {
    expect(buildShareText({ score: 10, best: 10, roundsSurvived: 1 })).toContain('1 round');
    expect(buildShareText({ score: 10, best: 10, roundsSurvived: 1 })).not.toContain('1 rounds');
    expect(buildShareText({ score: 10, best: 10, roundsSurvived: 3 })).toContain('3 rounds');
  });

  it('announces a new personal best when flagged', () => {
    const text = buildShareText({ score: 500, best: 500, roundsSurvived: 4, isNewBest: true });
    expect(text.toLowerCase()).toContain('new');
    expect(text.toLowerCase()).toContain('best');
  });

  it('appends the url when provided', () => {
    const text = buildShareText({ score: 10, best: 10, roundsSurvived: 2, url: 'https://example.com/game' });
    expect(text).toContain('https://example.com/game');
  });
});

describe('copyShareText', () => {
  it('reports success when the clipboard writes', async () => {
    let written = '';
    const clipboard = {
      writeText: async (text) => {
        written = text;
      },
    };
    const result = await copyShareText('hello', { clipboard });
    expect(result).toEqual({ copied: true });
    expect(written).toBe('hello');
  });

  it('reports failure when the clipboard throws (fallback to manual copy)', async () => {
    const clipboard = {
      writeText: async () => {
        throw new Error('clipboard blocked');
      },
    };
    const result = await copyShareText('hello', { clipboard });
    expect(result).toEqual({ copied: false });
  });

  it('reports failure when no clipboard is available', async () => {
    expect(await copyShareText('hello', {})).toEqual({ copied: false });
    expect(await copyShareText('hello')).toEqual({ copied: false });
  });
});
