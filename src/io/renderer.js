/**
 * renderer — draws the menu, the active round, the shrinking-window countdown,
 * and the round result from public snapshots (shallow IO, not unit-tested per the
 * PRD). Juice and richer rules land in later slices.
 */

const RULE_BANNERS = {
  greyDot: {
    normal: 'PRESS THE SIDE OF THE GREY DOT',
  },
  blueRed: {
    normal: 'REACT TO BLUE · RESIST RED',
    inverted: 'REACT TO RED · RESIST BLUE',
  },
  stroop: {
    normal: 'OBEY THE INK · ▲ GREEN→LEFT · ◆ ORANGE→RIGHT · ▬ GREY→RESIST',
  },
};

export function bannerText(rule, ruleVariant = 'normal') {
  const byVariant = RULE_BANNERS[rule];
  if (!byVariant) return '';
  return byVariant[ruleVariant] ?? byVariant.normal ?? '';
}

// Color words in the banner are painted in their own ink so the Stroop legend
// reads at a glance (GREEN in green, etc.). The source strings are static, so
// building spans by word is safe; non-color words stay in the default ink.
const BANNER_INK = {
  GREEN: 'green',
  ORANGE: 'orange',
  GREY: 'grey',
  BLUE: 'blue',
  RED: 'red',
};

export function renderBanner(bannerEl, rule, ruleVariant) {
  const text = bannerText(rule, ruleVariant);
  bannerEl.textContent = '';
  // Split on word boundaries so punctuation/arrows stay attached and only the
  // color word itself is inked.
  for (const token of text.split(/\b/)) {
    const ink = BANNER_INK[token];
    if (ink) {
      const span = document.createElement('span');
      span.className = `banner__ink banner__ink--${ink}`;
      span.textContent = token;
      bannerEl.appendChild(span);
    } else {
      bannerEl.appendChild(document.createTextNode(token));
    }
  }
}

function renderSide(zoneEl, scene, side) {
  zoneEl.innerHTML = '';
  const elements = scene.elements.filter((el) => el.side === side);
  for (const el of elements) {
    const node = document.createElement('div');
    if (el.role === 'bait') {
      // Tactile, tempting button. Placeholder physics here; full juice lands later.
      node.className = `bait bait--${el.type}`;
      node.dataset.inputSource = el.inputSource;
      if (el.side) node.dataset.side = el.side;
      // Peripheral baits carry a motion hint so CSS can flash/twitch them. A
      // reduced-motion toggle (later slice) can swap this for a calmer cue.
      if (el.motion) node.dataset.motion = el.motion;
    } else if (el.type === 'colorCue') {
      node.className = `cue cue--${el.color} cue--${el.shape ?? 'circle'}`;
    } else {
      const shapeClass = el.shape ? ` dot--${el.shape}` : '';
      node.className = `dot ${el.color === 'grey' ? 'dot--grey' : 'dot--bright'}${shapeClass}`;
    }
    node.dataset.role = el.role;
    const label = document.createElement('span');
    label.className = 'dot__label';
    label.textContent = el.shapeLabel ?? '';
    node.appendChild(label);
    zoneEl.appendChild(node);
  }
}

function renderCenter(zoneEl, scene) {
  if (!zoneEl) return;
  zoneEl.innerHTML = '';
  // Sideless cues (e.g. the Stroop word) render centered in the arena.
  const elements = scene.elements.filter((el) => el.side === undefined);
  for (const el of elements) {
    if (el.type === 'stroop') {
      const node = document.createElement('div');
      node.className = `stroop stroop--${el.ink} stroop--${el.shape}`;
      node.dataset.role = el.role;
      // The word renders in its ink color; the ink (not the word) is the cue.
      const word = document.createElement('span');
      word.className = 'stroop__word';
      word.textContent = el.word ?? '';
      const label = document.createElement('span');
      label.className = 'stroop__label';
      label.textContent = el.shapeLabel ?? '';
      node.appendChild(word);
      node.appendChild(label);
      zoneEl.appendChild(node);
    }
  }
}

/**
 * Fill (or hide) the strike roast screen. `payload` is the commentator's
 * `{ roast, betrayal }` (or null to hide). Pure DOM writes — the roast text comes
 * from the unit-tested `commentator`.
 */
export function renderRoast(refs, payload) {
  if (!refs.roast) return;
  if (!payload) {
    refs.roast.hidden = true;
    if (refs.roastLine) refs.roastLine.textContent = '';
    if (refs.roastStat) refs.roastStat.textContent = '';
    return;
  }
  refs.roast.hidden = false;
  if (refs.roastLine) refs.roastLine.textContent = payload.roast;
  if (refs.roastStat) refs.roastStat.textContent = payload.betrayal;
}

/**
 * Fire a one-shot juice animation on the arena: `wrong` → screen-shake + red
 * flash, `correct` → a brief calm glow. CSS gates the shake/flash on the motion
 * toggle (body.motion-reduced swaps it for a border-pulse), so reduced-motion is
 * honored automatically. The class is removed after the animation so it can retrigger.
 */
