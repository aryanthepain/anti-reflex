import { describe, it, expect, vi } from 'vitest';
import { createAudioController } from './audio.js';

function createMockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((k) => (store.has(k) ? store.get(k) : null)),
    setItem: vi.fn((k, v) => {
      store.set(k, String(v));
    }),
  };
}

function createMockAudioContext() {
  const osc = {
    type: 'sine',
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn().mockReturnThis(),
    start: vi.fn(),
    stop: vi.fn(),
  };

  const amp = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn().mockReturnThis(),
  };

  const ctx = {
    currentTime: 10,
    destination: {},
    resume: vi.fn(),
    createOscillator: vi.fn(() => osc),
    createGain: vi.fn(() => amp),
  };

  const Constructor = vi.fn(() => ctx);
  return { Constructor, ctx, osc, amp };
}

describe('audio — Web Audio controller', () => {
  it('defaults to unmuted when storage is empty', () => {
    const storage = createMockStorage();
    const audio = createAudioController({ storage });
    expect(audio.isMuted()).toBe(false);
  });

  it('restores muted state from storage if flag is set', () => {
    const storage = createMockStorage({ 'anti-reflex.muted': '1' });
    const audio = createAudioController({ storage });
    expect(audio.isMuted()).toBe(true);
  });

  it('updates and persists mute toggle', () => {
    const storage = createMockStorage();
    const audio = createAudioController({ storage });

    expect(audio.toggleMute()).toBe(true);
    expect(audio.isMuted()).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith('anti-reflex.muted', '1');

    expect(audio.toggleMute()).toBe(false);
    expect(audio.isMuted()).toBe(false);
    expect(storage.setItem).toHaveBeenCalledWith('anti-reflex.muted', '0');
  });

  it('handles throwing storage gracefully without interrupting play', () => {
    const badStorage = {
      getItem: () => {
        throw new Error('Access denied');
      },
      setItem: () => {
        throw new Error('Quota exceeded');
      },
    };

    const audio = createAudioController({ storage: badStorage });
    expect(audio.isMuted()).toBe(false);
    expect(() => audio.setMuted(true)).not.toThrow();
  });

  it('creates AudioContext lazily only upon resume() call', () => {
    const { Constructor, ctx } = createMockAudioContext();
    const audio = createAudioController({ AudioContext: Constructor });

    expect(Constructor).not.toHaveBeenCalled();

    const ok = audio.resume();
    expect(ok).toBe(true);
    expect(Constructor).toHaveBeenCalledTimes(1);
    expect(ctx.resume).toHaveBeenCalledTimes(1);

    // Repeated calls reuse the same context
    audio.resume();
    expect(Constructor).toHaveBeenCalledTimes(1);
  });

  it('returns false on resume() if AudioContext is unavailable or throws', () => {
    const audioNoCtx = createAudioController({ AudioContext: null });
    expect(audioNoCtx.resume()).toBe(false);

    const ThrowingCtx = vi.fn(() => {
      throw new Error('Audio not allowed');
    });
    const audioThrowing = createAudioController({ AudioContext: ThrowingCtx });
    expect(audioThrowing.resume()).toBe(false);
  });

  it('synthesizes buzzer, chime, and heartbeat tones when unmuted and resumed', () => {
    const { Constructor, ctx, osc, amp } = createMockAudioContext();
    const audio = createAudioController({ AudioContext: Constructor });
    audio.resume();

    audio.buzzer();
    expect(ctx.createOscillator).toHaveBeenCalled();
    expect(ctx.createGain).toHaveBeenCalled();
    expect(osc.start).toHaveBeenCalled();

    audio.chime();
    expect(osc.start).toHaveBeenCalled();

    audio.heartbeat(0.5);
    expect(osc.start).toHaveBeenCalled();
  });

  it('suppresses audio tones completely when muted', () => {
    const { Constructor, ctx } = createMockAudioContext();
    const storage = createMockStorage({ 'anti-reflex.muted': '1' });
    const audio = createAudioController({ AudioContext: Constructor, storage });
    audio.resume();

    audio.buzzer();
    audio.chime();
    audio.heartbeat(1.0);

    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });

  it('swallows audio synthesis errors gracefully without throwing', () => {
    const { Constructor, ctx } = createMockAudioContext();
    ctx.createOscillator = () => {
      throw new Error('Device disconnected');
    };
    const audio = createAudioController({ AudioContext: Constructor });
    audio.resume();

    expect(() => audio.buzzer()).not.toThrow();
    expect(() => audio.chime()).not.toThrow();
    expect(() => audio.heartbeat(0.8)).not.toThrow();
  });
});
