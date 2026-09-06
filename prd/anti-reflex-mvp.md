# Anti-Reflex MVP — PRD

> Source brief: `briefs/prd-written/1-anti_reflex_mvp.md` (stage `grilling-done` → `prd-written`)
> Branch: `brief/1-anti_reflex_mvp`

## Assumptions

- The game is a pure static client-side app — **no backend, no AI, no external assets**. All art is CSS/Canvas; all sound is Web Audio synthesized at runtime.
- The full design is settled in the brief's `## Grilling outcomes`; this PRD turns those decisions into modules and stories, not re-litigates them.
- Target is a single internal-hackathon demo build: one mode (Endless/Survival). Tutorial and the wider trap library are deferred to briefs 2 and 3.
- Players use a modern evergreen browser (desktop keyboard/mouse or touch). No legacy-browser support is in scope.
- "Feels fair" is the make-or-break quality bar; the always-visible rule banner being ground truth is the mechanism that guarantees it.
- A `localStorage`-backed local high score is sufficient persistence — no shared/online leaderboard.
- Although the brief says "no build step" for the *game*, a dev-only test runner (Vitest) is acceptable since it never ships to the deployed artifact.

## Problem Statement

I'm building a reaction game for an internal hackathon where the win condition is drawing a crowd — people laughing as they and their friends fail. The twist that makes it memorable (your fast reflexes make you *lose*) is also its biggest risk: if a player can't tell *why* they lost, the game feels cheap and unfair, and the crowd evaporates. I need a playable, deployable build by the deadline that is instantly understandable, genuinely funny to fail at, and — critically — always *fair*, so that every death feels deserved and every onlooker wants a turn.

## Solution

A single-page, vanilla HTML/CSS/JS game. Each round shows a small **scene** (a true cue plus baits/decoys) under an **always-visible rule banner that is the ground truth**. The player makes exactly one decision — **Left, Right, or resist (no press)** — within a shrinking time window. The traps don't fight the rule; they fight the player's *instinct* to disobey it. Mistakes cost one of three strikes, each pausing for a commentator roast that quantifies the betrayal ("You reacted in 180ms… to the wrong thing"). Composure score climbs with a combo multiplier and speed bonus. Full juice (shake, flash, buzzer, chime, heartbeat, tactile buttons) sells the tension, while accessibility (color+shape pairing, reduced-motion toggle) keeps it playable by anyone. It deploys to GitHub Pages, auto-published from `main`.

## User Stories

