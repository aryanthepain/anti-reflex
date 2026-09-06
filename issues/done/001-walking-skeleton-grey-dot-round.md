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

The walking skeleton: a single playable grey-dot round, end-to-end, through every layer. This establishes the repo scaffold and the fairness-critical pure-logic core.

- Scaffold the vanilla HTML/CSS/JS ES-module project and a dev-only **Vitest** runner with co-located `*.test.js` (see PRD *Testing Decisions* / *Prior art*).
- Implement the **Rule 1 — Grey dot** contract in `judge` (see PRD *Rule contracts*): one grey dot with a `side`, bright decoys elsewhere; correct = press the grey dot's side; `resist` and the decoy side are wrong.
- Implement `sceneGenerator` for the grey-dot rule with a **seedable RNG** producing the PRD `Scene` descriptor, guaranteeing exactly one correct answer (cross-checked against `judge`).
- Implement a minimal `renderer` that draws the neutral rule banner and the scene, and `input` for the Left/Right arrow keys.
- Wire it so loading the page shows one grey-dot scene and a keyboard press is judged correct/wrong on screen.

## Acceptance criteria

- [ ] Project loads as a static page with no build step for the shipped game; Vitest runs the test suite.
- [ ] `judge` resolves the grey-dot rule for `left`/`right`/`resist` with correct reasons.
- [ ] `sceneGenerator` is deterministic for a given seed and emits the `Scene` schema with exactly one `trueCue`.
- [ ] A `sceneGenerator` ↔ `judge` cross-check test confirms each generated scene has exactly one correct action.
- [ ] Pressing Left/Right arrow on the rendered grey-dot scene shows a correct/wrong result.
- [ ] All pure-logic tests pass under Vitest and are excluded from the shipped bundle.

## Blocked by

None - can start immediately.

## User stories addressed

- User story 1
- User story 2
- User story 3
- User story 9
- User story 31
- User story 32
