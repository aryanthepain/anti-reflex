/**
 * shareCard — builds the shareable result string and copies it to the clipboard
 * (shallow IO).
 *
 * `buildShareText` is pure: it summarizes how the player cracked (composure score,
 * rounds survived, personal best) and never returns empty. `copyShareText` wraps
 * the async Clipboard API per the PRD "Storage & clipboard fallbacks": on any
 * clipboard failure (blocked, unavailable, insecure context) it resolves to
 * `{ copied: false }` so the caller can leave the text visible and selectable and
 * report that the copy did not complete. The clipboard is injected so the pure
 * logic stays testable under the node test environment.
 */

export function buildShareText({ score, best, roundsSurvived, isNewBest = false, url } = {}) {
  const composure = Number.isFinite(score) ? score : 0;
  const rounds = Number.isFinite(roundsSurvived) ? roundsSurvived : 0;
  const bestScore = Number.isFinite(best) ? best : composure;
  const roundLabel = `${rounds} ${rounds === 1 ? 'round' : 'rounds'}`;

  const lines = [
    'Anti-Reflex 🫥 — fast reflexes lose.',
    `I cracked after ${roundLabel} with a composure of ${composure}.`,
    isNewBest ? `New personal best: ${bestScore}!` : `Best: ${bestScore}.`,
    'Think you can keep your cool?',
  ];
  if (url) lines.push(url);
  return lines.join('\n');
}

export async function copyShareText(text, { clipboard } = {}) {
  try {
    if (clipboard && typeof clipboard.writeText === 'function') {
      await clipboard.writeText(text);
      return { copied: true };
    }
    return { copied: false };
  } catch {
    return { copied: false };
  }
}