1. As a new player, I want to understand the goal within seconds from an always-visible rule banner, so that I never feel the game is cheating me.
2. As a player, I want exactly one clear decision per round — Left, Right, or resist — so that I always know what actions are available.
3. As a player, I want to press the Left or Right arrow key to act, so that I can play fast on a keyboard.
4. As a touch player, I want tapping the left or right half of the screen to act as Left/Right, so that the game works on my phone with no extra UI.
5. As a player, I want doing nothing during the window to count as "resist," so that suppressing my urge is a real, scoreable choice.
6. As a player, I want a visible countdown/shrinking window per round, so that I feel the time pressure and know when a non-press resolves.
7. As a player, I want the round to escalate by adding more simultaneous traps and shortening the window, so that the run gets harder without changing the rules I just learned.
8. As a player, I want the rule banner to stay stable for a stretch and then change with a telegraphed "RULE CHANGED" flash, so that rule changes are fair and never ambush me silently.
9. As a player facing the "grey dot" rule, I want to press the side where the calm grey dot is, resisting the bright decoys, so that I'm rewarded for ignoring my instinct.
10. As a player facing the "react to blue / resist red" rule, I want a go/no-go decision by color, so that I practice withholding action on the wrong color.
11. As a player, I want the blue/red rule to sometimes invert (after a telegraphed change), so that I can't rely on muscle memory.
12. As a player facing the Stroop rule, I want to obey the ink color rather than the word, so that I have to override my reading instinct.
13. As a player, I want a tempting honeypot button that is never the correct answer, so that resisting it becomes a test of composure.
14. As a player, I want flashy peripheral bait that distracts from the real cue, so that I'm punished for chasing motion instead of reading the rule.
15. As a color-blind player, I want every color cue paired with a distinct shape or label, so that I can play the blue/red rule fairly.
16. As a player, I want pressing the wrong side, pressing when I should resist, or letting a required press lapse to count as a mistake, so that the rules of failure are consistent.
17. As a player, I want three strikes before the run ends, so that one slip doesn't end my turn and the crowd gets more laughs.
18. As a player, I want each strike to pause and tell me exactly what I did wrong, so that the failure is clear, fair, and funny.
19. As a player, I want a sassy commentator to roast each mistake with my reaction stats, so that losing is entertaining to me and onlookers.
20. As a player, I want my combo multiplier to reset on a strike, so that mistakes carry weight without ending the run.
21. As a player, I want a composure score that rewards correct decisions × a climbing combo plus a speed bonus, so that skillful, fast-but-correct play scores highest.
22. As a player, I want screen-shake, a red flash, and a buzzer on a wrong action, so that mistakes feel visceral.
23. As a player, I want a soft chime on a correct resist, so that restraint feels rewarding.
24. As a player, I want rising heartbeat audio as the window shrinks, so that tension builds and silence becomes a weapon.
25. As a player, I want buttons that feel tactile and physically tempting, so that the honeypot is genuinely hard to resist.
26. As a player who is sensitive to motion, I want a reduced-motion toggle that swaps shake/flash for a gentle border-pulse, so that I can still play comfortably.
27. As a returning player, I want my best composure score saved locally, so that I have a number to beat.
28. As a player, I want a shareable result card with copy-to-clipboard text summarizing how I cracked, so that I can challenge friends.
29. As a player, I want to start a new run immediately after game over, so that "one more try" is frictionless.
30. As an onlooker, I want to instantly understand why the current player failed, so that I'm drawn in and want my own turn.
31. As a developer, I want the fairness-critical logic isolated in pure modules, so that I can unit-test that every scene has exactly one deducible correct answer.
32. As a developer, I want scene generation to be seedable, so that tests are deterministic and a bug can be reproduced.
33. As a hackathon presenter, I want the game auto-deployed to a public URL from `main`, so that I can share a link instead of a localhost demo.

## Implementation Decisions

**Architecture.** Pure vanilla HTML/CSS/JS ES modules, no framework, no build step for the shipped game. A clear split between **deep pure-logic modules** (no DOM, unit-tested) and **shallow render/IO modules** (DOM/Web Audio, not unit-tested).

Deep pure-logic modules:
- **`judge`** — input: active rule, the scene's elements, the player's action (`left | right | resist`), and timing (press time vs. window). Output: `{ outcome: 'correct' | 'wrong', reason }`. The single source of fairness truth. Knows nothing about rendering.
- **`sceneGenerator`** — input: active rule + difficulty params + a seedable RNG. Output: a scene descriptor (the true cue and its side, the set of baits/decoys present and their positions). Deterministic given a seed. Guarantees exactly one correct answer under the active rule.
- **`scoring`** — a pure reducer over judged outcomes: tracks composure score, combo multiplier (climbs on correct, resets to 1 on strike), speed bonus, and strike count (run ends at 3).
- **`escalation`** — input: rounds survived. Output: difficulty params (input-window length, number of simultaneous traps). Encodes the difficulty curve.
- **`gameStateMachine`** — orchestrates the flow `menu → round (cue → input window → judge) → strike/roast → escalate → gameOver`. Holds run state; delegates decisions to the pure modules; emits state for the renderer and requests input. Render and input are injected so it can be driven in tests.

Shallow render/IO modules:
- **`renderer`** — draws the banner, scene elements, window/countdown, and strike/roast screens from state (DOM + CSS, Canvas where useful). Owns the juice visuals (shake, flash, tactile button physics) and honors reduced-motion.
- **`audio`** — Web Audio synthesis of buzzer, chime, and the shrinking-window heartbeat. No asset files.
- **`input`** — normalizes keyboard (Left/Right arrows), mouse click, and touch (left-half/right-half) into `left | right | resist` events; resist is the absence of a press before window expiry.
- **`commentator`** — selects roast lines and formats the betrayal stat from the judged mistake (thin data lookup).
- **`persistence`** — reads/writes the local best composure score in `localStorage`.
- **`shareCard`** — builds the shareable result string and copies it to the clipboard.

