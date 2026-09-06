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

The **honeypot** bait plus the input `source` metadata plumbing that makes baits always-wrong regardless of side.

- Extend the `InputEvent` to carry `source` per the PRD *Input event & source contract* (`keyboard | left-zone | right-zone | honeypot | peripheral-bait`).
- Implement the tempting honeypot button in `sceneGenerator`/`renderer` as a `bait` element with `inputSource: 'honeypot'`.
- Update `judge` so any input with a bait source is **wrong** (reason `baitPressed`) even when its side matches the correct action.
- Make the honeypot tactile/tempting in the renderer (placeholder physics is fine; full juice lands in the juice slice).

## Acceptance criteria

- [ ] Normalized input events carry a `source`; keyboard/zone sources judge on side/timing only.
- [ ] Pressing the honeypot is always judged `wrong` with reason `baitPressed`, even on the correct side.
- [ ] `sceneGenerator` places the honeypot as a non-answer `bait` role; the `judge` cross-check still yields exactly one correct action.

## Blocked by

- Blocked by `issues/002-core-round-loop-state-machine.md`

## User stories addressed

- User story 13
