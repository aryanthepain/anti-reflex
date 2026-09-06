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

The **Stroop** rule — obey the ink color, not the word — end-to-end.

- Implement the **Rule 3 — Stroop** contract in `judge` per the PRD *Rule contracts*: a single color word rendered in an ink color where the word is bait; ink maps to action (green triangle `▲L` → left, orange diamond `◆R` → right, grey bar `▬X` → resist). The word never changes the correct action; `resist` is valid on grey ink.
- Generate Stroop scenes in `sceneGenerator` where the displayed word may contradict the ink.
- Render the word in its ink color with the paired shape/label, under the neutral banner.

## Acceptance criteria

- [ ] `judge` keys off ink color, not the word, for all three ink mappings (including correct `resist` on grey ink) with contradicting words.
- [ ] Stroop scenes pass the `judge` cross-check (exactly one correct action).
- [ ] The word renders in its ink color with the paired shape/label.

## Blocked by

- Blocked by `issues/002-core-round-loop-state-machine.md`

## User stories addressed

- User story 12