**Rules (banner ground truth) for MVP:** (1) press the side of the grey dot; (2) react to blue / resist red (telegraphably invertible); (3) obey the ink color, not the word (Stroop). **Baits (never correct):** honeypot button, peripheral bait.

### Rule contracts (the action mappings `judge` derives)

Every scene resolves to exactly one correct action in `left | right | resist`. Each rule below defines how the scene's elements map to that action. All color cues are paired with a shape and a text label so they are color-blind safe.

**Rule 1 — Grey dot.** The scene contains exactly one calm **grey dot** (shape: filled circle, label `DOT`) on either the left or right side, plus one or more bright decoy dots on the other side(s). Correct action = press the side the grey dot is on (`left` or `right`). `resist` and the decoy side are wrong. The grey dot is never center-only; it always carries a `side`.

**Rule 2 — Blue/Red (go / no-go, invertible).** The scene contains exactly one rule-relevant colored cue with a `side`. Color cues are paired for accessibility: **blue** = circle shape, label `GO`; **red** = octagon shape, label `STOP`.
- *Normal variant (`ruleVariant: 'normal'`):* a **blue** cue means press that cue's side; a **red** cue means `resist`.
- *Inverted variant (`ruleVariant: 'inverted'`):* a **red** cue means press that cue's side; a **blue** cue means `resist`.

The banner text states the active variant explicitly (e.g. "REACT TO BLUE · RESIST RED" vs. "REACT TO RED · RESIST BLUE"). `judge` must cover all four cases (blue-normal, red-normal, blue-inverted, red-inverted).

**Rule 3 — Stroop (obey the ink, not the word).** The scene shows a single color **word** (e.g. the text "LEFT", "RIGHT", or "RESIST") rendered in an **ink color**, where the word is bait and may contradict the ink. Ink color/shape/label maps to the action:
- ink **green** (shape: triangle, label `▲L`) → `left`
- ink **orange** (shape: diamond, label `◆R`) → `right`
- ink **grey** (shape: bar, label `▬X`) → `resist`

The displayed word is decorative bait only and never changes the correct action. `resist` is a valid correct outcome during Stroop rounds (grey ink). `judge` covers each of the three ink mappings with a contradicting word.

### Input event & source contract

Normalized input events carry both an action and a source, without adding a fourth player action:

```
InputEvent = { action: 'left' | 'right' | 'resist',
               source: 'keyboard' | 'left-zone' | 'right-zone' | 'honeypot' | 'peripheral-bait',
               pressMs: number }   // pressMs relative to round start; omitted for resist
```

`judge` marks any input whose `source` is `honeypot` or `peripheral-bait` as **wrong** (reason `baitPressed`) even when its side matches the correct action. Keyboard, `left-zone`, and `right-zone` sources are judged purely on side/timing.

### Timing contract (input phases)

The input window opens at `inputWindowStart` (cue reveal) and lasts `inputWindowMs` (set by `escalation`). Phases:
- An input with `pressMs < inputWindowStart` (before the cue) is judged **wrong**, reason `tooEarly`.
- The **first** input during the window is judged immediately and **locks the round**.
- If the window expires with no input, the resolved action is `resist` and is judged against the rule.
- Late inputs after a round is judged/locked are **ignored** until the next round.

### Scene descriptor schema (`sceneGenerator` output) and fairness invariants

```
Scene = {
  activeRule: 'greyDot' | 'blueRed' | 'stroop',
  ruleVariant: 'normal' | 'inverted',   // only meaningful for blueRed
  inputWindowMs: number,
  elements: [
    { id, role: 'trueCue' | 'decoy' | 'bait',
      type,            // e.g. 'dot' | 'colorCue' | 'word' | 'honeypot' | 'peripheralBait'
      side: 'left' | 'right' | null,
      color, shapeLabel, word,           // present where relevant to the rule
      inputSource }                       // for clickable elements: 'honeypot' | 'peripheral-bait' | 'left-zone' | 'right-zone'
  ]
}
```

