/**
 * audio — Web Audio synthesis of the buzzer, chime, and shrinking-window heartbeat
 * (shallow IO, not unit-tested per the PRD; failures never block play).
 *
 * Audio lifecycle (PRD):
 *   - The AudioContext is created **lazily on the first user gesture** (via
 *     `resume()`, called from the Start handler) — never on page load.
 *   - A **mute toggle** is exposed and its state is **persisted in localStorage**.
 *   - Gameplay stays fully playable when muted, blocked, or unavailable: every
 *     audio call is guarded so a missing/throwing AudioContext never propagates.
 *   - Mute is independent of reduced-motion (owned by `motionPreference`).
 *
 * The `AudioContext` constructor and `localStorage` are injected so the controller
 * has no hard dependency on the browser globals.
 */

const DEFAULT_KEY = 'anti-reflex.muted';

function readMuted(storage, key) {
  try {
    return storage?.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeMuted(storage, key, muted) {
  try {
    storage?.setItem(key, muted ? '1' : '0');
  } catch {
    /* persistence is best-effort; never block play */
  }
}

export function createAudioController({ AudioContext, storage, key = DEFAULT_KEY } = {}) {
  let muted = readMuted(storage, key);
  let ctx = null;

  function audible() {
    return !muted && ctx !== null;
  }

  // Created only when first asked (i.e. after the Start gesture), never on load.
  function ensureContext() {
    if (ctx) return ctx;
    if (typeof AudioContext !== 'function') return null;
    try {
      ctx = new AudioContext();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  // A single guarded tone helper. Every synth call funnels through here so any
  // Web Audio failure is swallowed and never interrupts gameplay.
  function tone({ type = 'sine', freq = 440, duration = 0.2, gain = 0.2, when = 0, sweepTo } = {}) {
    if (!audible()) return;
    try {
      const now = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (typeof sweepTo === 'number') {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), now + duration);
      }
      amp.gain.setValueAtTime(0.0001, now);
      amp.gain.exponentialRampToValueAtTime(gain, now + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(amp).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      /* audio is non-essential; swallow */
    }
  }

  return {
    isMuted: () => muted,

    setMuted(value) {
      muted = Boolean(value);
      writeMuted(storage, key, muted);
      return muted;
    },

    toggleMute() {
      return this.setMuted(!muted);
    },

    /**
     * Initialize/resume the context. MUST be called from a user gesture (Start).
     * Safe to call repeatedly. Returns true when a context is available.
     */
    resume() {
      const context = ensureContext();
      if (!context) return false;
      try {
        if (typeof context.resume === 'function') context.resume();
      } catch {
        /* ignore */
      }
      return true;
    },

    // Harsh descending buzzer on a wrong action.
    buzzer() {
      tone({ type: 'sawtooth', freq: 220, sweepTo: 80, duration: 0.32, gain: 0.28 });
    },

    // Soft two-note chime rewarding a correct resist.
    chime() {
      tone({ type: 'sine', freq: 660, duration: 0.18, gain: 0.16 });
      tone({ type: 'sine', freq: 988, duration: 0.24, gain: 0.14, when: 0.09 });
    },

    /**
     * A heartbeat thump whose volume/brightness rises as the window shrinks.
     * `intensity` is 0..1 (0 = window just opened, 1 = about to close).
     */
    heartbeat(intensity = 0) {
      const t = Math.max(0, Math.min(1, intensity));
      const gain = 0.12 + 0.18 * t;
      const freq = 60 + 20 * t;
      tone({ type: 'sine', freq, duration: 0.1, gain });
      tone({ type: 'sine', freq, duration: 0.12, gain: gain * 0.8, when: 0.16 });
    },
  };
}
