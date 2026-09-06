/**
 * main — wires the pure `gameStateMachine` to the DOM (shallow IO).
 *
 * A menu surfaces the three available actions (Left / Right / Resist). Start
 * begins a seeded run; the round loop is driven by the injected clock via
 * `tick(elapsedMs)` on each animation frame, so all timing flows through the
 * state machine. Keyboard arrows and pointer taps (left/right half of the arena)
 * are normalized and submitted through the one shared judge. A new run can be
 * started at any time without reloading the page.
 */
import { createGameStateMachine } from './logic/gameStateMachine.js';
import { createMotionController } from './logic/motionPreference.js';
import { commentate } from './logic/commentator.js';
import { render, renderRoast, triggerJuice } from './io/renderer.js';
import { inputEventFromKey, inputEventFromZone, inputEventFromBait } from './io/input.js';
import { createBestScoreStore } from './io/persistence.js';
import { createAudioController } from './io/audio.js';
import { buildShareText, copyShareText } from './io/shareCard.js';

const refs = {
  menu: document.getElementById('menu'),
  play: document.getElementById('play'),
  gameover: document.getElementById('gameover'),
  start: document.getElementById('start'),
  restart: document.getElementById('restart'),
  playAgain: document.getElementById('play-again'),
  banner: document.getElementById('banner'),
  arena: document.getElementById('arena'),
  leftZone: document.getElementById('left-zone'),
  centerZone: document.getElementById('center-zone'),
  rightZone: document.getElementById('right-zone'),
  countdown: document.getElementById('countdown'),
  result: document.getElementById('result'),
  ruleChange: document.getElementById('rule-change'),
  ruleChangeTitle: document.getElementById('rule-change-title'),
  ruleChangeBanner: document.getElementById('rule-change-banner'),
  ruleChangePrompt: document.getElementById('rule-change-prompt'),
  roast: document.getElementById('roast'),
  roastLine: document.getElementById('roast-line'),
  roastStat: document.getElementById('roast-stat'),
  roastPrompt: document.getElementById('roast-prompt'),
  hudScore: document.getElementById('hud-score'),
  hudCombo: document.getElementById('hud-combo'),
  hudStrikes: document.getElementById('hud-strikes'),
  gameoverScore: document.getElementById('gameover-score'),
  gameoverRounds: document.getElementById('gameover-rounds'),
  gameoverBest: document.getElementById('gameover-best'),
  shareText: document.getElementById('share-text'),
  copyShare: document.getElementById('copy-share'),
  copyStatus: document.getElementById('copy-status'),
  motionToggle: document.getElementById('motion-toggle'),
  muteToggle: document.getElementById('mute-toggle'),
};

// Best composure score persists in localStorage with an in-memory fallback so a
// blocked/unavailable store never breaks play (PRD Storage & clipboard fallbacks).
function safeLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
const bestStore = createBestScoreStore({ storage: safeLocalStorage() });

// Audio: the context is created lazily on the Start gesture (never on load); mute
// is persisted and independent of the reduced-motion toggle. Audio failures are
// swallowed so play continues when sound is muted, blocked, or unavailable.
const audio = createAudioController({
  AudioContext: window.AudioContext ?? window.webkitAudioContext,
  storage: safeLocalStorage(),
});

function applyMutePreference() {
  if (!refs.muteToggle) return;
  refs.muteToggle.textContent = audio.isMuted() ? 'Sound: OFF' : 'Sound: ON';
  refs.muteToggle.setAttribute('aria-pressed', String(audio.isMuted()));
}

applyMutePreference();

if (refs.muteToggle) {
  refs.muteToggle.addEventListener('click', () => {
    audio.toggleMute();
    applyMutePreference();
  });
}

// Reduced-motion toggle: starts OFF (full motion) by default and is
// user-switchable. It only swaps motion (shake/flash → border-pulse); audio mute
// is an independent toggle owned by a later slice.
const motion = createMotionController();

function applyMotionPreference() {
  document.body.classList.toggle('motion-reduced', motion.isReduced());
  document.body.classList.toggle('motion-full', !motion.isReduced());
  if (refs.motionToggle) {
    refs.motionToggle.textContent = motion.label();
    refs.motionToggle.setAttribute('aria-pressed', String(motion.isReduced()));
  }
}

applyMotionPreference();

if (refs.motionToggle) {
  refs.motionToggle.addEventListener('click', () => {
    motion.toggle();
    applyMotionPreference();
  });
}