Invariants the generator must guarantee (cross-checked in tests by running `judge`):
- Exactly **one** `trueCue` element per scene.
- All `bait` elements have a non-answer role: pressing their `inputSource` is always judged wrong.
- Validating the scene by running `judge` over `left`, `right`, and `resist` yields **exactly one** correct action.

### Rule-epoch & inversion contract

- A rule (and, for blueRed, its variant) is fixed for a **rule epoch** of a deterministic number of rounds (default: epochs are 5 rounds long; seedable). Rule/variant changes happen **only at epoch boundaries, between rounds** — never during an active input window.
- A rule change is telegraphed by a `RULE CHANGED` flash shown for **1500ms** between rounds. **Input is disabled during the flash.** The next round's window does not open until the flash completes.
- The blueRed inversion is surfaced in the neutral banner text (above), not by restyling the banner.

### State machine public interface & test clock (`gameStateMachine`)

- `startRun({ seed })` — begins a run with a seeded RNG.
- `submitInput(inputEvent)` — feeds a normalized `InputEvent`.
- `tick(nowMs)` — advances time via an **injected clock**; all window/expiry logic is driven by `tick`, never wall-clock timers, so tests are deterministic.
- Emits immutable **state snapshots** for phases: `menu`, `ruleChange`, `round`, `strike`, `gameOver`. Tests assert only on public snapshots/events, never private state.

**Run model:** three strikes; each strike pauses for the roast screen and resets the combo; third strike ends the run and shows the share card.

### No-tutorial walk-up affordance

Even though a tutorial is out of scope, the eight-second walk-up promise must hold:
- Before a run starts, the screen must make the **three available actions** (Left / Right / Resist) discoverable through concise on-screen controls/affordances.
- During every round, the **neutral rule banner** plus visible **left / right / resist** affordances must be legible enough for a first-time onlooker to infer the decision without instruction.

### Scoring formula (`scoring`)

- **Base points per correct outcome:** `100`. A wrong outcome awards **0** points.
- **Combo:** starts at `1`, **increments by 1** on each consecutive correct decision, **caps at `8`**, and **resets to `1`** on any strike (wrong outcome).
- **Speed bonus** (only on correct *press* outcomes — `left`/`right`): `round(50 * (1 - reactionMs / windowMs))`, clamped to `[0, 50]`. A **correct `resist`** is scored as a correct decision with **no speed bonus** (its "reaction" is the full window), i.e. `base * combo` only.
- **Round score** = `(base + speedBonus) * combo`, rounded to the nearest integer.
- **Run composure total** = sum of round scores across the run.

*Worked example (window 1000ms):* R1 correct left @200ms → speed `40`, combo 1 → `(100+40)*1 = 140`. R2 correct resist → combo 2 → `100*2 = 200`. R3 wrong (strike) → `0`, combo resets to 1. R4 correct right @100ms → speed `45`, combo 2 → `(100+45)*2 = 290`. Total = `630`, strikes = 1.

### Escalation curve (`escalation`)

Input is `roundsSurvived` (0-based). Output is `{ inputWindowMs, maxBaitCount }`, bounded:

| roundsSurvived | inputWindowMs | maxBaitCount |
|----------------|---------------|--------------|
| 0–2            | 1200          | 1            |
| 3–5            | 1050          | 2            |
| 6–9            | 900           | 3            |
| 10–14          | 800           | 4            |
| 15+            | 700 (floor)   | 5 (ceiling)  |

`inputWindowMs` is monotonically non-increasing to a **700ms floor**; `maxBaitCount` is monotonically non-decreasing to a **5 ceiling**. The generator may place fewer baits than `maxBaitCount` but never more.

**Accessibility contract:** every color-bearing cue also carries a distinct shape/text label (see rule contracts above). A reduced-motion toggle (defaulting from `prefers-reduced-motion`) swaps shake/flash for a border-pulse while preserving audio and gameplay. All input methods flow through the one shared `judge`.

### Audio lifecycle (`audio`)

- The Web Audio context initializes **only after an explicit start/user gesture** (e.g. pressing Start); it is never created on page load.
- A visible **mute toggle** is provided and its state is **persisted** in `localStorage`. Gameplay remains fully playable with audio muted, blocked, or unavailable (audio failures never block play).
- Reduced-motion does **not** auto-mute audio; mute and reduced-motion are independent toggles.

