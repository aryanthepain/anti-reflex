---
brief: 1-anti_reflex_mvp
prd: prd/anti-reflex-mvp.md
judged_by: "GitHub Copilot (user-confirmed judge model switch)"
date: 2026-06-02
---

# PRD Gaps: Anti-Reflex MVP — PRD

Each gap is an atomic, applyable instruction for revising the PRD. Apply highest severity first.

## G1 — Define blue/red side semantics
- **Severity:** blocker
- **Location:** User Stories #10-11; Implementation Decisions > Rules; Testing Decisions > `judge`
- **Problem:** The PRD says "react to blue / resist red" but never states which side to press when the cue is blue, nor exactly how the inverted variant changes the correct answer. Without this, `judge` and `sceneGenerator` cannot derive one concrete `left | right | resist` answer from the banner.
- **Suggested fix:** Add a rule contract stating that each blue/red scene has exactly one rule-relevant colored cue with a `side`. In normal mode, a blue cue means press that cue's side and a red cue means resist; in inverted mode, a red cue means press that cue's side and a blue cue means resist. Specify the paired shape/text labels for each color state and update the judge tests to cover all four cases.
- **Status:** [x] resolved

## G2 — Define Stroop action mapping
- **Severity:** blocker
- **Location:** User Stories #12, #15; Implementation Decisions > Rules; Testing Decisions > `judge`
- **Problem:** "Obey the ink color, not the word" does not define how ink color maps to `left`, `right`, or `resist`. The PRD also does not say whether resist can be correct during Stroop rounds, so the rule is not implementable or testable.
- **Suggested fix:** Add an explicit Stroop mapping to the PRD. For example: ink color/shape label A maps to Left, ink color/shape label B maps to Right, and ink color/shape label C maps to Resist; the displayed word is only a bait and may contradict the ink mapping. Include at least three example Stroop scenes and expected judge outcomes.
- **Status:** [x] resolved

## G3 — Reconcile honeypot behavior with side-only input
- **Severity:** blocker
- **Location:** User Stories #4, #13, #25; Implementation Decisions > `input`, Rules; Testing Decisions > `judge`
- **Problem:** The PRD says mouse/touch normalize to left-half/right-half actions, while the honeypot button is "never the correct answer." If a clickable honeypot sits on the same half as the correct side, a side-only judge would incorrectly treat that honeypot press as correct.
- **Suggested fix:** Add source metadata to normalized input events without adding a fourth player action, e.g. `{ action: 'left' | 'right' | 'resist', source: 'keyboard' | 'left-zone' | 'right-zone' | 'honeypot' | 'peripheral-bait' }`. State that `judge` marks honeypot/peripheral-bait sources wrong even when their side matches the correct action, and require tests for that invariant.
- **Status:** [x] resolved

## G4 — Specify the scene descriptor schema and fairness invariants
- **Severity:** major
- **Location:** Implementation Decisions > `sceneGenerator`; Testing Decisions > `sceneGenerator`; Further Notes
- **Problem:** The PRD names true cues, decoys, and baits, but it does not define the scene data shape or the constraints that prevent ambiguous scenes. "Conflicting traps are allowed" and "exactly one correct answer" can conflict unless the generator has explicit invariants.
- **Suggested fix:** Add a scene descriptor schema with fields such as `activeRule`, `ruleVariant`, `inputWindowMs`, and `elements[]` where each element has `id`, `role` (`trueCue | decoy | bait`), `type`, `side`, `color`, `shapeLabel`, `word`, and `inputSource` where applicable. Add invariants: exactly one true cue per scene, all baits are non-answer roles, and validating the scene by running `judge` over `left`, `right`, and `resist` yields exactly one correct action.
- **Status:** [x] resolved

## G5 — Clarify cue timing and too-early inputs
- **Severity:** major
- **Location:** Implementation Decisions > Timing contract; Testing Decisions > `judge`, `gameStateMachine`
- **Problem:** The timing contract says "Pressing before the cue is valid (or too early, where a rule requires it)," which is contradictory and introduces an undefined failure mode. It is unclear whether inputs before the window, after the window, or repeated inputs after a first press should be ignored or judged.
- **Suggested fix:** Define the exact input phases. For example: inputs before `inputWindowStart` are judged wrong with reason `tooEarly`; the first input during the window is judged immediately and locks the round; if the window expires with no input, the action is `resist`; late inputs after judgment are ignored until the next round. Update tests to cover pre-window, in-window, expiry, and post-judgment inputs.
- **Status:** [x] resolved

## G6 — Make rule changes and inversion schedule testable
- **Severity:** major
- **Location:** User Stories #8, #11; Implementation Decisions > Rules; Implementation Decisions > `gameStateMachine`
- **Problem:** Phrases like "stable for a stretch," "sometimes invert," and "telegraphed" are too vague for implementation. A rule change that happens at an unclear time risks violating the PRD's central fairness guarantee.
- **Suggested fix:** Add a deterministic rule-epoch contract, including when rule changes occur, how long the `RULE CHANGED` flash is visible, whether input is disabled during the flash, and how the inverted blue/red variant is shown in the neutral banner. Include tests that a rule never changes silently during an active input window.
- **Status:** [x] resolved

