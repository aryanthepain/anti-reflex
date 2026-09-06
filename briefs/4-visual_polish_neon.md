---
slug: 4-visual_polish_neon
title: Anti-Reflex Neon Visual Polish
stage: new
branch: null
parent_branch: main
prd: null
gaps_file: null
---

# Anti-Reflex Neon Visual Polish

Right now the game *plays* but it doesn't *look* like anything. The core loop is solid — banner-is-truth, three rules, the shrinking window, the roast — but on screen it reads as "find the grey dot among some blobs." Flat layout, placeholder cues, a dull palette, and lifeless cuts between rounds. None of the tension we built into the design actually lands visually. This brief is about giving the whole thing a deliberate **neon arcade / synthwave** skin so it feels designed, not like a prototype.

## Goal

Make every screen feel intentional and atmospheric — menu, active round, roast, game over — without touching the core loop, the rules, or what counts as fair. A first-time player should look at it and immediately read "tense little arcade game," not "unfinished demo."

## Visual direction

Neon arcade / synthwave: a deep dark base, glowing accent colors, bold cue treatments with real presence, and a sense of depth/atmosphere behind the arena. The cues and baits should look like objects the game *wants* you to react to — that's the whole point, the visuals should sell the temptation the rules then punish.

## Scope (in)

- **Cues & baits.** Restyle the grey dot, the blue/red go-no-go cue, the Stroop word, the honeypot, and the peripheral baits so each is a designed object with glow/depth — not a flat shape.
- **Arena.** Give the play area depth and atmosphere (background treatment, framing) so cues sit *in* a space rather than floating on a panel.
- **Banner & HUD.** Make the rule banner feel like authoritative ground truth, and give the score/combo/strikes HUD an arcade readout feel.
- **Transitions.** Add motion to the seams — round-to-round, the RULE CHANGED flash, the strike roast — so the game breathes instead of cutting hard.
- **Palette & type.** A cohesive neon palette and a display typeface for headings/cues (a web font is acceptable here).

## Constraints

- Prefer pure-CSS / zero-asset effects (glow, gradients, animation) where they get us there. An external web font is fine; avoid heavy image/video assets.
- **Accessibility stays authoritative.** The existing shape-pairing (color is never the only signal) and the reduced-motion toggle must keep working exactly as they do now — the neon glow/flash is the *full-motion* treatment, and reduced-motion still gets a calm, readable fallback.

## Open questions

- Which display font, and does it stay readable for the Stroop rule where ink-vs-word is the trap?
- How far does the neon glow/bloom go under reduced motion before it stops being "reduced"?
- Performance budget — the heartbeat + flash + glow can't drop frames on the input window, since timing is the game.

## Out of scope

- No new rules, traps, or scoring changes — this is a skin over the proven engine, not a gameplay pass.
- No layout/IA rework beyond what the visual direction needs.
