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

The **peripheral bait** — flashy motion in the periphery that distracts from the true cue but is never the answer — reusing the bait `source` plumbing from the honeypot slice.

- Add peripheral bait as a `bait` element in `sceneGenerator` with `inputSource: 'peripheral-bait'`, honoring `escalation`'s `maxBaitCount`.
- Render the peripheral bait with attention-grabbing motion (respecting reduced-motion once that slice lands; a static fallback is acceptable here).
- Confirm `judge` marks `peripheral-bait` source as `baitPressed` (already covered by the bait-source rule).

## Acceptance criteria

- [ ] Peripheral bait appears as a non-answer `bait` element, count bounded by `escalation.maxBaitCount`.
- [ ] Pressing peripheral bait is judged `wrong` with reason `baitPressed`.
- [ ] Scenes with peripheral bait still pass the `judge` cross-check (exactly one correct action).

## Blocked by

- Blocked by `issues/007-honeypot-bait-source-metadata.md`

## User stories addressed

- User story 14