export function triggerJuice(refs, kind) {
  const el = refs.arena;
  if (!el) return;
  const cls = kind === 'wrong' ? 'juice-wrong' : 'juice-correct';
  el.classList.remove('juice-wrong', 'juice-correct');
  // Force reflow so re-adding the class restarts the animation on rapid strikes.
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 650);
}

function renderResult(resultEl, judgment) {
  if (!judgment) {
    resultEl.textContent = '';
    resultEl.className = 'result';
    return;
  }
  if (judgment.outcome === 'correct') {
    resultEl.textContent = 'CORRECT';
    resultEl.className = 'result result--correct';
  } else {
    resultEl.textContent = `WRONG — ${judgment.reason}`;
    resultEl.className = 'result result--wrong';
  }
}

function renderCountdown(countdownEl, snapshot) {
  const pct = snapshot.windowOpen
    ? Math.round((snapshot.windowRemainingMs / snapshot.inputWindowMs) * 100)
    : 0;
  countdownEl.style.setProperty('--countdown', `${pct}%`);
  countdownEl.setAttribute('aria-valuenow', String(pct));
  // A rising visual heartbeat as the window shrinks (audio heartbeat is wired in
  // main from the same remaining-fraction). Honors reduced-motion via CSS.
  countdownEl.classList.toggle('countdown--urgent', snapshot.windowOpen && pct > 0 && pct <= 45);
}

function renderHud(refs, snapshot) {
  if (!refs.hudScore) return;
  refs.hudScore.textContent = String(snapshot.score ?? 0);
  refs.hudCombo.textContent = `×${snapshot.combo ?? 1}`;
  const strikes = snapshot.strikes ?? 0;
  refs.hudStrikes.textContent = '●'.repeat(strikes) + '○'.repeat(Math.max(0, 3 - strikes));
}

function renderGameOver(refs, snapshot) {
  if (refs.gameoverScore) refs.gameoverScore.textContent = String(snapshot.score ?? 0);
  if (refs.gameoverRounds) refs.gameoverRounds.textContent = String(snapshot.roundsSurvived ?? 0);
}

// The last scene object that was painted into the arena. The arena is rebuilt
// only when the round's scene reference actually changes (once per round), so
// per-frame ticks no longer reset in-flight CSS animations (e.g. bait flashes).
let lastSceneRendered = null;

export function render(refs, snapshot) {
  const inMenu = snapshot.phase === 'menu';
  const inGameOver = snapshot.phase === 'gameOver';
  const inRound = snapshot.phase === 'round';
  const inRuleChange = snapshot.phase === 'ruleChange';
  const inStrike = snapshot.phase === 'strike';

  if (refs.menu) refs.menu.hidden = !inMenu;
  if (refs.play) refs.play.hidden = !(inRound || inRuleChange || inStrike);
  if (refs.gameover) refs.gameover.hidden = !inGameOver;
  if (refs.ruleChange) refs.ruleChange.hidden = !inRuleChange;

  // The strike screen freezes the arena behind the roast overlay: leave the last
  // painted scene untouched so the missed cue stays visible and nothing flickers.
  if (inStrike) return;

  if (!inRound) lastSceneRendered = null;

  if (inGameOver) {
    renderGameOver(refs, snapshot);
    return;
  }

  if (inRuleChange) {
    // Telegraph the upcoming rule via the neutral banner; the window stays closed.
    renderBanner(refs.banner, snapshot.rule, snapshot.ruleVariant);
    // The opening announcement (no previous rule) reads "THE RULE"; a mid-run
    // switch reads "RULE CHANGED".
    if (refs.ruleChangeTitle) {
      refs.ruleChangeTitle.textContent = snapshot.previousRule ? 'RULE CHANGED' : 'THE RULE';
    }
    // The popup restates the new rule and waits for the player to acknowledge it.
    if (refs.ruleChangeBanner) {
      renderBanner(refs.ruleChangeBanner, snapshot.rule, snapshot.ruleVariant);
    }
    if (refs.ruleChangePrompt) {
      refs.ruleChangePrompt.textContent = snapshot.canDismiss
        ? 'Press any key to continue'
        : 'Get ready…';
    }
    renderHud(refs, snapshot);
    return;
  }

  if (!inRound) return;

  renderBanner(refs.banner, snapshot.rule, snapshot.ruleVariant);
  if (snapshot.scene !== lastSceneRendered) {
    renderSide(refs.leftZone, snapshot.scene, 'left');
    renderCenter(refs.centerZone, snapshot.scene);
    renderSide(refs.rightZone, snapshot.scene, 'right');
    lastSceneRendered = snapshot.scene;
  }
  renderCountdown(refs.countdown, snapshot);
  renderResult(refs.result, snapshot.judgment);
  renderHud(refs, snapshot);
}
