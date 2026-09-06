---
slug: 2-tutorial_onboarding
title: Anti-Reflex Tutorial & Onboarding
stage: new
branch: null
parent_branch: main
prd: null
gaps_file: null
---

# Anti-Reflex Tutorial & Onboarding

Parking this for later. The MVP (brief 1) deliberately ships without a tutorial to stay tight, but we already flagged "feels *fair*, not cheap" as the make-or-break for the whole game. Once the core loop, the three rules, and the banner exist, a cold-start player walking up to a hackathon booth needs ~15 seconds of clean teaching or they'll bounce. This brief is about building that onboarding.

## Goal

Teach a brand-new player the one idea the whole game rests on — *obey the banner; your own instinct is the enemy* — fast enough that they're laughing at their first failure instead of confused by it.

## Scope (in, later)

- A ~15s interactive tutorial that teaches the banner concept with **one** clean rule and **one** bait, no scoring, no death.
- A clear "here's why you lost" framing so the first mistake feels fair and funny, not arbitrary.
- A path straight from tutorial into a real Endless run.

## Ideas to explore

- The "false tutorial" meta-trap: teach a rule cleanly, then break its own promise once the player trusts it. Powerful, but only *after* an honest tutorial has earned that trust — sequencing matters.
- Skippable for repeat players (remember via `localStorage`), always shown on first visit.
- Whether the tutorial should adapt to which rule the run will open with.

## Open questions

- Does onboarding live as a separate mode, or as a gentle first 15s of every fresh Endless run?
- How much to teach: just the banner concept, or one full rule end-to-end?

## Out of scope

- Teaching all rules/traps. One concept, taught well, is the whole job here.
