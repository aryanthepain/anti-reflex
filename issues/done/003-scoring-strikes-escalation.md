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

Stakes: composure scoring, combo, three strikes, the escalation curve, and the game-over transition — wired into the round loop end-to-end.

- Implement `scoring` exactly per the PRD *Scoring formula* (base 100, combo 1→8 cap, reset to 1 on strike, speed-bonus formula, correct-`resist` scoring, rounding, 0 for wrong). Match the worked example.
- Implement `escalation` per the PRD *Escalation curve* table: `{ inputWindowMs, maxBaitCount }` from `roundsSurvived`, monotonic to the 700ms floor / 5 ceiling.
- Wire `gameStateMachine` to apply scoring per round, reset combo on a strike, escalate window/bait params, and end the run at exactly three strikes with a `gameOver` snapshot.
- Surface the running composure score, combo, and strike count in the renderer.

## Acceptance criteria

- [ ] `scoring` reproduces the PRD worked example (total 630, 1 strike) and all stated rules.
- [ ] Combo climbs on consecutive correct (cap 8) and resets to 1 on any strike.
- [ ] `escalation` matches the table; window is monotonically non-increasing to 700ms, bait count non-decreasing to 5.
- [ ] The run ends at exactly three strikes and emits a `gameOver` snapshot.
- [ ] Score, combo, and strikes are visible during play.

## Blocked by

- Blocked by `issues/002-core-round-loop-state-machine.md`

## User stories addressed

- User story 7
- User story 16
- User story 17
- User story 20
- User story 21
