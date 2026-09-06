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

Full juice and the commentator roast — the layer that sells tension and makes failure funny — plus the `audio` lifecycle.

- Implement the `renderer` juice: screen-shake + red flash + buzzer on a wrong action, soft chime on a correct resist, rising heartbeat as the window shrinks, and tactile button physics (including the honeypot). All CSS/Web Audio, no external assets. Honor the reduced-motion toggle from the accessibility slice.
- Implement `audio` per the PRD *Audio lifecycle*: context initializes **only after a start/user gesture**; a visible **mute toggle persisted in `localStorage`**; gameplay fully playable when muted/blocked/unavailable; mute independent of reduced-motion.
- Implement `commentator`: on each strike, pause for the roast screen, select a roast line for the mistake type, and format the betrayal stat ("You reacted in 180ms… to the wrong thing"). Covered by tests (never returns empty; matches mistake type).

## Acceptance criteria

- [ ] Wrong action triggers shake + red flash + buzzer; correct resist triggers a soft chime; heartbeat rises as the window shrinks.
- [ ] Buttons (incl. honeypot) feel tactile; reduced-motion swaps visuals for a border-pulse.
- [ ] Audio context starts only after a user gesture; mute toggle is visible and persisted; play continues if audio is blocked.
- [ ] `commentator` returns an appropriate non-empty roast + formatted betrayal stat per mistake type (unit-tested).
- [ ] Each strike pauses on a roast screen explaining what the player did wrong.

## Blocked by

- Blocked by `issues/003-scoring-strikes-escalation.md`

## User stories addressed

- User story 18
- User story 19
- User story 22
- User story 23
- User story 24
- User story 25