## G7 — Define scoring formula, combo bounds, and rounding
- **Severity:** major
- **Location:** User Stories #20-21; Implementation Decisions > `scoring`; Testing Decisions > `scoring`
- **Problem:** "Correct decisions × climbing combo + speed bonus" is directionally clear but not a formula. Tests cannot assert score totals, combo behavior, or resist scoring without base values, caps, rounding, and speed-bonus rules.
- **Suggested fix:** Add an exact scoring formula: base points per correct outcome, combo increment and maximum, combo reset behavior, speed-bonus calculation from `reactionMs` and `windowMs`, how correct resist is scored when reaction time is the full window, rounding rules, and whether wrong outcomes award zero points. Include one worked scoring example across several rounds with a strike.
- **Status:** [x] resolved

## G8 — Define escalation curve and bounds
- **Severity:** major
- **Location:** User Stories #7; Implementation Decisions > `escalation`; Testing Decisions > `escalation`
- **Problem:** The PRD says the input window starts around 1200ms, shrinks to a floor, and adds more simultaneous traps, but it does not define the actual schedule or bounds. This leaves the MVP feel and tests underspecified.
- **Suggested fix:** Add an explicit escalation table or formula that maps rounds survived to `inputWindowMs`, maximum bait count, and any bait-intensity flags. Include the starting value, minimum floor, trap-count ceiling, and the round thresholds where each value changes.
- **Status:** [x] resolved

## G9 — Define the state machine public interface and test clock
- **Severity:** major
- **Location:** Implementation Decisions > `gameStateMachine`; Testing Decisions > `gameStateMachine`
- **Problem:** The PRD says render and input are injected so the state machine can be tested, but it does not define the public API, emitted events, or timer abstraction. Without an injectable clock/timer, round-window tests are likely to become flaky or implementation-coupled.
- **Suggested fix:** Add a minimal interface contract such as `startRun({ seed })`, `submitInput(inputEvent)`, `tick(nowMs)` or an injected scheduler, and emitted state snapshots for `menu`, `ruleChange`, `round`, `strike`, and `gameOver`. State that tests drive time through the fake clock and assert only public state snapshots/events.
- **Status:** [x] resolved

## G10 — Add audio lifecycle, mute, and failure behavior
- **Severity:** major
- **Location:** User Stories #22-24, #26; Implementation Decisions > `audio`; Accessibility contract
- **Problem:** Web Audio often requires a user gesture before playback, and the PRD does not specify what happens if audio cannot start, is blocked, or is unwanted. Reduced motion is covered, but audio accessibility and browser failure paths are not.
- **Suggested fix:** Require audio to initialize only after an explicit start/user gesture, add a visible mute toggle persisted locally, and state that gameplay remains fully playable with audio disabled or unavailable. Define that reduced-motion does not automatically mute audio, but mute can be toggled independently.
- **Status:** [x] resolved

## G11 — Add storage and clipboard fallback behavior
- **Severity:** minor
- **Location:** User Stories #27-28; Implementation Decisions > `persistence`, `shareCard`
- **Problem:** `localStorage` and Clipboard API calls can fail because of browser privacy settings, permissions, insecure contexts, or quota errors. The PRD treats both as always available.
- **Suggested fix:** Add fallback requirements: storage failures should not block gameplay and should show no best-score update or use in-memory best score for the session; clipboard failures should leave the share text visible/selectable and report that copy did not complete.
- **Status:** [x] resolved

## G12 — Specify deployment artifact and smoke acceptance
- **Severity:** minor
- **Location:** User Stories #33; Implementation Decisions > Deploy; Out of Scope
- **Problem:** "GitHub Pages via GitHub Actions" does not say what directory is published, whether tests run before deployment, or how to avoid shipping dev-only files. The PRD also lacks an end-to-end acceptance check that the deployed link is actually playable.
- **Suggested fix:** Add a deploy contract: the workflow runs the unit test suite, publishes only the static game artifact directory to GitHub Pages, and excludes tests, coverage, and dependencies. Add a manual smoke checklist for the public URL covering load, start, keyboard play, touch/click play, three-strike game over, local best score, and share-card copy/fallback.
- **Status:** [x] resolved

## G13 — Preserve the eight-second walk-up affordance without a tutorial
- **Severity:** minor
- **Location:** Problem Statement; User Stories #1-6, #29-30; Out of Scope
- **Problem:** Tutorial/onboarding is explicitly out of scope, but the MVP still promises that a new player understands the game in seconds. The PRD does not define the minimal first-screen or in-run affordances needed to make that true.
- **Suggested fix:** Add a small no-tutorial acceptance requirement: before starting a run, the screen must make the three available actions discoverable through concise controls/affordances, and during every round the neutral rule banner plus left/right/resist affordances must be visible enough for a first-time onlooker to infer the decision.
- **Status:** [x] resolved

## Overall assessment
This PRD is ready-with-fixes, not ready to slice directly into issues. The concept, module split, and fairness-first test strategy are solid, but the core rule/action mappings and timing contracts need tightening before implementation work is divided. Apply the blocker gaps first, then the major gaps that turn scoring, escalation, state-machine timing, and accessibility into testable contracts.
