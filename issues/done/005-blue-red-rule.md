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

The **Blue/Red (go / no-go)** rule with both normal and inverted variants, end-to-end through `judge`, `sceneGenerator`, and the banner.

- Implement the **Rule 2 — Blue/Red** contract in `judge` per the PRD *Rule contracts*: one rule-relevant colored cue with a `side`; accessible pairing (blue = circle `GO`, red = octagon `STOP`).
  - Normal variant: blue → press its side, red → `resist`.
  - Inverted variant: red → press its side, blue → `resist`.
- Generate Blue/Red scenes in `sceneGenerator` honoring the active `ruleVariant`.
- Surface the variant in the neutral banner text (e.g. "REACT TO BLUE · RESIST RED" vs. "REACT TO RED · RESIST BLUE"), using the epoch/telegraph mechanism from the prior slice to switch variants.

## Acceptance criteria

- [ ] `judge` covers all four cases (blue-normal, red-normal, blue-inverted, red-inverted) with correct outcomes.
- [ ] Color cues always carry their paired shape and label.
- [ ] `sceneGenerator` Blue/Red scenes pass the `judge` cross-check (exactly one correct action) for both variants.
- [ ] The banner text reflects the active variant and switches only at a telegraphed epoch boundary.

## Blocked by

- Blocked by `issues/004-rule-epoch-engine-telegraph.md`

## User stories addressed

- User story 10
- User story 11
