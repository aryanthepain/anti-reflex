/**
 * input — normalizes raw keyboard and pointer events into the InputEvent contract
 * (shallow IO).
 *
 * Keyboard arrows map to keyboard left/right; click/touch map to left-zone /
 * right-zone by which half of the arena was hit (left half = Left, right half =
 * Right). All normalized events flow through the one shared `judge`. resist is
 * the absence of a press before window expiry, so it is resolved by the game
 * loop, not here.
 */

const KEY_TO_ACTION = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/**
 * Translate a keyboard event into a normalized InputEvent, or null if the key
 * is not bound. `pressMs` is supplied by the caller (time since window start).
 */
export function inputEventFromKey(key, pressMs) {
  const action = KEY_TO_ACTION[key];
  if (!action) return null;
  return { action, source: 'keyboard', pressMs };
}

/**
 * Translate a pointer hit at `clientX` within an element of `width` into a
 * normalized zone InputEvent. Left half = Left (`left-zone`); the right half
 * (including the exact midpoint) = Right (`right-zone`). `pressMs` is supplied by
 * the caller (time since window start).
 */
export function inputEventFromZone(clientX, width, pressMs) {
  const isLeft = clientX < width / 2;
  return {
    action: isLeft ? 'left' : 'right',
    source: isLeft ? 'left-zone' : 'right-zone',
    pressMs,
  };
}

/**
 * Translate a press on a bait element (honeypot / peripheral bait) into a
 * normalized InputEvent carrying the bait's `inputSource`. The action mirrors the
 * bait's side so the event satisfies the action contract, but `judge` treats any
 * bait source as wrong regardless. `pressMs` is supplied by the caller.
 */
export function inputEventFromBait(element, pressMs) {
  return {
    action: element.side ?? 'resist',
    source: element.inputSource,
    pressMs,
  };
}

/**
 * Attach a keydown listener that forwards normalized InputEvents to `onInput`.
 * Returns a teardown function. `now` returns the current time (ms).
 */
export function attachKeyboard(target, onInput, now) {
  const handler = (event) => {
    const pressMs = now();
    const inputEvent = inputEventFromKey(event.key, pressMs);
    if (inputEvent) {
      event.preventDefault();
      onInput(inputEvent);
    }
  };
  target.addEventListener('keydown', handler);
  return () => target.removeEventListener('keydown', handler);
}

/**
 * Attach a pointer listener over the whole arena, mapping the hit position to a
 * left/right zone. Works for both mouse clicks and touch taps (pointer events).
 * Returns a teardown function. `now` returns the current time (ms).
 */
export function attachPointer(target, onInput, now) {
  const handler = (event) => {
    const rect = target.getBoundingClientRect();
    const pressMs = now();
    const inputEvent = inputEventFromZone(event.clientX - rect.left, rect.width, pressMs);
    event.preventDefault();
    onInput(inputEvent);
  };
  target.addEventListener('pointerdown', handler);
  return () => target.removeEventListener('pointerdown', handler);
}