### Storage & clipboard fallbacks

- `localStorage` failures (private mode, quota, insecure context) must **not block gameplay**: fall back to an in-memory best score for the session and simply skip persisting.
- Clipboard API failures leave the share-card text **visible and selectable** and report that the copy did not complete, so the player can copy manually.

**Deploy:** GitHub Pages via a GitHub Actions workflow. The workflow **runs the Vitest suite first**, then publishes **only the static game artifact directory** (HTML/CSS/JS) to Pages — excluding tests, coverage, and `node_modules`. A manual **smoke checklist** for the public URL covers: page load, Start, keyboard play, touch/click play, three-strike game over, local best-score persistence, and share-card copy (including clipboard fallback).

## Testing Decisions

**What makes a good test here:** tests assert *external behavior* through a module's public interface, not internal implementation. They feed inputs (rule + scene + action + timing) and assert outcomes (correct/wrong + reason, score deltas, difficulty params). Scene generation is tested with a fixed seed so results are deterministic. No test reaches into private state or couples to DOM structure.

**Modules under test (all pure-logic modules + commentator):**
- **`judge`** — deepest coverage. For every rule, assert: correct action scores correct; each wrong variant (wrong side, press-when-resist, lapsed-required-press, too-early) scores wrong with the right reason; honeypot and peripheral bait are never the correct answer (`baitPressed` even when their side matches); the blue/red inversion flips correctness across all four cases; the Stroop rule keys off ink color, not the word, including correct `resist` on grey ink. Timing phases are asserted: `tooEarly` before the window, in-window first press locks the round, window expiry resolves to `resist`, and post-judgment late inputs are ignored.
- **`sceneGenerator`** — given a seed, output is deterministic and reproducible; every generated scene has exactly one correct answer under its active rule (cross-checked against `judge` over `left`/`right`/`resist`); exactly one `trueCue` per scene; difficulty params increase trap count up to the ceiling; baits never occupy the "correct" role.
- **`scoring`** — combo climbs (capped at 8) on consecutive correct, resets to 1 on a strike; speed bonus matches the formula and is omitted for correct `resist`; wrong outcomes award 0; run ends at exactly three strikes; composure total matches the worked-example decision stream.
- **`escalation`** — `inputWindowMs` monotonically non-increases to the 700ms floor and `maxBaitCount` monotonically non-decreases to the 5 ceiling as `roundsSurvived` increases; curve matches the escalation table.
- **`gameStateMachine`** — drives a scripted sequence through injected input/render fakes and the injected clock (`tick`), asserting public state snapshots (`menu → round → strike → ruleChange → gameOver`); a rule/variant change never occurs during an active input window; run ends after three strikes.
- **`commentator`** — returns an appropriate roast/reason for each mistake type and formats the betrayal stat; never returns empty.

**Prior art:** none — this is a greenfield repo. Establish the convention: pure ES modules with co-located `*.test.js` run by **Vitest**, kept entirely out of the shipped static bundle.

## Out of Scope

- Tutorial / onboarding (deferred to `briefs/2-tutorial_onboarding.md`).
- The wider trap library beyond the three MVP rules + two baits (deferred to `briefs/3-trap_library_expansion.md`).
- Stretch modes: Gauntlet, Sudden Death Duel, Zen-but-not. Only Endless/Survival ships.
- Any backend, online/shared leaderboard, accounts, or AI.
- Narrative theme skins (Office, Nerve, Big Red Button, Zen).
- Legacy browser support and a production build/minification pipeline.
- Automated tests for `renderer`, `audio`, `input`, `persistence`, and `shareCard` (DOM/IO-bound, low ROI for the hackathon).

## Further Notes

- The fairness invariant — *every generated scene has exactly one correct answer deducible from the banner* — is the project's load-bearing guarantee. The `sceneGenerator` ↔ `judge` cross-check in tests is the primary defense for it and should be treated as the highest-value test.
- The banner deliberately renders in neutral styling so it isn't an accidental Stroop trap; turning the banner itself into a trap is explicitly a brief-3 idea, not MVP.
- Keep all randomness behind the seedable RNG passed into `sceneGenerator` so nothing in the logic path is non-deterministic under test.
