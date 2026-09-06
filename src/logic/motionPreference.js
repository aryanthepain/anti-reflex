/**
 * motionPreference — pure controller for the reduced-motion toggle.
 *
 * Defaults from the OS `prefers-reduced-motion` setting and is user-switchable.
 * This slice owns ONLY motion; audio mute is an independent toggle (see the PRD
 * Audio lifecycle). The controller is DOM-free: callers map `bodyClass()` onto a
 * body class and `label()` onto the toggle button.
 */
const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(matchMedia) {
  if (typeof matchMedia !== 'function') return false;
  try {
    return Boolean(matchMedia(REDUCE_QUERY)?.matches);
  } catch {
    return false;
  }
}

export function motionBodyClass(reduced) {
  return reduced ? 'motion-reduced' : 'motion-full';
}

export function toggleLabel(reduced) {
  return reduced ? 'Reduced motion: ON' : 'Reduced motion: OFF';
}

export function createMotionController({ matchMedia } = {}) {
  let reduced = prefersReducedMotion(matchMedia);
  return {
    isReduced: () => reduced,
    set(value) {
      reduced = Boolean(value);
      return reduced;
    },
    toggle() {
      reduced = !reduced;
      return reduced;
    },
    bodyClass: () => motionBodyClass(reduced),
    label: () => toggleLabel(reduced),
  };
}