// The full rule pool the epoch scheduler rotates between every epoch (default 5
// rounds), telegraphing each switch with the RULE CHANGED flash. Blue/Red ships
// twice — once normal, once as the inverted rule modifier ({ rule, variant }) —
// so the inversion reliably appears and is announced as its own rule state.
const game = createGameStateMachine({
  rules: [
    'greyDot',
    { rule: 'blueRed', variant: 'normal' },
    { rule: 'blueRed', variant: 'inverted' },
    'stroop',
  ],
  announceFirstRule: true,
});
let runStartMs = 0;
let running = false;
// Per-run effect bookkeeping: detect the moment a round resolves so juice, audio,
// and the roast screen fire exactly once, and pace the heartbeat as time drains.
let wasLocked = false;
// Whether the roast/strike overlay is currently painted (so it isn't repainted
// every frame, which would reset its stamp animation).
let roastVisible = false;
// Real-elapsed timestamp (ms) of the last heartbeat, so pacing is independent of
// how short the window is. -Infinity forces an immediate first beat each window.
let lastHeartbeatAt = -Infinity;

function elapsed() {
  return performance.now() - runStartMs;
}

function startRun() {
  runStartMs = performance.now();
  running = true;
  wasLocked = false;
  roastVisible = false;
  lastHeartbeatAt = -Infinity;
  renderRoast(refs, null);
  if (refs.roastPrompt) refs.roastPrompt.textContent = '';
  // The Start press is the user gesture that may create/resume the audio context.
  audio.resume();
  render(refs, game.startRun({ seed: (Math.random() * 1e9) | 0 }));
}

// Fire transition-driven juice/audio/roast from a fresh round snapshot. Called
// once per frame; effects gate on the lock transition so they don't repeat.
function applyRoundEffects(snap) {
  // Strike screen: a wrong round paused here and waits for the player. Keep the
  // roast up (don't repaint it every frame — that resets its stamp animation) and
  // show the dismiss prompt only once the minimum hold has elapsed.
  if (snap.phase === 'strike') {
    if (!roastVisible) {
      renderRoast(
        refs,
        commentate(snap.judgment, {
          reactionMs: snap.lastReactionMs,
          windowMs: snap.inputWindowMs,
        }),
      );
      roastVisible = true;
    }
    if (refs.roastPrompt) {
      refs.roastPrompt.textContent = snap.canDismiss
        ? snap.isFinalStrike
          ? 'Press any key to collapse'
          : 'Press any key to continue'
        : '';
    }
    wasLocked = true;
    return;
  }

  if (snap.phase !== 'round') {
    renderRoast(refs, null);
    roastVisible = false;
    if (refs.roastPrompt) refs.roastPrompt.textContent = '';
    wasLocked = false;
    return;
  }

  // A round just resolved: react to the outcome a single time.
  if (snap.locked && !wasLocked) {
    const judgment = snap.judgment;
    if (judgment && judgment.outcome === 'wrong') {
      audio.buzzer();
      triggerJuice(refs, 'wrong');
      renderRoast(
        refs,
        commentate(judgment, {
          reactionMs: snap.lastReactionMs,
          windowMs: snap.inputWindowMs,
        }),
      );
      roastVisible = true;
    } else if (judgment && judgment.outcome === 'correct') {
      // The rewarding chime is specifically for keeping cool (a correct resist).
      if (snap.lastAction === 'resist' || judgment.reason === 'correct') {
        audio.chime();
      }
      triggerJuice(refs, 'correct');
      renderRoast(refs, null);
      roastVisible = false;
    }
  }

  // Fresh, still-open window: clear any lingering roast and pace the heartbeat by
  // real elapsed time so it quickens as the window shrinks — independent of how
  // short the window is, so faster rounds still get a steady, quickening pulse.
  if (!snap.locked) {
    if (wasLocked) {
      renderRoast(refs, null);
      roastVisible = false;
    }
    if (snap.windowOpen && snap.inputWindowMs) {
      const remainingFrac = snap.windowRemainingMs / snap.inputWindowMs;
      const intensity = Math.max(0, Math.min(1, 1 - remainingFrac));
      const interval = 600 - 360 * intensity; // 600ms calm → 240ms frantic
      const nowAt = elapsed();
      if (nowAt - lastHeartbeatAt >= interval) {
        audio.heartbeat(intensity);
        lastHeartbeatAt = nowAt;
      }
    } else {
      lastHeartbeatAt = -Infinity;
    }
  }

  wasLocked = snap.locked;
}

