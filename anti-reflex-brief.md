# 🧠 Anti-Reflex — Game Design Brief

## ⚡ One-line pitch
*A reaction game that punishes your reflexes.* The instinct that makes you fast at every other game makes you **lose** this one. You must out-think your own nervous system — see the trap, suppress the urge, act only when you truly should.

## 🎯 Core fantasy
Everyone secretly believes they have great self-control. This game proves, in about 8 seconds, that they don't — and makes them laugh about it. It's a battle between your **eyes (fast, dumb)** and your **brain (slow, smart)**.

## 🔁 Core loop
1. A cue appears on screen.
2. Your instinct screams **"TAP!"**
3. You must decide: is this the *real* signal, or a trap?
4. Act on a trap → fail / lose points. Correctly *resist* (or act on the rare true cue) → score + the tension ratchets up.
5. Speed and trap-density escalate. One slip can end the run.

---

## 🧩 The Rule-Twist Library (the heart of the game)
The whole game is built from stacking these "your instinct is wrong" mechanics. Pack in as many as possible and rotate them so players never get comfortable:

**Visual traps**
- **GO means stop.** A giant green "GO!" is a trap; the real signal is a tiny calm grey dot.
- **The honeypot.** A huge juicy pulsing button that does literally nothing but beg to be pressed.
- **Color inversion rounds.** "React to red" suddenly flips to "react to blue" mid-run.
- **Decoy countdown.** "3… 2… 1…" then *nothing* — tapping on 0 kills you.
- **The flicker.** A cue appears then *cancels* a split-second later — act only if it stays.
- **Camouflage.** The real cue hides among near-identical fakes (one dot is 5% bigger).
- **Peripheral bait.** Flashy explosions in the center; the real signal quietly appears in a corner.

**Timing traps**
- **Hold, don't tap.** Some cues require you to *wait out* a duration without flinching.
- **The fake-out beat.** A rhythm builds, then skips — your tap lands on silence.
- **Premature penalty.** Acting too *early* is as fatal as acting wrong.
- **Delayed truth.** The real signal only counts ~0.5s *after* it appears; instant taps fail.

**Cognitive / language traps (Stroop-style)**
- **Word vs. color.** The word "GREEN" written in red ink — which do you obey? Rule decides.
- **Lying labels.** A button labeled "SAFE" is the trap; "DANGER" is the goal.
- **Math gate.** "Tap if the number is prime" — forces a beat of thought against the clock.
- **Negation.** "Do NOT tap the smiling face" — your instinct ignores the "NOT."

**Meta / fourth-wall traps**
- **Inverted controls round.** Briefly, the rule becomes "do the opposite of everything you've learned."
- **The false tutorial.** It teaches a rule, then breaks its own promise once you trust it.
- **Sudden-rule announcement.** A new rule flashes for 1s mid-run; miss it and you're doomed.

---

## 🎮 Game modes
- **Tutorial (15s):** teaches exactly one rule cleanly so the game feels *fair*, not cheap. Critical for the "this is brilliant" vs. "this is unfair" line.
- **Endless / Survival:** traps escalate forever; one fatal slip ends it. Score = streak. The default leaderboard mode.
- **The Gauntlet:** ~10 hand-crafted levels, each introducing one new twist, culminating in a chaotic finale that stacks them all.
- **Sudden Death Duel (2-player):** two players, one keyboard (or two phones) — *whoever breaks first loses*. Insane crowd energy at a hackathon.
- **Zen-but-not:** calm visuals, slow pace, but the traps are subtler and meaner. For the overconfident.

---

## 🏆 Scoring & feedback
- **Composure score:** points for every correct resist; multiplier for clean streaks.
- **Combo meter** that visibly trembles as it grows — raising the stakes.
- **Reaction stats on death:** "You reacted in 180ms… to the wrong thing." Quantifies the betrayal, which is the funny part.
- **Shareable result card:** "Composure: 14. You cracked at the fake countdown." Built for "bet you can't beat me."

---

## 🎨 Juice & personality (what actually wins the room)
- **A sassy commentator** that roasts each death: *"Couldn't help yourself?" · "The grey dot. It was always the grey dot." · "Your thumbs have abandoned you."*
- **Screen-shake + red flash + buzzer** on a wrong tap; a satisfying soft chime for correct resists.
- **Rising heartbeat audio** as tension builds — silence is a weapon.
- **Tactile button physics** so the honeypot *feels* irresistible.
- A clean, minimal, high-contrast look — chaos comes from *behavior*, not clutter (keeps the art budget near zero).

---

## 🌗 Theme skins (same mechanics, different wrapper — pick one)
- **"Nerve"** — clinical neuroscience lab; you're a test subject. Cool, sleek.
- **"Office Reflexes"** — Microsoft-relatable: the traps are "Reply All," fake Teams pings, a tempting "Decline Meeting" button. Lands hard with your audience.
- **"Big Red Button"** — comedy: a doomsday console where one wrong press ends the world.
- **"Zen Master"** — you're a monk; tapping wrong shatters your calm. Ironic and pretty.

---

## 🛠️ Tech & scope
- **Stack:** pure static HTML/CSS/JS + a little Canvas/CSS animation. A simple state machine drives cues → input window → judge → escalate.
- **No backend, no AI.** Leaderboard via `localStorage`. Deploys to GitHub Pages / Azure Static Web Apps in minutes.
- **Build order:** ① core cue/judge loop + one trap → ② 4–5 traps + scoring → ③ juice (sound, shake, commentator) → ④ tutorial + share card → ⑤ stretch modes (Gauntlet, Duel).
- **Accessibility:** every cue pairs color with shape/text (color-blind safe); keyboard + touch + click all supported; optional reduced-motion mode.

## 💡 Why it gets *noticed*
Original mechanic, instantly understandable, *hilarious* to watch others fail, draws a crowd that all want a turn, and trivially shareable. Low build risk, high demo payoff — exactly the profile that wins internal hackathons.
