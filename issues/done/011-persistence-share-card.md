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

Persistence of the local best score and the shareable result card, with the PRD's fallback behavior — wired into the game-over screen.

- Implement `persistence` reading/writing the local best composure score in `localStorage`, with the PRD *Storage & clipboard fallbacks*: storage failures never block gameplay; fall back to an in-memory best score for the session.
- Implement `shareCard` building the shareable result string and copying to clipboard, with fallback: on clipboard failure leave the text visible/selectable and report the copy did not complete.
- Show the best score and the share card on the `gameOver` screen.

## Acceptance criteria

- [ ] Best composure score persists across reloads via `localStorage`; on storage failure the game still plays using an in-memory best for the session.
- [ ] Game over shows a share card with copy-to-clipboard; on clipboard failure the text stays selectable and a "copy didn't complete" state is shown.
- [ ] Best score updates only when the run beats it.

## Blocked by

- Blocked by `issues/003-scoring-strikes-escalation.md`

## User stories addressed

- User story 27
- User story 28
