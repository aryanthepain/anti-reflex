---
slug: 1-anti_reflex_mvp
title: Anti-Reflex MVP
stage: done
branch: brief/1-anti_reflex_mvp
parent_branch: main
prd: prd/anti-reflex-mvp.md
gaps_file: briefs/done/1-anti_reflex_mvp.gaps.md
---

# Anti-Reflex MVP

Anti-Reflex is a reaction game that punishes your reflexes — the instinct that makes you fast everywhere else makes you lose here. The whole hook is that you have to out-think your own nervous system: see the trap, suppress the urge, and act only when you truly should. We're building this for the internal hackathon, where the win condition isn't polish — it's drawing a crowd that all wants a turn and laughing at each other failing. So this brief scopes the full MVP across all the build phases, not a slice. I want one playable, shippable thing by the deadline.

## Goal

Ship a playable, deployable MVP that demos well to a live crowd. Anyone should be able to walk up, get it in about eight seconds, and immediately want to hand the keyboard to the next person. That means the core mechanic has to feel *fair* (not cheap) and the failure has to feel *funny*.

## Scope (in)

- The core state machine: cue → input window → judge → escalate. This is the engine everything else hangs off of.
- At least one trap fully working end-to-end and feeling good — not a half-built shell.
- Composure/score tracking so a run has stakes and a number to beat.
- A deployed build (GitHub Pages or Azure Static Web Apps) so it's a link, not a localhost demo.
- Broadly relatable, accessible framing — playable by anyone who walks up, no insider context required.

## Scope (tight — not this phase)

- Stretch modes (Gauntlet, Sudden Death Duel, Zen-but-not). Endless/Survival is enough to demo.
- The full trap library. We need one or a few that land, not all of them.
- Heavy art or a committed theme skin. Keep the look minimal and high-contrast; chaos comes from behavior, not clutter.

## Deliverables

- Working state machine driving the core loop.
- At least one fully-working trap.
- Composure/score tracking.
- A live, deployed build anyone can open from a link.

## Open questions / risks

- **Judge fairness tuning.** The input timing and judge logic decide whether the game feels brilliant or unfair. The whole reputation of the game rides on this line — needs real tuning, not a guess.
- **Accessibility from day one.** Pair every cue with shape/text (color-blind safe) and support a reduced-motion mode. Cheaper to bake in now than to retrofit before the demo.

## Grilling outcomes

Decisions locked during grilling, for `write-a-prd` to build on:

- **Input model.** Three possible actions per round: **Left arrow, Right arrow, or no-press (resist)**. Touch mirrors this exactly — tap left half = Left, tap right half = Right, no touch = resist. Keyboard, click, and touch all flow through one shared judge.
- **Round = one scene, one decision.** Each round is a small scene with several elements on screen at once (true cue + distractors). The player makes a single Left/Right/resist call. Conflicting traps are allowed to stack into one harder decision.
- **Fairness model (resolves the #1 risk).** An **always-visible active-rule banner is ground truth**. Traps don't fight the rule — they fight your *instinct* into disobeying it. The banner stays stable for a stretch of rounds, then changes with a telegraphed "RULE CHANGED" flash. Banner renders in neutral styling so it isn't an accidental Stroop trap.
- **Timing.** Fixed input window per round (~1200ms to start, shrinks as you escalate). A press is judged instantly; if the window expires with no press, that resolves as **resist**. Escalation = more simultaneous traps per scene + tighter window (not new rules each round).
- **MVP rule/trap set.** Three rules the banner can state — (1) press the side of the **grey dot**, (2) react to **blue** / resist **red** (telegraphed change can invert it), (3) **obey the color, not the word** (Stroop) — plus two universal baits that are never the answer: the **honeypot** button and **peripheral bait**.
- **Run-end & scoring.** **Three strikes**, not instant death. Each mistake **pauses and tells the player what they did wrong** (the commentator roast moment); the combo multiplier resets to 1 on a strike. Composure score = correct decisions × climbing combo + speed bonus. Third strike ends the run.
- **Juice (full set).** Commentator roast + betrayal stat ("You reacted in 180ms… to the wrong thing"), screen-shake + red flash + buzzer on a wrong action, soft chime on a correct resist, rising heartbeat audio as the window shrinks, and tactile button physics — all CSS/Web Audio, zero external assets.
- **Visual design.** No narrative skin. An original, friendly, high-contrast minimal look that appeals to all ages (kids and adults), built entirely from CSS/Canvas with **no external assets**. Chaos comes from behavior, not clutter.
- **Accessibility.** Every color cue also carries a distinct shape/text label (so the blue/red rule is color-blind safe). A reduced-motion toggle (respects `prefers-reduced-motion`) swaps shake/flash for a gentler border-pulse while keeping audio and full gameplay.
- **Tech & deploy.** Pure vanilla HTML/CSS/JS, no framework, no build step. A single explicit state machine: `menu → round (cue → input window → judge) → strike/roast → escalate → game over`. `localStorage` for scores; a client-side shareable result card with copy-to-clipboard. Deployed to **GitHub Pages, auto-deployed from `main` via GitHub Actions**.

### Scope changes from grilling

- **Tutorial deferred** out of this MVP into its own brief — see `briefs/2-tutorial_onboarding.md`.
- **Additional traps deferred** to their own brief — see `briefs/3-trap_library_expansion.md`.
