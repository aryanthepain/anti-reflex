---
slug: 3-trap_library_expansion
title: Anti-Reflex Trap Library Expansion
stage: new
branch: null
parent_branch: main
prd: null
gaps_file: null
---

# Anti-Reflex Trap Library Expansion

Parking the backlog of traps here. The MVP (brief 1) ships a tight set — three rules (grey-dot side, blue/red go-no-go, Stroop color-vs-word) plus two universal baits (honeypot, peripheral bait). The whole game's replay value, though, comes from never letting the player get comfortable. This brief is the staging ground for everything else in the rule-twist library, to pull in once the core engine is proven.

## Goal

Grow the trap library so a run keeps surprising people, while keeping every new trap *fair* — each one must resolve to a single deducible answer under the active-rule banner.

## Trap backlog (from the design brief)

**Timing traps**
- Hold, don't tap — wait out a duration without flinching.
- The fake-out beat — a rhythm builds, then skips; your tap lands on silence.
- Premature penalty — acting too early is as fatal as acting wrong.
- Delayed truth — the real signal only counts ~0.5s after it appears.

**Visual traps**
- Decoy countdown — "3… 2… 1…" then nothing.
- The flicker — a cue appears then cancels; act only if it stays.
- Camouflage — the real cue hides among near-identical fakes (5% bigger).

**Cognitive / language (Stroop family)**
- Lying labels — a "SAFE" button is the trap; "DANGER" is the goal.
- Math gate — "press if the number is prime."
- Negation — "do NOT press the smiling face."

**Meta / fourth-wall**
- Inverted controls round — briefly, do the opposite of everything.
- Sudden-rule announcement — a new rule flashes for 1s mid-run.

## Fresh ideas to consider

- **Echo trap** — the *previous* round's correct answer becomes this round's wrong one; punishes muscle memory.
- **Crescendo bait** — audio/visual intensity ramps to scream "NOW," but the rule says resist until it stops.
- **Twin signal** — two valid-looking grey dots; only the one that appeared *first* counts.
- **Banner Stroop** — once advanced, the banner text itself becomes a Stroop trap (deliberately, and only after it's been honest for a while).

## Open questions

- Which traps compose cleanly with the existing banner-is-truth model vs. which need new judge logic?
- How to schedule trap introduction during escalation so each new one gets a fair first encounter.

## Out of scope

- Reworking the core loop or scoring — this brief only adds traps onto the proven engine.
