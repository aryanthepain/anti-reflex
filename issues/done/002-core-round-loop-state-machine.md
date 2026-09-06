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

The core round loop driven by `gameStateMachine` with an injected clock, plus the full input surface and the no-tutorial walk-up affordances.

- Implement `gameStateMachine` per the PRD *State machine public interface*: `startRun({ seed })`, `submitInput(inputEvent)`, `tick(nowMs)` with an **injected clock**, emitting public snapshots for `menu` and `round`.
- Enforce the PRD *Timing contract* phases: `tooEarly` before the window, first in-window press locks the round, window expiry resolves to `resist`, late inputs ignored.
- Extend `input` so touch/click map to `left-zone`/`right-zone` (left half = Left, right half = Right) and keyboard arrows, all flowing through the one shared `judge`.
- Implement the *No-tutorial walk-up affordance*: a menu that surfaces the three actions (Left / Right / Resist) and in-round left/right/resist affordances plus a visible shrinking-window countdown.
- Support restarting a new run immediately from the menu/game-over surface.

## Acceptance criteria

- [ ] `gameStateMachine` advances rounds purely via `tick(nowMs)` (no wall-clock timers) and exposes immutable `menu`/`round` snapshots.
- [ ] Tests assert all four timing phases (`tooEarly`, in-window lock, expiry→`resist`, ignored late input) through public snapshots only.
- [ ] Keyboard, click, and touch (left/right half) all produce normalized actions judged identically.
- [ ] The window countdown is visible during each round and a no-press resolves as `resist` at expiry.
- [ ] Menu shows the three available actions before a run starts; in-round affordances are visible.
- [ ] A new run can be started without a page reload.

## Blocked by

- Blocked by `issues/001-walking-skeleton-grey-dot-round.md`

## User stories addressed

- User story 4
- User story 5
- User story 6
- User story 29
- User story 30
