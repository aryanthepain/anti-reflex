---
type: afk
brief: 1-anti_reflex_mvp
parent_prd: prd/anti-reflex-mvp.md
branch: brief/1-anti_reflex_mvp
parent_branch: main
---

## Parent PRD

`prd/anti-reflex-mvp.md` (the PRD this slice came from)

## What to build

Accessibility hardening per the PRD *Accessibility contract*: confirm every color cue is paired with a distinct shape/label, and add the reduced-motion toggle.

- Audit all color-bearing cues (grey dot, Blue/Red, Stroop) so each carries its distinct shape and text label, making the color rules color-blind safe.
- Implement a **reduced-motion toggle** defaulting from `prefers-reduced-motion`, swapping shake/flash for a gentle **border-pulse** while preserving audio and full gameplay.
- Ensure reduced-motion and audio mute are independent (per the PRD *Audio lifecycle*); this slice only owns the motion toggle.

## Acceptance criteria

- [ ] Every color cue renders with its paired shape and label across all three rules.
- [ ] The reduced-motion toggle defaults from `prefers-reduced-motion` and is user-switchable.
- [ ] With reduced motion on, shake/flash are replaced by a border-pulse and gameplay/audio remain fully functional.

## Blocked by

- Blocked by `issues/003-scoring-strikes-escalation.md`

## User stories addressed

- User story 15
- User story 26