function frame() {
  if (running) {
    const snap = game.tick(elapsed());
    render(refs, snap);
    applyRoundEffects(snap);
    if (snap.phase === 'gameOver') {
      running = false;
      renderRoast(refs, null);
      handleGameOver(snap);
    }
  }
  requestAnimationFrame(frame);
}

// Build a clean shareable link: only http(s) origins, with any trailing file
// name (e.g. index.html) and hash stripped so the card never leaks a local path.
function shareUrl() {
  const { protocol, origin, pathname } = window.location;
  if (protocol !== 'http:' && protocol !== 'https:') return undefined;
  return origin + pathname.replace(/[^/]*$/, '');
}

// On game over, fold the run score into the persisted best and build the share
// card. Runs once per run because the loop stops ticking after this transition.
function handleGameOver(snap) {
  const { best, isNewBest } = bestStore.submit(snap.score ?? 0);
  if (refs.gameoverBest) refs.gameoverBest.textContent = String(best);
  if (refs.shareText) {
    refs.shareText.textContent = buildShareText({
      score: snap.score ?? 0,
      best,
      roundsSurvived: snap.roundsSurvived ?? 0,
      isNewBest,
      url: shareUrl(),
    });
  }
  if (refs.copyStatus) refs.copyStatus.textContent = '';
}

if (refs.copyShare) {
  refs.copyShare.addEventListener('click', async () => {
    const text = refs.shareText?.textContent ?? '';
    const { copied } = await copyShareText(text, { clipboard: navigator.clipboard });
    if (refs.copyStatus) {
      refs.copyStatus.textContent = copied
        ? 'Copied to clipboard!'
        : "Copy didn't complete — select the text above to copy it manually.";
    }
    // On clipboard failure leave the text selectable and pre-select it.
    if (!copied && refs.shareText && window.getSelection) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(refs.shareText);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
}

refs.start.addEventListener('click', startRun);
refs.restart.addEventListener('click', startRun);
if (refs.playAgain) refs.playAgain.addEventListener('click', startRun);

window.addEventListener('keydown', (event) => {
  if (!running) return;
  // During the RULE CHANGED popup or the strike screen, any key dismisses it (once
  // the minimum display time has elapsed) and advances; arrows aren't consumed as
  // moves while a popup is up.
  const phase = game.getSnapshot().phase;
  if (phase === 'ruleChange' || phase === 'strike') {
    event.preventDefault();
    render(refs, game.acknowledge());
    return;
  }
  const inputEvent = inputEventFromKey(event.key, elapsed());
  if (inputEvent) {
    event.preventDefault();
    render(refs, game.submitInput(inputEvent));
  }
});

// A tap/click on the RULE CHANGED popup also dismisses it (touch parity with the
// keyboard); acknowledge() is a no-op until the minimum display time elapses.
if (refs.ruleChange) {
  refs.ruleChange.addEventListener('pointerdown', (event) => {
    if (!running) return;
    event.preventDefault();
    render(refs, game.acknowledge());
  });
}

// A tap/click on the strike screen dismisses it (touch parity with the keyboard).
if (refs.roast) {
  refs.roast.addEventListener('pointerdown', (event) => {
    if (!running) return;
    if (game.getSnapshot().phase !== 'strike') return;
    event.preventDefault();
    render(refs, game.acknowledge());
  });
}

refs.arena.addEventListener('pointerdown', (event) => {
  if (!running) return;
  if (game.getSnapshot().phase !== 'round') return;
  event.preventDefault();
  // Baits (honeypot / peripheral) are harmless visual decoys: a press on one is
  // judged purely on its side, exactly like a left/right zone press in that spot.
  const baitEl = event.target.closest('[data-input-source]');
  if (baitEl) {
    render(
      refs,
      game.submitInput(
        inputEventFromBait(
          { side: baitEl.dataset.side, inputSource: baitEl.dataset.inputSource },
          elapsed(),
        ),
      ),
    );
    return;
  }
  const rect = refs.arena.getBoundingClientRect();
  render(refs, game.submitInput(inputEventFromZone(event.clientX - rect.left, rect.width, elapsed())));
});

render(refs, { phase: 'menu', actions: ['left', 'right', 'resist'] });
requestAnimationFrame(frame);
