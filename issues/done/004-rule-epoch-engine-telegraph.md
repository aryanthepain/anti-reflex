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

The rule-epoch engine and the `RULE CHANGED` telegraph — the fairness machinery that lets the active rule/variant change without ever ambushing the player. This slice delivers the mechanism using the existing grey-dot rule; rule *content* (Blue/Red) arrives in the next slice.

- Implement deterministic **rule epochs** per the PRD *Rule-epoch & inversion contract*: a rule (and variant) is fixed for a seedable epoch length (default 5 rounds); changes happen **only at epoch boundaries, between rounds**, never during an active input window.
- Add the `ruleChange` state to `gameStateMachine` with a **1500ms `RULE CHANGED` flash** during which **input is disabled**; the next round's window opens only after the flash completes.
- Plumb the neutral banner so it renders the active rule (and variant text) from state, ready to carry variant labels.

## Acceptance criteria

- [ ] Rule/variant is constant within an epoch and only changes at epoch boundaries between rounds (deterministic given a seed).
- [ ] A `ruleChange` snapshot is emitted with a 1500ms flash; input submitted during the flash is ignored.
- [ ] Test proves a rule never changes during an active input window.
- [ ] The banner text is driven from state and updates on epoch change.

## Blocked by

- Blocked by `issues/002-core-round-loop-state-machine.md`

## User stories addressed

- User story 8
