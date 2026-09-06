# AGENTS.md — Repository Operating Context & Commands

> [!NOTE]
> Global behavioral invariants (Single-task delivery contract, Ponytail anti-bloat ladder, Karpathy surgical execution, Fleet loop verification) are inherited globally from `~/.gemini/config/rules/global_rules.md`.

## 1. Project Commands & Deterministic Gates
- **Serve Locally**: `npm run serve` (runs `http-server -c-1`)
- **Test**: `npm test` (runs Vitest test suites)
- **Universal Verification**: `pwsh -File ./scripts/verify.ps1`
- **Audio & Spoken Completion Alert**: `pwsh -File ./scripts/agent-alarm.ps1 -Type Success -Message "Task complete."`

## 2. Repository Architecture & Layout
- `index.html`: Entrypoint web markup.
- `styles.css`: Complete styling and design system.
- `src/logic/`: Core game state machine, scene generator, scoring, rule epochs, judge, commentator.
- `src/io/`: Web Audio, DOM renderer, keyboard/touch input, persistence, and share cards.
- `src/**/*.test.js`: Colocated Vitest unit tests.
- `scripts/`: Local verification gates and agent alarm utilities.

## 3. Project-Specific Invariants & Conventions
- **Runtime**: Vanilla ES Modules (zero build-step static web app) and Node.js for test harness.
- **Testing Engine**: Vitest (`vitest run`).
- **Dependencies**: Zero runtime dependencies. devDependencies limited to `vitest`.
- **Skills & Rules**: Rely on global skills and rules (`~/.gemini/config/`) by default; project-scoped overrides in `.agents/` are used only when strictly necessary.

## 4. Ephemeral Memory (`WORKING.md`)
- Maintain active sprint objectives, test failure traces, hypotheses, and blockers in `WORKING.md`.
